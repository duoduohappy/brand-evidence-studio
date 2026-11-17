# 知证 · Brand Evidence Studio

品牌内容可信发布工作台：用版本化品牌知识支持内容编写，展示可解释检索、Agent 节点运行、规则审查、人工签核、CMS 草稿写入与回读，以及 10 条业务测试。支持本机运行与 Render 在线演示部署。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/duoduohappy/brand-evidence-studio)

## 在线访问：Render 部署

点击上方按钮，在 Render 中填写 Blueprint Name：`brand-evidence-studio`；Branch 保持 `main`，Blueprint Path 保持默认 `render.yaml`，确认 Free 方案后部署。部署变为 Live 后，打开服务页面提供的 `.onrender.com` 地址。之后推送 main 分支会自动触发部署。

Docker 镜像包含工作台和真实 Strapi 服务。只有工作台公开监听 `PORT`；CMS 保持回环地址，通过 `/cms` 展示当前访客会话关联的草稿。CMS 令牌由 Render 自动生成，不需要在仓库或聊天里填写密钥。

在线演示按浏览器 HttpOnly Cookie 隔离资料状态、运行记录、签核与草稿视图；这是演示会话隔离，不是企业身份认证或租户系统。每会话最多 100 次任务与 30 次评测。所有数据均为虚构，勿导入生产或个人敏感资料。

默认在线版不下载本机模型权重，提供完整的“证据组装 → 规则审查 → 人工签核 → CMS 草稿回读 → 评测”流程，界面明确标识非模型输出。本机模型可按下文单独启动。

