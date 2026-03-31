import express from 'express';
import util from 'util';
import { execFile } from 'child_process';
import { GitService } from '../services/GitService.js';

const execFilePromise = util.promisify(execFile);
const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.get(
  '/path',
  asyncHandler(async (req, res) => {
    res.json({ path: GitService.getRepoPath() });
  }),
);

router.post(
  '/path',
  asyncHandler(async (req, res) => {
    const { path } = req.body;
    const newPath = await GitService.setRepoPath(path);
    res.json({ success: true, path: newPath });
  }),
);

router.post(
  '/repository',
  asyncHandler(async (req, res) => {
    const { action, path, url } = req.body;
    let repoPath;

    if (action === 'init') repoPath = await GitService.initRepository(path);
    else if (action === 'clone') repoPath = await GitService.cloneRepository(url, path);
    else {
      const error = new Error(`Unsupported repository action: ${action}`);
      error.statusCode = 400;
      throw error;
    }

    res.json({ success: true, path: repoPath });
  }),
);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const summary = await GitService.getRepositorySummary();
    res.json(summary);
  }),
);

router.get(
  '/pick-folder',
  asyncHandler(async (req, res) => {
    const psScript = `
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      $app = New-Object -ComObject Shell.Application
      $folder = $app.BrowseForFolder(0, 'Select Git Repository', 0, 0)
      if ($folder) { $folder.Self.Path }
    `;

    const { stdout } = await execFilePromise(
      'powershell',
      ['-NoProfile', '-Command', psScript],
      { encoding: 'utf8' },
    );
    const selectedPath = stdout.trim();

    if (!selectedPath) {
      res.json({ success: false });
      return;
    }

    res.json({ success: true, path: selectedPath });
  }),
);

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json(await GitService.status());
  }),
);

router.get(
  '/log',
  asyncHandler(async (req, res) => {
    const count = Number.parseInt(req.query.count, 10) || 50;
    res.json(await GitService.log(count));
  }),
);

router.get(
  '/commit-files',
  asyncHandler(async (req, res) => {
    res.json({ files: await GitService.commitFiles(req.query.commit) });
  }),
);

router.get(
  '/commit-diff',
  asyncHandler(async (req, res) => {
    res.json({ diff: await GitService.commitDiff(req.query.commit, req.query.file) });
  }),
);

router.get(
  '/branches',
  asyncHandler(async (req, res) => {
    res.json(await GitService.branches());
  }),
);

router.post(
  '/diff',
  asyncHandler(async (req, res) => {
    const { file, staged } = req.body;
    const diff = staged ? await GitService.diffStaged(file) : await GitService.diffInfo(file);
    res.json({ diff });
  }),
);

router.post(
  '/stage',
  asyncHandler(async (req, res) => {
    const response = await GitService.stage(req.body.files);
    res.json({ success: true, response });
  }),
);

router.post(
  '/unstage',
  asyncHandler(async (req, res) => {
    const response = await GitService.unstage(req.body.files);
    res.json({ success: true, response });
  }),
);

router.post(
  '/restore',
  asyncHandler(async (req, res) => {
    const response = await GitService.restore(req.body.files, req.body.staged);
    res.json({ success: true, response });
  }),
);

router.post(
  '/clean',
  asyncHandler(async (req, res) => {
    const response = await GitService.clean(req.body.forceDirectories !== false);
    res.json({ success: true, response });
  }),
);

router.post(
  '/commit',
  asyncHandler(async (req, res) => {
    const response = await GitService.commit(req.body.message, {
      amend: req.body.amend,
    });
    res.json({ success: true, response });
  }),
);

router.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const response = await GitService.checkout(req.body.target);
    res.json({ success: true, response });
  }),
);

router.post(
  '/checkout-file',
  asyncHandler(async (req, res) => {
    const response = await GitService.checkoutFileFromCommit(req.body.commit, req.body.file);
    res.json({ success: true, response });
  }),
);

