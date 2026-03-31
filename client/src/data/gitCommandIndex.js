const RAW_COMMAND_INDEX = `
Main Porcelain Commands
add|Add file contents to the index
am|Apply a series of patches from a mailbox
archive|Create an archive of files from a named tree
backfill|Download missing objects in a partial clone
bisect|Use binary search to find the commit that introduced a bug
branch|List, create, or delete branches
bundle|Move objects and refs by archive
checkout|Switch branches or restore working tree files
cherry-pick|Apply the changes introduced by some existing commits
citool|Graphical alternative to git-commit
clean|Remove untracked files from the working tree
clone|Clone a repository into a new directory
commit|Record changes to the repository
describe|Give an object a human readable name based on an available ref
diff|Show changes between commits, commit and working tree, etc
fetch|Download objects and refs from another repository
format-patch|Prepare patches for e-mail submission
gc|Cleanup unnecessary files and optimize the local repository
gitk|The Git repository browser
grep|Print lines matching a pattern
gui|A portable graphical interface to Git
init|Create an empty Git repository or reinitialize an existing one
log|Show commit logs
maintenance|Run tasks to optimize Git repository data
merge|Join two or more development histories together
mv|Move or rename a file, a directory, or a symlink
notes|Add or inspect object notes
pull|Fetch from and integrate with another repository or a local branch
push|Update remote refs along with associated objects
range-diff|Compare two commit ranges (e.g. two versions of a branch)
rebase|Reapply commits on top of another base tip
reset|Set HEAD or the index to a known state
restore|Restore working tree files
revert|Revert some existing commits
rm|Remove files from the working tree and from the index
scalar|A tool for managing large Git repositories
shortlog|Summarize git log output
show|Show various types of objects
sparse-checkout|Reduce your working tree to a subset of tracked files
stash|Stash the changes in a dirty working directory away
status|Show the working tree status
submodule|Initialize, update or inspect submodules
survey|EXPERIMENTAL: Measure various repository dimensions of scale
switch|Switch branches
tag|Create, list, delete or verify tags
worktree|Manage multiple working trees

Ancillary Commands / Manipulators
config|Get and set repository or global options
fast-export|Git data exporter
fast-import|Backend for fast Git data importers
filter-branch|Rewrite branches
mergetool|Run merge conflict resolution tools to resolve merge conflicts
pack-refs|Pack heads and tags for efficient repository access
prune|Prune all unreachable objects from the object database
reflog|Manage reflog information
refs|Low-level access to refs
remote|Manage set of tracked repositories
repack|Pack unpacked objects in a repository
replace|Create, list, delete refs to replace objects

Ancillary Commands / Interrogators
annotate|Annotate file lines with commit information
blame|Show what revision and author last modified each line of a file
bugreport|Collect information for user to file a bug report
count-objects|Count unpacked number of objects and their disk consumption
diagnose|Generate a zip archive of diagnostic information
difftool|Show changes using common diff tools
fsck|Verifies the connectivity and validity of the objects in the database
gitweb|Git web interface (web frontend to Git repositories)
help|Display help information about Git
instaweb|Instantly browse your working repository in gitweb
merge-tree|Perform merge without touching index or working tree
rerere|Reuse recorded resolution of conflicted merges
show-branch|Show branches and their commits
verify-commit|Check the GPG signature of commits
verify-tag|Check the GPG signature of tags
version|Display version information about Git
whatchanged|Show logs with differences each commit introduces

Interacting with Others
archimport|Import a GNU Arch repository into Git
cvsexportcommit|Export a single commit to a CVS checkout
cvsimport|Salvage your data out of another SCM people love to hate
cvsserver|A CVS server emulator for Git
imap-send|Send a collection of patches from stdin to an IMAP folder
p4|Import from and submit to Perforce repositories
quiltimport|Applies a quilt patchset onto the current branch
request-pull|Generates a summary of pending changes
send-email|Send a collection of patches as emails
svn|Bidirectional operation between a Subversion repository and Git

Low-level Commands / Manipulators
apply|Apply a patch to files and/or to the index
checkout-index|Copy files from the index to the working tree
commit-graph|Write and verify Git commit-graph files
commit-tree|Create a new commit object
hash-object|Compute object ID and optionally create an object from a file
index-pack|Build pack index file for an existing packed archive
merge-file|Run a three-way file merge
merge-index|Run a merge for files needing merging
mktag|Creates a tag object with extra validation
mktree|Build a tree-object from ls-tree formatted text
multi-pack-index|Write and verify multi-pack-indexes
pack-objects|Create a packed archive of objects
prune-packed|Remove extra objects that are already in pack files
read-tree|Reads tree information into the index
replay|EXPERIMENTAL: Replay commits on a new base, works with bare repos too
symbolic-ref|Read, modify and delete symbolic refs
unpack-objects|Unpack objects from a packed archive
update-index|Register file contents in the working tree to the index
update-ref|Update the object name stored in a ref safely
write-tree|Create a tree object from the current index

Low-level Commands / Interrogators
cat-file|Provide contents or details of repository objects
cherry|Find commits yet to be applied to upstream
diff-files|Compares files in the working tree and the index
diff-index|Compare a tree to the working tree or index
diff-pairs|Compare the content and mode of provided blob pairs
diff-tree|Compares the content and mode of blobs found via two tree objects
for-each-ref|Output information on each ref
for-each-repo|Run a Git command on a list of repositories
get-tar-commit-id|Extract commit ID from an archive created using git-archive
last-modified|EXPERIMENTAL: Show when files were last modified
ls-files|Show information about files in the index and the working tree
ls-remote|List references in a remote repository
ls-tree|List the contents of a tree object
merge-base|Find as good common ancestors as possible for a merge
name-rev|Find symbolic names for given revs
pack-redundant|Find redundant pack files
repo|Retrieve information about the repository
rev-list|Lists commit objects in reverse chronological order
rev-parse|Pick out and massage parameters
show-index|Show packed archive index
show-ref|List references in a local repository
unpack-file|Creates a temporary file with a blob's contents
var|Show a Git logical variable
verify-pack|Validate packed Git archive files

Low-level Commands / Syncing Repositories
daemon|A really simple server for Git repositories
fetch-pack|Receive missing objects from another repository
http-backend|Server side implementation of Git over HTTP
send-pack|Push objects over Git protocol to another repository
update-server-info|Update auxiliary info file to help dumb servers

Low-level Commands / Internal Helpers
check-attr|Display gitattributes information
check-ignore|Debug gitignore / exclude files
check-mailmap|Show canonical names and email addresses of contacts
check-ref-format|Ensures that a reference name is well formed
column|Display data in columns
credential|Retrieve and store user credentials
credential-cache|Helper to temporarily store passwords in memory
credential-store|Helper to store credentials on disk
fmt-merge-msg|Produce a merge commit message
hook|Run git hooks
interpret-trailers|Add or parse structured information in commit messages
mailinfo|Extracts patch and authorship from a single e-mail message
mailsplit|Simple UNIX mbox splitter program
merge-one-file|The standard helper program to use with git-merge-index
patch-id|Compute unique ID for a patch
sh-i18n|Git's i18n setup code for shell scripts
sh-setup|Common Git shell script setup code
stripspace|Remove unnecessary whitespace
`;

