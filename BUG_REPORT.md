# GitM 项目 BUG 审查报告

审查日期：2026-07-07（初版）/ 2026-07-09（第二轮修复）
审查方式：静态代码审计 + 生产构建验证（`npm run build --prefix client`，1815 模块编译通过）+ 端到端真实 git 仓库验证

> 结论：核心功能（status / stage / commit / diff / branches / history / stash / 各种 git 操作）代码状态良好。本轮已修复全部确认的 BUG，包括一个会静默破坏提交历史的严重问题。

---

## 🔴 已修复（2026-07-09 第二轮）

### BUG-5（严重）　普通提交被错误地变成 `--amend` 提交
- **位置**：`server/services/GitService.js` → `commit(message, options)`
- **现象**：simple-git 3.33.0 的选项处理逻辑里，`{ '--amend': false }` **并不会**省略该标志 —— `filterPrimitives(false, ['boolean'])` 返回 false，落入 else 分支直接 `push('--amend')`。实测 `amend=false` 与 `amend=true` 产生的命令相同，都带 `--amend`。
- **影响**（严重）：
  - 每一次"普通提交"都在改写上一次提交，而不是新建提交 → 提交历史被静默吞没/丢失。
  - 在没有任何提交的新初始化仓库上，首次提交会因 `fatal: You have nothing to amend` 直接失败。
  - 工作区面板的 "Amend" 复选框完全失效（勾不勾结果一样）。
- **修复**：`const commitOptions = options.amend ? { '--amend': true } : {};` —— 只在真正需要 amend 时传该标志。端到端验证：连续两次普通提交产生两条独立提交记录。

### BUG-3　极客控制台命令解析错误（GeekToolbox.runCommand）
- **位置**：`client/src/components/GeekToolbox.jsx` → `runCommand`
- **现象**：原 `commandInput.split(/\s+/)` 按空白切分，无法处理带空格或引号的参数，例如 `commit -m "fix bug"` 被切成 4 段导致失败。
- **修复**：新增 `tokenizeCommand(input)` 最小 shell 解析器，支持单/双引号、引号内空格保留、双引号内反斜杠转义。9/9 单元用例通过。

### BUG-4　后端 `/run` 对 `--` 分隔符过度拦截（GitService.run）
- **位置**：`server/services/GitService.js` → `run(args)`
- **现象**：只要参数里出现独立的 `--` 就被判为「Unsupported argument combination」而拒绝，误杀 `checkout -- file`、`restore -- file`、`diff -- file` 等大量合法命令；`arg.startsWith('-z')` 也偏激进（`-z` 只改输出格式，不读 stdin）。
- **修复**：移除对裸 `--` 和 `-z` 的拦截，只拦截真正会读 stdin 的组合（`-F`/`--file` 配合 `-`）。

### BUG-6　未跟踪文件的删除按钮会清空全部未跟踪文件
- **位置**：`client/src/components/GitStatusPanel.jsx` 未跟踪文件行的 trash 按钮
- **现象**：按钮渲染在单行上，视觉意图是删除该文件，但实际调用 `cleanUntracked()` 执行 `git clean -fd`，会删除**所有**未跟踪文件/目录，误操作风险高。
- **修复**：
  - 后端 `GitService.clean(forceDirectories, files)` 与 `/clean` 路由新增可选 `files` 参数：传入时执行 `git clean -f -- <paths>` 精准删除，不传时保持原 `git clean -fd` 行为（向后兼容）。
  - 前端新增 `removeUntracked(file)`，trash 按钮改为调用它；新增 i18n 文案 `status.removeUntrackedConfirm` / `feedback.removeUntrackedDone`（中英文）。删除前有针对性的二次确认。
  - 端到端验证：`clean(true, ["only-this.txt"])` 只删除指定文件，其他未跟踪文件保留。

---

## ✅ 已修复（2026-07-07 第一轮）

### BUG-1　`stash.entryLabel` 缺失（en.json）
- 在 `en.json` 的 `stash` 段补充 `"entryLabel": "Stash #{{index}}"`。

### BUG-2　`diff.truncated` 缺失（en.json + zh.json）
- `en.json` 补 `"truncated": "Showing first {{shown}} of {{total}} lines (truncated)"`；`zh.json` 补 `"truncated": "仅显示前 {{shown}} / {{total}} 行（内容已截断）"`。

---

## 🟡 观察项（非阻断，未改）
1. **极客台参数前缀约定**：`runCommand` 把整行当作 `git` 之后的参数，用户容易输入完整 `git status` 导致 `git git status` 报错。placeholder 已提示「status -sb」，属 UX 而非 bug。
2. **`restoreAll` 包含 renamed `.to`**：`git restore -- <renamed.to>` 会恢复重命名后的文件，行为可接受，仅记录。
3. **`commitFiles` 对 copy 状态（`C100`）未单独处理**：会丢失源路径，但 copy 状态罕见，影响小。
4. **`GitStatusPanel` 因 `key={status-${refreshKey}}` 在每次刷新时整体重挂载**（含 5s 轮询重建），略有性能浪费，非功能 bug。

---

## 验证记录
- ✅ `npm run lint --prefix client`：通过，无报错。
- ✅ `npm run build --prefix client`：成功，1815 模块转换。
- ✅ `node --check`：`GitService.js`、`gitRoutes.js` 语法 OK。
- ✅ amend 修复端到端：连续两次普通提交产生两条独立提交记录，不再被 amend 吞没。
- ✅ `run` 不再误杀 `--`：`run(['log','--oneline'])` 正常返回。
- ✅ `tokenizeCommand` 单元测试：9/9 通过（覆盖双引号、单引号、引号内空格、反斜杠转义、空输入、空引号）。
- ✅ `clean` 单文件删除端到端：仅删除指定文件，其他未跟踪文件保留；不传 files 时行为与原一致。