router.post(
  '/fetch',
  asyncHandler(async (req, res) => {
    const response = await GitService.fetch();
    res.json({ success: true, response });
  }),
);

router.post(
  '/push',
  asyncHandler(async (req, res) => {
    const response = await GitService.push();
    res.json({ success: true, response });
  }),
);

router.post(
  '/pull',
  asyncHandler(async (req, res) => {
    const response = await GitService.pull();
    res.json({ success: true, response });
  }),
);

router.get(
  '/remotes',
  asyncHandler(async (req, res) => {
    res.json({ all: await GitService.remotes() });
  }),
);

router.post(
  '/remote',
  asyncHandler(async (req, res) => {
    const { action, name, url } = req.body;
    let response;

    if (action === 'add') response = await GitService.addRemote(name, url);
    else if (action === 'remove') response = await GitService.removeRemote(name);
    else if (action === 'set-url') response = await GitService.setRemoteUrl(name, url);
    else {
      const error = new Error(`Unsupported remote action: ${action}`);
      error.statusCode = 400;
      throw error;
    }

    res.json({ success: true, response });
  }),
);

router.post(
  '/branch',
  asyncHandler(async (req, res) => {
    const { action, name } = req.body;
    let response;

    if (action === 'create') response = await GitService.createBranch(name);
    else if (action === 'delete') response = await GitService.deleteBranch(name);
    else if (action === 'merge') response = await GitService.merge(name);
    else {
      const error = new Error(`Unsupported branch action: ${action}`);
      error.statusCode = 400;
      throw error;
    }

    res.json({ success: true, response });
  }),
);

router.get(
  '/stash',
  asyncHandler(async (req, res) => {
    res.json(await GitService.stashList());
  }),
);

router.post(
  '/stash',
  asyncHandler(async (req, res) => {
    const { action, message, index } = req.body;
    let response;

    if (action === 'save') response = await GitService.stashSave(message);
    else if (action === 'pop') response = await GitService.stashPop(index);
    else if (action === 'drop') response = await GitService.stashDrop(index);
    else {
      const error = new Error(`Unsupported stash action: ${action}`);
      error.statusCode = 400;
      throw error;
    }

    res.json({ success: true, response });
  }),
);

router.post(
  '/reset',
  asyncHandler(async (req, res) => {
    const response = await GitService.reset(req.body.mode, req.body.commit);
    res.json({ success: true, response });
  }),
);

router.post(
  '/revert',
  asyncHandler(async (req, res) => {
    const response = await GitService.revert(req.body.commit);
    res.json({ success: true, response });
  }),
);

router.post(
  '/cherry-pick',
  asyncHandler(async (req, res) => {
    const response = await GitService.cherryPick(req.body.commit);
    res.json({ success: true, response });
  }),
);

router.post(
  '/rebase',
  asyncHandler(async (req, res) => {
    const response = await GitService.rebase(req.body.branch);
    res.json({ success: true, response });
  }),
);

router.get(
  '/tags',
  asyncHandler(async (req, res) => {
    res.json(await GitService.tags());
  }),
);

router.post(
  '/tag',
  asyncHandler(async (req, res) => {
    const { action, name, commit } = req.body;
    let response;

    if (!action || action === 'create') response = await GitService.addTag(name, commit);
    else if (action === 'delete') response = await GitService.deleteTag(name);
    else {
      const error = new Error(`Unsupported tag action: ${action}`);
      error.statusCode = 400;
      throw error;
    }

    res.json({ success: true, response });
  }),
);

router.get(
  '/reflog',
  asyncHandler(async (req, res) => {
    res.json({ reflog: await GitService.reflog() });
  }),
);

router.post(
  '/blame',
  asyncHandler(async (req, res) => {
    res.json({ blame: await GitService.blame(req.body.file) });
  }),
);

router.post(
  '/run',
  asyncHandler(async (req, res) => {
    const response = await GitService.run(req.body.args);
    res.json({ success: true, output: response });
  }),
);

export default router;