const CATEGORY_TITLES = {
  en: {
    'Main Porcelain Commands': 'Main Porcelain Commands',
    'Ancillary Commands / Manipulators': 'Ancillary Commands / Manipulators',
    'Ancillary Commands / Interrogators': 'Ancillary Commands / Interrogators',
    'Interacting with Others': 'Interacting with Others',
    'Low-level Commands / Manipulators': 'Low-level Commands / Manipulators',
    'Low-level Commands / Interrogators': 'Low-level Commands / Interrogators',
    'Low-level Commands / Syncing Repositories': 'Low-level Commands / Syncing Repositories',
    'Low-level Commands / Internal Helpers': 'Low-level Commands / Internal Helpers',
  },
  zh: {
    'Main Porcelain Commands': '常用主命令',
    'Ancillary Commands / Manipulators': '辅助命令 / 修改类',
    'Ancillary Commands / Interrogators': '辅助命令 / 查询类',
    'Interacting with Others': '与其他系统交互',
    'Low-level Commands / Manipulators': '底层命令 / 修改类',
    'Low-level Commands / Interrogators': '底层命令 / 查询类',
    'Low-level Commands / Syncing Repositories': '底层命令 / 仓库同步类',
    'Low-level Commands / Internal Helpers': '底层命令 / 内部辅助类',
  },
};