Free 服务会在空闲后休眠，首次唤醒需等待，SQLite 数据在实例休眠、重启或重新部署后丢失，因此在线页面显示重置提示。正式持久化部署需另行配置持久卷或数据库，当前配置不自动创建收费资源。详见 [Render Free 官方说明](https://render.com/docs/free)。

部署配置见 `render.yaml` 与 `Dockerfile`；`RENDER_EXTERNAL_URL` 自动提供公开来源，其他平台可设置 `DEPLOY_MODE=cloud`、`PUBLIC_ORIGIN=https://your-host`、`HOST=0.0.0.0`、`PORT` 和私有 `CMS_TOKEN`。健康检查 `/healthz` 会等待 CMS 可用。

## 快速启动（Windows，Node.js 24）

双击 `安装依赖.cmd`，成功后双击 `启动工作台.cmd`。

或在当前目录运行：

```powershell
npm.cmd ci
npm.cmd ci --prefix cms
npm.cmd start
```

打开 <http://127.0.0.1:18781>，CMS 草稿库在 <http://127.0.0.1:18782>。首次启动 CMS 需要几秒初始化；工作台右上角显示连接状态。使用期间保持启动窗口运行，Ctrl+C 停止。只绑定本机回环地址，不需要账户或云端密钥。

## 3 分钟业务流程

1. 内容工作台 → T01 → “运行：检索并组装证据”，确认当前产品资料、引用、审查结果。
2. 审核与 CMS → 输入审核人 → 签核 → “创建 CMS 草稿并验证”。打开独立 CMS，可见实际保存的内容。
3. 再次写入，确认 documentId 相同、没有重复草稿。
4. T02 / T03 / T05 → “载入测试文案并检查”，观察过期活动、品牌混用与禁用表述如何被阻断。
5. 运行全部 10 条质量评测，再查看 Agent 运行记录中的实际节点输出。

知识库支持导入 JSON，格式见 `samples/import-example.json`。导入资料默认“待批准”，需在资料状态中明确批准后才能进入检索。导入新资料会改变检索分值和评测结果；评测记录会保留对应知识版本。`samples/knowledge.json` 和 `samples/test-cases.json` 是初始完整数据快照。

## 10 条测试数据

| 编号 | 场景 | 应观察的行为 |
|---|---|---|
| T01 | 当前产品事实 | 检索到批准的 v2，带引用的文案待审 |
| T02 | 过期活动 | 旧优惠、旧截止时间与失效引用被阻断 |
| T03 | 跨品牌事实 | 远山事实不得用于澄光 |
| T04 | 未覆盖问题 | 无有效证据，提示补充资料 |
| T05 | 绝对化与医疗承诺 | 禁用表述被阻断 |
| T06 | 未批准路线图 | 草案不作为现行来源 |
| T07 | 提示注入 | 不执行资料中的越权指令，阻断测试文案 |
| T08 | 资料变更 | 知识版本变化使签核失效 |
| T09 | CMS 重试 | 相同幂等键返回原草稿 |
| T10 | 草稿交付 | 第二品牌内容保存且 publishedAt 为 null |

开发集 5 条，留出集 5 条。页面评测只统计固定文案审查和检索命中；T08–T10 的状态与真实 CMS 副作用由集成测试另外验证，不将它们混充模型准确率。

品牌和资料类型是场景预先给定的任务范围，不是模型自动识别的结果。T04 / T07 的无证据结果依赖该范围与资料状态过滤；本产品未实现通用问题的语义可回答性识别。10 条数据随源码公开，留出集仅用于区分场景，不是盲测或行业基准。

## 可选的真正本机模型推理

默认模式“证据组装”直接使用资料原文，是可复现的非模型流程。“载入测试文案”用于验证已知异常。这两种模式均明确标识。

```powershell
npm.cmd ci --prefix model
node model/service.mjs
```

独立窗口启动后会首次联网下载 `onnx-community/Qwen2.5-0.5B-Instruct` 的 ONNX 权重，使用 Transformers.js CPU 推理。服务健康且权重加载完成后，工作台“本机模型生成”才可用。模型不可用时返回错误，不用模板冒充模型；小模型输出质量不保证，仍需审查和人工签核。首次下载受网络限制时，其余流程照常可用。

如本机无法连接 Hugging Face，可由操作者选择镜像：在 PowerShell 中先设置 `$env:HF_ENDPOINT='https://hf-mirror.com'`，再启动模型服务。该镜像为第三方服务；模型缓存仍保存在本机 runtime/model-cache。当前测试环境通过此镜像完成下载并验证了实际 CPU 推理。

模型输出后的“检索来源”由系统根据输入资料关联，原始模型文本保存在 compose 节点的 rawModel 中。引用关联不等于逐句事实验证；数字与部分禁用表述由规则检查，语义完整性仍需人工审核。模型没有来源资料时不调用生成器，也不会为未知问题编造答案。

## 实际复用与自研边界

- MiniSearch 7.2.0：实际索引、分词与分值排序。项目实现中文字符/二元切分及品牌、日期、状态过滤。
- LangGraphJS 1.7.5：实际 StateGraph 的 retrieve → compose → check 节点编排。项目用 SQLite 保存节点输出和人工检查点；未声称使用 LangGraph 内置持久化检查点。
- Strapi 5.62.0：真实独立 CMS 服务，SQLite 数据库、Document Service、draftAndPublish。项目增加本机令牌接口、幂等键和回读验证；未启用付费审核功能或构建管理后台。
- 规则审查、签核绑定、10 条领域测试、业务 UI 由本项目实现。开源链接与许可证见 THIRD_PARTY.md。

## 测试与数据

```powershell
npm.cmd test
# 先启动工作台和 CMS，再开第二个终端：
npm.cmd run test:integration
# 仅验证 7 个页面渲染函数和导航状态，不替代浏览器视觉验收：
node tests/ui-smoke.mjs
```

报告写入 `runtime/integration-report.json`。业务状态在 `runtime/studio.sqlite`，CMS 草稿在 `cms/.tmp/content.db`。停止服务后备份这两个文件即可保留测试状态。分发包不包含运行数据库、临时令牌、模型权重或 node_modules。

演示业务日期固定为 2026-11-17，以便复现活动过期案例。两个品牌与所有资料均为虚构。规则仅检查已编码的数字、引用、日期和禁用表述，不是完整事实验证。知识品牌过滤不是企业级多租户权限隔离；审核人是测试输入，没有正式身份认证。CMS 仅创建草稿，不自动对外发布。本机服务不应直接暴露到公网。
