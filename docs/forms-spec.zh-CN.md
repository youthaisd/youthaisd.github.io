# AI×SD Forms v1.0：实施、数据与上线说明

## 一、先理解记录方式

网站放在 GitHub Pages；回答通过 HTTPS 发给 Supabase Edge Function，再分别写入三张 PostgreSQL 表：

```text
访客浏览器 → GitHub Pages 表单 → Supabase Edge Function → PostgreSQL
```

GitHub Pages 只提供静态页面，**不会替你保存表单回答**。表单数据不写进 GitHub 仓库，也不公开显示在网站上。目前网站已连接 Supabase，三张表单可正式提交，仅限 18 岁及以上人士。

| 入口 | 数据表 | 记录内容 |
|---|---|---|
| LISTEN：青年咨询 | `consultation_responses` | 需求、障碍、资源、未来议题；仅在同意后记录跟进邮箱 |
| MAP：项目与案例 | `project_submissions` | 项目情况、所需支持、公开使用许可和提交者联系方式 |
| Contributor：成为贡献者 | `contributor_interests` | 兴趣领域、可贡献方式、首次小贡献、时间、联系方式和人工确认状态 |

三张表各有自己的 UUID、提交时间、来源和表单版本；**没有跨表 `person_id`**。`source=consultation` 只说明访客从咨询成功页进入另一张表，不表示已识别出同一个人。

## 二、上线操作顺序

1. **创建 Supabase 项目。**先确定该项目用于保存这三张表的数据；不要把密钥写入 GitHub 仓库。
2. **建立数据库表。**按顺序应用 [`supabase/migrations/`](../supabase/migrations/) 内的所有迁移。使用 Supabase CLI 时，先关联项目，再运行 `supabase db push`。迁移建立三张独立回答表、限流表、18 岁确认字段和自动删除任务，启用 RLS，并撤销公开客户端对回答表的直接访问。
3. **部署接收函数。**部署 [`supabase/functions/submit/index.ts`](../supabase/functions/submit/index.ts)，例如运行 `supabase functions deploy submit`。[`supabase/config.toml`](../supabase/config.toml) 中的 `verify_jwt = false` 允许无登录访客请求函数；函数自身仍检查项目的 publishable key、允许的网站来源，并在写入前再次验证答案。
4. **设置服务端配置。**在 Supabase Secrets 中设置 `PUBLIC_SITE_ORIGINS` 和 `RATE_LIMIT_SALT`。前者填写**准确的网站来源**，如 `https://用户名.github.io`；若有自定义域名，也把它加入逗号分隔的列表。这里填域名来源，不含仓库路径。后者使用较长的随机值，绝不提交到 GitHub。上线测试时还要确认托管网关提供可靠的访客 IP 请求头，供限流使用。
5. **发布隐私说明。**目前已发布[英文隐私说明](../privacy/)，写明负责联系渠道、悉尼的数据存储位置、12 个月保留期限、撤回或删除办法，以及研究和公开引用的用途。数据库每天清理过期回答。咨询自由文本即使匿名引用，也应另行取得明确许可。
6. **连接静态网站。**在 [`assets/js/api-config.js`](../assets/js/api-config.js) 填入已部署的函数地址，例如 `https://项目标识.supabase.co/functions/v1/submit`，以及 Supabase 的 **publishable key**。它可以出现在浏览器端；**secret key 和 service-role key 绝不能放在这个文件、网页或 GitHub 仓库中**。
7. **做真实提交测试。**三张表各提交一条测试回答，确认分别进入对应数据表。再测试缺少必答题、无效 URL、超出选择上限、频繁提交、非允许来源，以及公开客户端无法 `SELECT` 私人回答。只有这些检查通过后，才开放正式收集。
8. **部署 GitHub Pages。**把 `aixsd/` 内的静态文件放到仓库发布根目录，保留 `.nojekyll`；在仓库 **Settings → Pages** 选择分支和 `/(root)`。Supabase 数据库和函数需要单独部署，GitHub Pages 不会运行 `supabase/` 中的代码。

这八步已在当前项目中完成。新的 Contributor 人工确认迁移 `202609300001_contributor_review.sql` 仍需应用到线上数据库并检查；在此之前，表单仍可接收首次贡献，但数据库尚不记录审核状态。若以后迁移到新的 Supabase 项目，需重新执行并测试；只部署 GitHub Pages 不会记录回答。

## 三、共用数据规则

- [`data/taxonomy.js`](../data/taxonomy.js) 统一定义议题、角色、贡献类型和国家代码。数据库存 ID，前端显示英文标签。开始收集后，不要改变已有 ID 的含义。
- 多选题保存 ID 数组；“Other”的说明另存到对应文本字段。取消 Other 时，说明文字会清空。
- 最多选三项的题目显示“已选几项”，达到三项后暂时禁用其余选项。`none` 与 `nothing_currently` 为互斥选项。
- 三张表均分五步填写；返回上一步保留输入。草稿仅存在当前浏览器标签页的 `sessionStorage`，成功提交后删除；不会把完整回答长期保存在 `localStorage`。
- 来源值仅允许 `direct`、`consultation`、`projects`、`website`。不做跨表邮箱匹配、隐藏身份标识或设备指纹。
- 浏览器只触发六个**不含答案内容**的本地事件：`consultation_started/completed`、`project_started/completed`、`contributor_started/completed`。此版本未把事件发送给第三方分析服务。
- v1 不提供文件上传、公开数据浏览、会员申请、伙伴申请或自动评分。

