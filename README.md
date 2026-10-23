# 报销有数 · 智能财务预审工作台

财务后台与员工入口的中文交互演示。纯 HTML、CSS、JavaScript，无需安装依赖。

**在线体验：[打开看板](https://kekeren97.github.io/expense-workbench/)**

公开网页无需登录 GitHub 或 ChatGPT。打开后，点右上角「员工入口」→「报销咨询」，即可体验完整的虚构制度问答。

## 体验内容

- 财务总览、部门与时间筛选、费用趋势、报销预审、模拟通过或退回。
- 员工报销表单、附件、草稿、原单补正、报销进度与报告下载。
- 8 篇完整虚构知识文档、52 条制度、10 个计算案例；支持全文搜索、条款引用和整套下载。
- 城市与职级住宿标准、餐补扣减、超标计算、审批流程及上下文追问。
- 咨询日志、高频问题、培训提纲、CSV 与 JSON 导出。

可依次提问「我去深圳出差，住宿费用多少？」「那部门经理呢？」「住三晚呢？」。对应虚构标准为普通员工 450 元/晚、部门经理 600 元/晚，部门经理三晚标准上限为 1,800 元。

## 文档与离线版

- [完整虚构知识库](knowledge/星澜能源_财务报销制度知识库.md)
- [单文件离线演示](https://kekeren97.github.io/expense-workbench/downloads/expense-workbench.html)
- [知识库 Markdown 下载](https://kekeren97.github.io/expense-workbench/downloads/knowledge.md)

## 本地运行

```sh
python3 -m http.server 4178 --directory dist
```

打开 `http://localhost:4178`。

## 修改与发布

编辑 `dist/` 后执行：

```sh
node checks/logic-check.cjs
node checks/knowledge-check.cjs
node checks/knowledge-migration.cjs
node checks/resubmission-check.cjs
node scripts/build-standalone.cjs
node scripts/build-pages.cjs
```

将更新提交并推送到 `main`。GitHub Pages 使用 `main` 分支的 `/docs` 目录自动发布；`dist/` 是源文件，`docs/` 是同步生成的发布副本。

## 演示说明

所有初始员工、金额、制度与审批记录均为虚构。知识问答使用本地规则和内置知识库；WorkBuddy、外部大模型、OCR、税务验真、企业 OA / ERP、真实审批和付款均未连接。角色切换仅用于演示界面。

每位访客的数据保存在自己的浏览器：报销记录使用 localStorage，附件使用 IndexedDB。不同用户、设备和域名之间不共享数据；清除浏览器数据会移除本地记录。上传附件不会提交到本仓库或其他访客的页面。