const ZH_DESCRIPTIONS = {
  add: '把文件内容加入暂存区。',
  am: '从邮箱格式补丁中应用一系列补丁。',
  archive: '从指定树对象创建归档文件。',
  backfill: '为部分克隆下载缺失对象。',
  bisect: '用二分查找定位引入问题的提交。',
  branch: '列出、创建或删除分支。',
  bundle: '通过归档方式移动对象和引用。',
  checkout: '切换分支，或恢复工作区文件。',
  'cherry-pick': '把已有提交的改动应用到当前分支。',
  citool: '图形化的 git commit 替代工具。',
  clean: '删除工作区中未跟踪的文件。',
  clone: '把远程仓库克隆到新目录。',
  commit: '记录一次提交。',
  describe: '基于现有引用为对象生成可读名称。',
  diff: '查看提交、工作区和暂存区之间的差异。',
  fetch: '从远程下载对象和引用。',
  'format-patch': '生成适合邮件发送的补丁文件。',
  gc: '清理无用文件并优化本地仓库。',
  gitk: 'Git 仓库浏览器。',
  grep: '按模式搜索文本行。',
  gui: 'Git 的图形界面工具。',
  init: '创建空仓库或重新初始化现有仓库。',
  log: '查看提交日志。',
  maintenance: '执行仓库优化维护任务。',
  merge: '合并两条或多条开发历史。',
  mv: '移动或重命名文件、目录或符号链接。',
  notes: '添加或查看对象备注。',
  pull: '抓取并合并远程分支。',
  push: '把本地引用和对象推送到远程。',
  'range-diff': '比较两个提交范围。',
  rebase: '把提交重新应用到新的基线上。',
  reset: '把 HEAD 或暂存区重置到指定状态。',
  restore: '恢复工作区文件。',
  revert: '撤销已有提交。',
  rm: '从工作区和暂存区删除文件。',
  scalar: '管理大型 Git 仓库的工具。',
  shortlog: '汇总 git log 输出。',
  show: '显示对象、提交或标签详情。',
  'sparse-checkout': '把工作区限制到受控子集。',
  stash: '临时保存当前工作区改动。',
  status: '显示工作区状态。',
  submodule: '初始化、更新或检查子模块。',
  survey: '实验性：测量仓库规模维度。',
  switch: '切换分支。',
  tag: '创建、列出、删除或校验标签。',
  worktree: '管理多个工作树。',
  config: '读取和设置仓库或全局配置。',
  'fast-export': '导出 Git 数据。',
  'fast-import': '快速导入 Git 数据的后端。',
  'filter-branch': '重写分支历史。',
  mergetool: '调用合并工具解决冲突。',
  'pack-refs': '压缩 heads 和 tags 提高访问效率。',
  prune: '删除所有不可达对象。',
  reflog: '管理引用日志信息。',
  refs: '低层访问 Git 引用。',
  remote: '管理跟踪的远程仓库集合。',
  repack: '重新打包仓库中的松散对象。',
  replace: '创建、列出或删除对象替换引用。',
  annotate: '按提交信息标注文件行。',
  blame: '显示每一行最后一次由谁修改。',
  bugreport: '收集用于提交 bug 的诊断信息。',
  'count-objects': '统计未打包对象及磁盘占用。',
  diagnose: '生成诊断信息压缩包。',
  difftool: '用外部差异工具查看改动。',
  fsck: '检查对象数据库的连通性和有效性。',
  gitweb: 'Git 的 Web 前端。',
  help: '查看 Git 帮助。',
  instaweb: '快速用 gitweb 浏览当前仓库。',
  'merge-tree': '在不改工作区的情况下执行合并计算。',
  rerere: '复用已记录的冲突解决方案。',
  'show-branch': '显示分支及其提交。',
  'verify-commit': '校验提交的 GPG 签名。',
  'verify-tag': '校验标签的 GPG 签名。',
  version: '显示 Git 版本信息。',
  whatchanged: '显示日志以及每次提交引入的差异。',
  archimport: '把 GNU Arch 仓库导入 Git。',
  cvsexportcommit: '把单个提交导出到 CVS 工作区。',
  cvsimport: '把 CVS 等旧系统数据导入 Git。',
  cvsserver: 'Git 的 CVS 服务器模拟器。',
  'imap-send': '把补丁集合发送到 IMAP 文件夹。',
  p4: '与 Perforce 双向交互。',
  quiltimport: '把 quilt 补丁集应用到当前分支。',
  'request-pull': '生成待合并改动摘要。',
  'send-email': '通过邮件发送补丁集合。',
  svn: '与 Subversion 仓库双向操作。',
  apply: '把补丁应用到文件或暂存区。',
  'checkout-index': '把暂存区内容检出到工作区。',
  'commit-graph': '写入并验证 commit-graph 文件。',
  'commit-tree': '创建新的提交对象。',
  'hash-object': '计算对象 ID，必要时创建对象。',
  'index-pack': '为现有打包文件创建索引。',
  'merge-file': '执行三方文件合并。',
  'merge-index': '为需要合并的文件执行合并。',
  mktag: '创建并额外校验标签对象。',
  mktree: '从 ls-tree 文本构建树对象。',
  'multi-pack-index': '写入并验证多 pack 索引。',
  'pack-objects': '创建对象打包归档。',
  'prune-packed': '删除已在 pack 文件中的冗余对象。',
  'read-tree': '把树信息读入暂存区。',
  replay: '实验性：把提交重放到新的基线上。',
  'symbolic-ref': '读取、修改或删除符号引用。',
  'unpack-objects': '解包打包归档中的对象。',
  'update-index': '把工作区内容注册到暂存区。',
  'update-ref': '安全地更新引用指向。',
  'write-tree': '从当前暂存区创建树对象。',
  'cat-file': '显示仓库对象内容或详细信息。',
  cherry: '找出尚未应用到上游的提交。',
  'diff-files': '比较工作区和暂存区文件。',
  'diff-index': '比较树对象与工作区或暂存区。',
  'diff-pairs': '比较指定 blob 对的内容和模式。',
  'diff-tree': '比较两个树对象之间的 blob 变化。',
  'for-each-ref': '遍历并输出每个引用的信息。',
  'for-each-repo': '在一组仓库上运行 Git 命令。',
  'get-tar-commit-id': '从 git archive 生成的归档中提取提交 ID。',
  'last-modified': '实验性：显示文件最后修改时间。',
  'ls-files': '显示暂存区和工作区文件信息。',
  'ls-remote': '列出远程仓库中的引用。',
  'ls-tree': '列出树对象内容。',
  'merge-base': '寻找最佳公共祖先。',
  'name-rev': '为给定提交寻找符号名称。',
  'pack-redundant': '查找冗余的 pack 文件。',
  repo: '获取仓库信息。',
  'rev-list': '按逆时间顺序列出提交对象。',
  'rev-parse': '解析并整理版本参数。',
  'show-index': '显示打包归档索引。',
  'show-ref': '列出本地引用。',
  'unpack-file': '创建包含 blob 内容的临时文件。',
  var: '显示 Git 逻辑变量。',
  'verify-pack': '校验 pack 文件。',
  daemon: '简单的 Git 仓库服务端。',
  'fetch-pack': '从另一个仓库接收缺失对象。',
  'http-backend': 'Git over HTTP 的服务端实现。',
  'send-pack': '通过 Git 协议推送对象。',
  'update-server-info': '更新供 dumb server 使用的辅助信息。',
  'check-attr': '显示 gitattributes 信息。',
  'check-ignore': '调试 gitignore / exclude 规则。',
  'check-mailmap': '显示规范化后的作者姓名和邮箱。',
  'check-ref-format': '检查引用名格式是否正确。',
  column: '按列展示数据。',
  credential: '读取和存储用户凭据。',
  'credential-cache': '在内存中临时缓存密码。',
  'credential-store': '把凭据保存到磁盘。',
  'fmt-merge-msg': '生成合并提交说明。',
  hook: '运行 Git hooks。',
  'interpret-trailers': '添加或解析提交说明中的结构化尾注。',
  mailinfo: '从邮件中提取补丁和作者信息。',
  mailsplit: '简单的 mbox 邮件分割工具。',
  'merge-one-file': '供 git-merge-index 使用的标准单文件合并工具。',
  'patch-id': '计算补丁的唯一标识。',
  'sh-i18n': 'Git Shell 脚本的国际化辅助代码。',
  'sh-setup': 'Git Shell 脚本的公共初始化代码。',
  stripspace: '移除多余空白字符。',
};