## 四、三张表的关键规则

### LISTEN：青年咨询

必须先同意参与；选“不同意”即终止，不显示后续问题。国家使用 ISO 3166-1 两位代码，并提供“不愿透露”。议题、主要障碍、希望获得的资源和未来研究方向各最多三项。熟悉程度存为 1–5 的整数；过往参与的 `none` 不可与其他选项同时选择。贡献偏好只在回答“愿意”或“可能愿意”后出现，属于汇总意向，**不授予 Contributor 身份**。只有单独同意后续联系，才要求邮箱；这不等于订阅简报。

### MAP：项目与案例

项目标题最多 150 字符。选择“想法阶段”时，进展题会改成“计划开发或研究什么”。问题描述、AI 的作用和项目进展各最多约 150 个英文单词。项目链接最多三个，只接受 HTTP(S) URL；不支持上传文件。项目需求最多三项，`nothing_currently` 与其他选项互斥。第三方提交者会看到“只能提供已公开信息”的提醒。公开使用许可分为 `yes`、`contact_first`、`internal_only`；选择允许考虑公开**不保证发布、认可或合作**，仍需人工审阅。信息准确及有权分享的确认项为必填。

### Contributor：首次贡献与人工确认

贡献类型和兴趣议题各最多三项。申请者须完成一个小型首次贡献：指出研究空白（80–200 词）、分享资源并说明价值（说明 50–150 词），或提出小型项目（80–200 词）。资源是 URL 时，URL 单独存储；只提供标题时，标题与说明保存在文本中。个人资料链接最多四个，只接受 HTTP(S)。**提交后先记为待确认；须由项目负责人亲自确认 Contributor 身份。原则上予以确认，仅对违反尊重他人、守法参与等基本规范的提交不予认可。**不自动评分，亦不因此取得组织代表身份或 JOIN 会员身份。

应用 `202609300001_contributor_review.sql` 后，`contributor_interests` 增加 `review_status`（`pending`／`approved`／`declined`）、`reviewed_at` 和仅供内部使用的 `review_note`。新旧记录默认 `pending`。负责人在 Supabase Table Editor 筛选 `pending`，查看首次贡献后亲自将状态改为 `approved` 或 `declined`；数据库自动记录确认时间。成功页只表示提交已收到，不表示已确认。本版不自动发送确认邮件，也没有公开贡献者名录。

前端和服务端共用 [`data/validation.js`](../data/validation.js)；服务端在写入前重新验证。文字会去掉控制字符并清理首尾空格。日后若公开展示文字答案，必须按纯文本转义，不能直接当 HTML 插入页面。

## 五、隐私与防滥用

- 数据表启用 RLS，并撤销 `anon`、`authenticated` 对回答表的直接权限。只有服务端接收函数通过管理员客户端写入；浏览器没有查询他人邮箱、项目提交或参与者记录的接口。正式开放前，应在目标 Supabase 项目中实际验证权限。
- 函数检查允许的网页来源、publishable key、服务端规则和蜜罐字段。来源和公开密钥本身**不能证明请求是真人发送**。
- 数据库限流默认每张表、每个网关 IP、每小时最多五次尝试。安全记录使用包含表单与小时信息的 HMAC 哈希，不把原始 IP 放入研究数据表，也不用于跨表识别。托管基础设施自身可能另有访问日志；不要将其导入研究数据。
- `RATE_LIMIT_SALT` 只能放在 Supabase 服务端 Secrets。若垃圾提交明显增加，再考虑托管式机器人防护。
- 不要公开原始回答表、邮箱、项目提交或参与者记录。研究分析所需 CSV/JSON 应通过授权的数据库访问导出。展示分组结果时要注意小样本造成的再识别风险。

## 六、第一份 Consultation Brief 的分析计划

先描述受访者所在地区、角色、熟悉程度和此前参与方式。主要图表可呈现：首要障碍 `top_barriers`、希望获得的资源 `desired_resources`、未来议题 `future_priorities`、贡献意愿。对 `ideal_solution` 等开放回答做主题编码。探索性比较包括角色 × 障碍/资源、熟悉程度 × 障碍、过往参与 × 障碍、议题 × 资源。报告每个分组的样本量 `n`；样本很小或自选偏差明显时，不作强推断。

项目资料可按议题 × 阶段、议题 × 需求、阶段 × 需求汇总。之后可以描述性比较“咨询受访者说自己需要什么”和“项目提交者说项目需要什么”，但这**不是同一个人的配对分析**。

## 七、当前状态

当前网站连接 Supabase 项目 `tzkdvvncvnttgjspzbot`。三张表的测试回答均成功入库并已清除；年龄限制、公开客户端无读取权限、非允许来源拦截和提交编号已验证。隐私联系邮箱为 `youthaisd.stunned539@slmails.com`。每张表的回答在 12 个月后由每日任务删除；成功页面会显示供删除请求使用的编号。

技术配置可对照 [Supabase Edge Function 权限](https://supabase.com/docs/guides/functions/auth)、[CORS](https://supabase.com/docs/guides/functions/cors)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) 和 [API 密钥](https://supabase.com/docs/guides/getting-started/api-keys) 官方文档。
