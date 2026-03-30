import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';

let currentCwd = null;

const createGit = (baseDir = process.cwd()) =>
  simpleGit({
    baseDir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  });

const normalizeRepoPath = (targetPath) => path.resolve(targetPath);

const withGit = async (handler) => {
  const baseDir = await GitService.ensureRepository();
  const git = createGit(baseDir);
  return handler(git);
};

export class GitService {
  static getRepoPath() {
    return currentCwd || '';
  }

  static async ensureRepository(targetPath = currentCwd) {
    if (!targetPath) {
      const error = new Error('No repository selected');
      error.statusCode = 400;
      throw error;
    }

    const resolvedPath = normalizeRepoPath(targetPath);

    if (!fs.existsSync(resolvedPath)) {
      const error = new Error(`Repository path does not exist: ${resolvedPath}`);
      error.statusCode = 400;
      throw error;
    }

    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      const error = new Error(`Repository path is not a directory: ${resolvedPath}`);
      error.statusCode = 400;
      throw error;
    }

    const git = createGit(resolvedPath);
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      const error = new Error(`Selected path is not a Git repository: ${resolvedPath}`);
      error.statusCode = 400;
      throw error;
    }

    const repoRoot = await git.revparse(['--show-toplevel']);
    return repoRoot.trim();
  }

  static async setRepoPath(newPath) {
    const resolvedPath = await GitService.ensureRepository(newPath);
    currentCwd = resolvedPath;
    return currentCwd;
  }

  static async initRepository(targetPath) {
    if (!targetPath?.trim()) {
      const error = new Error('Target path is required');
      error.statusCode = 400;
      throw error;
    }

    const resolvedPath = normalizeRepoPath(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      const error = new Error(`Target path is not a directory: ${resolvedPath}`);
      error.statusCode = 400;
      throw error;
    }

    const git = createGit(resolvedPath);
    await git.init();
    currentCwd = resolvedPath;
    return resolvedPath;
  }

  static async cloneRepository(url, targetPath) {
    if (!url?.trim() || !targetPath?.trim()) {
      const error = new Error('Clone url and target path are required');
      error.statusCode = 400;
      throw error;
    }

    const resolvedPath = normalizeRepoPath(targetPath);
    const parentPath = path.dirname(resolvedPath);
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath, { recursive: true });
    }

    const git = createGit(parentPath);
    await git.clone(url.trim(), resolvedPath);
    currentCwd = await GitService.ensureRepository(resolvedPath);
    return currentCwd;
  }

  static async getRepositorySummary() {
    if (!currentCwd) {
      return {
        path: '',
        branch: '',
        isClean: true,
        ahead: 0,
        behind: 0,
        remotes: [],
        tagCount: 0,
        selected: false,
      };
    }

    return withGit(async (git) => {
      const [status, branches, remotes, tags] = await Promise.all([
        git.status(),
        git.branch(['-a']),
        git.getRemotes(true),
        git.tags(),
      ]);

      return {
        path: currentCwd,
        branch: branches.current,
        isClean: status.isClean(),
        ahead: status.ahead,
        behind: status.behind,
        remotes,
        tagCount: tags.all.length,
        selected: true,
      };
    });
  }

  static async remotes() {
    return withGit((git) => git.getRemotes(true));
  }

  static async status() {
    return withGit((git) => git.status());
  }

  static async log(maxCount = 50) {
    return withGit((git) => git.log({ maxCount }));
  }

  static async diffInfo(file) {
    return withGit((git) => (file ? git.diff(['--', file]) : git.diff()));
  }

  static async diffStaged(file) {
    return withGit((git) => (file ? git.diff(['--staged', '--', file]) : git.diff(['--staged'])));
  }

  static async stage(files) {
    return withGit((git) => {
      const targetFiles = Array.isArray(files) ? files : [files];
      return git.add(targetFiles);
    });
  }

  static async unstage(files) {
    return withGit((git) => {
      const targetFiles = Array.isArray(files) ? files : [files];
      return git.reset(['HEAD', '--', ...targetFiles]);
    });
  }

  static async restore(files, staged = false) {
    return withGit((git) => {
      const targetFiles = Array.isArray(files) ? files : [files];
      const args = ['restore'];
      if (staged) args.push('--staged');
      args.push('--', ...targetFiles);
      return git.raw(args);
    });
  }

  static async clean(forceDirectories = true) {
    return withGit((git) => git.raw(forceDirectories ? ['clean', '-fd'] : ['clean', '-f']));
  }

  static async commit(message, options = {}) {
    if (!message?.trim()) {
      const error = new Error('Commit message is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) =>
      git.commit(message.trim(), undefined, {
        '--amend': Boolean(options.amend),
      }),
    );
  }

  static async checkout(branchOrFile) {
    if (!branchOrFile?.trim()) {
      const error = new Error('Checkout target is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.checkout(branchOrFile.trim()));
  }

  static async branches() {
    return withGit((git) => git.branch(['-a']));
  }

  static async fetch() {
    return withGit((git) => git.fetch());
  }

  static async push() {
    return withGit((git) => git.push());
  }

  static async pull() {
    return withGit((git) => git.pull());
  }

  static async addRemote(name, url) {
    if (!name?.trim() || !url?.trim()) {
      const error = new Error('Remote name and url are required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.addRemote(name.trim(), url.trim()));
  }

  static async removeRemote(name) {
    if (!name?.trim()) {
      const error = new Error('Remote name is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.removeRemote(name.trim()));
  }

  static async setRemoteUrl(name, url) {
    if (!name?.trim() || !url?.trim()) {
      const error = new Error('Remote name and url are required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.remote(['set-url', name.trim(), url.trim()]));
  }

  static async createBranch(name) {
    if (!name?.trim()) {
      const error = new Error('Branch name is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.checkoutLocalBranch(name.trim()));
  }

  static async deleteBranch(name) {
    if (!name?.trim()) {
      const error = new Error('Branch name is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.deleteLocalBranch(name.trim(), true));
  }

  static async merge(name) {
    if (!name?.trim()) {
      const error = new Error('Merge source branch is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.merge([name.trim()]));
  }

  static async stashList() {
    return withGit((git) => git.stashList());
  }

  static async stashSave(message) {
    return withGit((git) =>
      message?.trim() ? git.stash(['push', '-m', message.trim()]) : git.stash(['push'])
    );
  }

  static async stashPop(index = 0) {
    return withGit((git) => git.raw(['stash', 'pop', `stash@{${index}}`]));
  }

  static async stashDrop(index = 0) {
    return withGit((git) => git.raw(['stash', 'drop', `stash@{${index}}`]));
  }

  static async reset(mode, commit = 'HEAD') {
    const allowedModes = new Set(['--hard', '--soft', '--mixed']);
    if (!allowedModes.has(mode)) {
      const error = new Error(`Invalid reset mode: ${mode}`);
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.reset([mode, commit]));
  }

  static async revert(commit) {
    if (!commit?.trim()) {
      const error = new Error('Commit hash is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.revert(commit.trim()));
  }

  static async cherryPick(commit) {
    if (!commit?.trim()) {
      const error = new Error('Commit hash is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(['cherry-pick', commit.trim()]));
  }

  static async rebase(branch) {
    if (!branch?.trim()) {
      const error = new Error('Rebase target branch is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.rebase([branch.trim()]));
  }

  static async tags() {
    return withGit((git) => git.tags());
  }

  static async addTag(name, commit = 'HEAD') {
    if (!name?.trim()) {
      const error = new Error('Tag name is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(['tag', name.trim(), commit || 'HEAD']));
  }

  static async deleteTag(name) {
    if (!name?.trim()) {
      const error = new Error('Tag name is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(['tag', '-d', name.trim()]));
  }

  static async reflog() {
    return withGit((git) => git.raw(['reflog', '-n', '50']));
  }

  static async blame(file) {
    if (!file?.trim()) {
      const error = new Error('File path is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(['blame', file.trim()]));
  }

  static async run(args) {
    if (!Array.isArray(args) || args.length === 0) {
      const error = new Error('At least one git argument is required');
      error.statusCode = 400;
      throw error;
    }

    const normalizedArgs = args
      .map((item) => `${item ?? ''}`.trim())
      .filter(Boolean);

    if (normalizedArgs.length === 0) {
      const error = new Error('At least one git argument is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(normalizedArgs));
  }
}