const COMMAND_EXAMPLES = {
  add: {
    en: ['git add .', 'git add src/App.jsx'],
    zh: ['git add .', 'git add src/App.jsx'],
  },
  branch: {
    en: ['git branch', 'git branch feature/docs'],
    zh: ['git branch', 'git branch feature/docs'],
  },
  checkout: {
    en: ['git checkout master', 'git checkout HEAD~1 -- src/App.jsx'],
    zh: ['git checkout master', 'git checkout HEAD~1 -- src/App.jsx'],
  },
  clone: {
    en: ['git clone https://github.com/user/repo.git', 'git clone <url> my-folder'],
    zh: ['git clone https://github.com/user/repo.git', 'git clone <url> my-folder'],
  },
  commit: {
    en: ['git commit -m "feat: add docs"', 'git commit --amend'],
    zh: ['git commit -m "feat: add docs"', 'git commit --amend'],
  },
  diff: {
    en: ['git diff', 'git diff --staged'],
    zh: ['git diff', 'git diff --staged'],
  },
  fetch: {
    en: ['git fetch origin', 'git fetch --all --prune'],
    zh: ['git fetch origin', 'git fetch --all --prune'],
  },
  init: {
    en: ['git init', 'git init my-repo'],
    zh: ['git init', 'git init my-repo'],
  },
  log: {
    en: ['git log --oneline --graph', 'git log --stat'],
    zh: ['git log --oneline --graph', 'git log --stat'],
  },
  merge: {
    en: ['git merge feature/docs', 'git merge --no-ff feature/docs'],
    zh: ['git merge feature/docs', 'git merge --no-ff feature/docs'],
  },
  pull: {
    en: ['git pull', 'git pull --rebase'],
    zh: ['git pull', 'git pull --rebase'],
  },
  push: {
    en: ['git push origin master', 'git push --tags'],
    zh: ['git push origin master', 'git push --tags'],
  },
  rebase: {
    en: ['git rebase master', 'git rebase --continue'],
    zh: ['git rebase master', 'git rebase --continue'],
  },
  reset: {
    en: ['git reset --mixed HEAD~1', 'git reset --hard HEAD'],
    zh: ['git reset --mixed HEAD~1', 'git reset --hard HEAD'],
  },
  restore: {
    en: ['git restore src/App.jsx', 'git restore --staged src/App.jsx'],
    zh: ['git restore src/App.jsx', 'git restore --staged src/App.jsx'],
  },
  revert: {
    en: ['git revert <commit>', 'git revert --no-commit <commit>'],
    zh: ['git revert <commit>', 'git revert --no-commit <commit>'],
  },
  stash: {
    en: ['git stash push -m "wip"', 'git stash pop'],
    zh: ['git stash push -m "wip"', 'git stash pop'],
  },
  status: {
    en: ['git status', 'git status -sb'],
    zh: ['git status', 'git status -sb'],
  },
  tag: {
    en: ['git tag v1.0.0', 'git tag -d v1.0.0'],
    zh: ['git tag v1.0.0', 'git tag -d v1.0.0'],
  },
};

function buildFallbackExamples(command) {
  return [`git ${command}`, `git ${command} --help`];
}

export function getGitCommandDocs(language = 'en') {
  const categories = [];
  let current = null;

  RAW_COMMAND_INDEX.trim().split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    if (!line.includes('|')) {
      current = {
        key: line.trim(),
        title: CATEGORY_TITLES[language]?.[line.trim()] || line.trim(),
        commands: [],
      };
      categories.push(current);
      return;
    }

    const [name, description] = line.split('|');
    const examples = COMMAND_EXAMPLES[name]?.[language] || buildFallbackExamples(name);
    current.commands.push({
      name,
      description: language === 'zh' ? (ZH_DESCRIPTIONS[name] || description) : description,
      examples,
    });
  });

  return categories;
}
