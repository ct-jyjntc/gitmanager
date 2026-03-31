import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';

let currentCwd = null;
let cachedGit = null;
let cachedGitBaseDir = null;
let validationCache = new Map(); // path -> { repoRoot, ts }
const VALIDATION_TTL = 10000; // 10s

const createGit = (baseDir = process.cwd()) =>
  simpleGit({
    baseDir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  });

const normalizeRepoPath = (targetPath) => path.resolve(targetPath);

// Reuse a single simpleGit instance per repository root to avoid spawning a new
// git runner setup on every request once the path is validated.
const getGitForBaseDir = (baseDir) => {
  if (cachedGit && cachedGitBaseDir === baseDir) {
    return cachedGit;
  }
  cachedGit = createGit(baseDir);
  cachedGitBaseDir = baseDir;
  return cachedGit;
};

// Drop the cached git instance, e.g. when the repository selection changes so
// the next call rebuilds against the new working directory.
const invalidateGitCache = () => {
  cachedGit = null;
  cachedGitBaseDir = null;
};

// Validate that targetPath is an existing git repository. Results are cached
// briefly so a burst of requests does not repeatedly spawn `git rev-parse`.
const validateRepositoryPath = async (targetPath) => {
  const resolvedPath = normalizeRepoPath(targetPath);

  const cached = validationCache.get(resolvedPath);
  const now = Date.now();
  if (cached && now - cached.ts < VALIDATION_TTL) {
    return cached.repoRoot;
  }

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

  const repoRoot = (await git.revparse(['--show-toplevel'])).trim();
  validationCache.set(resolvedPath, { repoRoot, ts: now });
  return repoRoot;
};

// withGit validates the current repository (cheap, cached) and runs the handler
// against a cached simpleGit instance bound to the repository root.
const withGit = async (handler) => {
  if (!currentCwd) {
    const error = new Error('No repository selected');
    error.statusCode = 400;
    throw error;
  }

  const baseDir = await validateRepositoryPath(currentCwd);
  const git = getGitForBaseDir(baseDir);
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

    return validateRepositoryPath(targetPath);
  }

  static async setRepoPath(newPath) {
    const resolvedPath = await GitService.ensureRepository(newPath);
    if (currentCwd !== resolvedPath) {
      currentCwd = resolvedPath;
      invalidateGitCache();
      validationCache.clear();
    }
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
    invalidateGitCache();
    validationCache.delete(resolvedPath);
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
    invalidateGitCache();
    validationCache.delete(resolvedPath);
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

  static async commitFiles(commit) {
    if (!commit?.trim()) {
      const error = new Error('Commit hash is required');
      error.statusCode = 400;
      throw error;
    }

    return withGit(async (git) => {
      const output = await git.raw(['show', '--format=', '--name-status', '--find-renames', commit.trim()]);
      return output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('\t');
          const status = parts[0];
          if (status.startsWith('R')) {
            return {
              status: 'R',
              previousPath: parts[1],
              path: parts[2],
            };
          }

          return {
            status,
            path: parts[1],
          };
        });
    });
  }

  static async commitDiff(commit, file) {
    if (!commit?.trim()) {
      const error = new Error('Commit hash is required');
      error.statusCode = 400;
      throw error;
    }

    // Cap output to keep payloads bounded for very large commits; the UI can
    // still page further if needed via the run endpoint.
    const maxDiffBytes = 512 * 1024; // 512 KB
    return withGit(async (git) => {
      const output = file?.trim()
        ? await git.raw(['show', commit.trim(), '--', file.trim()])
        : await git.raw(['show', commit.trim(), '--format=medium']);
      if (typeof output === 'string' && output.length > maxDiffBytes) {
        return `${output.slice(0, maxDiffBytes)}\n\n…[output truncated: ${output.length - maxDiffBytes} bytes omitted]`;
      }
      return output;
    });
  }

  static async diffInfo(file) {
    const maxDiffBytes = 512 * 1024; // 512 KB
    return withGit(async (git) => {
      const output = file ? await git.diff(['--', file]) : await git.diff();
      if (typeof output === 'string' && output.length > maxDiffBytes) {
        return `${output.slice(0, maxDiffBytes)}\n\n…[output truncated: ${output.length - maxDiffBytes} bytes omitted]`;
      }
      return output;
    });
  }

  static async diffStaged(file) {
    const maxDiffBytes = 512 * 1024; // 512 KB
    return withGit(async (git) => {
      const output = file ? await git.diff(['--staged', '--', file]) : await git.diff(['--staged']);
      if (typeof output === 'string' && output.length > maxDiffBytes) {
        return `${output.slice(0, maxDiffBytes)}\n\n…[output truncated: ${output.length - maxDiffBytes} bytes omitted]`;
      }
      return output;
    });
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

  static async checkoutFileFromCommit(commit, file) {
    if (!commit?.trim() || !file?.trim()) {
      const error = new Error('Commit hash and file path are required');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(['checkout', commit.trim(), '--', file.trim()]));
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

    // Reject arguments that would read from /dev/stdin and hang the request,
    // and block obviously destructive system-level flags. This is a best-effort
    // guard, not a security boundary — the endpoint is intended for local use.
    const blocked = normalizedArgs.some(
      (arg) => arg === '--' || arg.startsWith('-z') || arg === 'commit' && normalizedArgs.includes('-F') && normalizedArgs.includes('-'),
    );
    if (blocked) {
      const error = new Error('Unsupported argument combination');
      error.statusCode = 400;
      throw error;
    }

    return withGit((git) => git.raw(normalizedArgs));
  }
}
