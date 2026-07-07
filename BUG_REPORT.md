# GitM 项目 BUG 审查报告

审查日期：2026-07-07
审查方式：静态代码审计 + 生产构建验证（`npm run build --prefix client`，1815 模块编译通过，无导入/语法错误）

> 结论：核心功能（status / stage / commit / diff / branches / history / stash / 各种 git 操作）代码状态良好，git log 中声称修复的 TDZ、轮询竞态、卸载后 setState、404、错误处理等问题在当前代码中**确已修复**。剩余问题集中在 i18n 缺失 + 极客控制台的命令解析/后端拦截逻辑。

---

## 🔴 已修复（本次）

### BUG-1　`stash.entryLabel` 缺失（en.json）
- **位置**：`client/src/components/StashPanel.jsx` → `t('stash.entryLabel', { index })`
- **现象**：英文界面下，每条 stash 记录标题显示原始 key 字符串 `stash.entryLabel`，而不是 `Stash #0`。中文界面正常（zh.json 有该 key）。
- **原因**：英文 locale 漏加该键，且调用处未设 `defaultValue` 兜底。
- **修复**：在 `en.json` 的 `stash` 段补充 `"entryLabel": "Stash #{{index}}"`。

### BUG-2　`diff.truncated` 缺失（en.json + zh.json）
- **位置**：`client/src/components/DiffViewer.jsx` → `t('diff.truncated', { shown, total, defaultValue })`
- **现象**：DiffViewer 对超过 4000 行的 diff 截断提示依赖 `defaultValue` 兜底，导致中文界面里这条提示仍是英文 "Showing first 4000 of N lines..."。
- **原因**：两个 locale 都漏加该键。
- **修复**：`en.json` 补 `"truncated": "Showing first {{shown}} of {{total}} lines (truncated)"`；`zh.json` 补 `"truncated": "仅显示前 {{shown}} / {{total}} 行（内容已截断）"`。

---

## 🟠 待修复（需要设计决策，本次未改）

### BUG-3　极客控制台命令解析错误（GeekToolbox.runCommand）
- **位置**：`client/src/components/GeekToolbox.jsx` 第 230 行
  ```js
  const args = commandInput.split(/\s+/).map((item) => item.trim()).filter(Boolean);
  ```
- **现象**：按空白字符简单切分，**无法正确处理带空格或引号的参数**。例如：
  - 用户输入 `commit -m "fix bug"` → 被切成 `['commit','-m','"fix','bug"']` → 后端执行 `git "fix bug"` 报错；
  - 用户输入 `log --since="2024-01-01 00:00"` → 引号原样传给 git，git 报 unknown option；
  - 几乎所有带参数的真实命令都会失败。
- **影响**：极客台的「Arbitrary Git Command」实际上只能跑无空格/无引号的简单命令，可用性严重受限。
- **建议修复**：按 shell 规则做最小解析（剥离最外层成对引号、不破坏引号内的空格），或改为多行/逐参数输入（数组输入框）。

### BUG-4　后端 `/run` 对 `--` 分隔符过度拦截（GitService.run）
- **位置**：`server/services/GitService.js` 第 541-543 行
  ```js
  const blocked = normalizedArgs.some(
    (arg) => arg === '--' || arg.startsWith('-z') || arg === 'commit' && normalizedArgs.includes('-F') && normalizedArgs.includes('-'),
  );
  ```
- **现象**：只要参数里出现独立的 `--`，整条命令就被判为「Unsupported argument combination」而拒绝。这会**误杀大量合法命令**：
  - `git checkout -- file.txt`
  - `git restore -- file.txt`
  - `git diff -- file.txt`
- **原因**：注释本意是「拦截会从 stdin 读取、导致请求挂起的参数」，但 `--` 只是选项/路径分隔符，**并不读 stdin**，属于误杀；`arg.startsWith('-z')` 也偏激进（`-z` 只是改输出格式，同样不读 stdin）。
- **影响**：极客台无法运行上述常见命令。
- **建议修复**：只拦截真正会读 stdin 的组合，例如 `commit -F -`、`-i` 配合 `-`、以及 `--edit`/`-e` 配合 `-` 等；移除对裸 `--` 和 `-z` 的拦截（或仅对 `commit` 的 `-F -` 场景拦截）。

---

## 🟡 观察项（非阻断，可优化）
1. **极客台参数前缀约定**：`runCommand` 把整行当作 `git` 之后的参数（`git.raw(normalizedArgs)`），但用户容易习惯输入完整 `git status`，导致变成 `git git status` 报错。placeholder 已提示「status -sb」，属 UX 而非 bug。
2. **`restoreAll` 包含 renamed `.to`**：`git restore -- <renamed.to>` 会恢复重命名后的文件，行为可接受，仅记录。

---

## 验证记录
- ✅ `npm run build --prefix client`：成功，1815 模块转换，产物含 react-vendor / i18n-vendor / icons-vendor 拆分。
- ✅ 两个 locale 文件编辑后通过 `json.load` 校验，格式有效。
- ✅ 动态拼接 key（`log.warn_*`、`feedback.*Done`）经核对在 en/zh 中均存在，无缺失。
