# 票易理“我的”页轻量配置功能设计

日期：2026-05-24

## 背景

首页和票夹页当前版本已经满足本轮功能预期，下一步补齐“我的”页从静态入口到轻量可用配置中心的能力。当前 `profile` 页面已有视觉结构和分组入口，但统计值、发票抬头、收票说明、PDF 模板、客服与 FAQ 主要停留在静态展示或 toast。

本设计采用已确认的 A 方案：复用现有 `settings` 和 `export-center` 路由，使用本地存储实现轻量配置，不新增云函数和数据库结构。

## 目标

- “我的”页保持当前设计稿风格，统计值来自本地配置数据。
- “发票抬头”支持新增、编辑、删除、设为默认，本地保存。
- 抬头字段使用完整字段：抬头名称、纳税人识别号、地址电话、开户行及账号、默认标记、备注、常用科目文本。
- “收票说明与指引”提供静态说明，覆盖聊天文件、相册/拍照、手动录入和原票附件保留建议。
- “PDF 导出模板”提供本地模板选择，并在“我的”页展示当前选择。
- “在线客服”使用微信原生客服入口；“常见问题”和“联系我们”使用静态内容。

## 非目标

- 不接入云端用户配置表。
- 不做常用科目的独立增删改查；常用科目只作为抬头表单的文本字段。
- 不把抬头配置自动写入手动录入页；后续可在表单中增加选择抬头能力。
- 不新增会员、企业协作、审批、打印、Excel 或其他 v1 未开放入口。
- 不改动现有发票、OCR、票夹、详情、PDF 生成的云函数协议。

## 页面与路由

### 我的页

文件：`miniprogram/pages/profile/*`

页面结构保留：

- 深色资料卡：应用名“票易理”，说明“发票收集与原票 PDF 归档”。
- 三列统计：
  - 常用抬头：本地抬头列表数量。
  - 导出模板：本地 PDF 模板数量或当前模板序号，展示为轻量数值。
  - 常用科目：从抬头 `commonSubject` 文本去重后的数量。
- 分组菜单：
  - 发票资料：发票抬头、收票说明与指引。
  - 导出设置：PDF 导出模板。
  - 服务支持：在线客服、常见问题、联系我们。

交互：

- `onShow` 读取本地配置，刷新统计与菜单右侧状态。
- 发票抬头跳转 `/pages/settings/index?section=title`。
- 收票说明跳转 `/pages/settings/index?section=guide`。
- PDF 导出模板跳转 `/pages/export-center/index?type=pdf&mode=settings`。
- 常见问题跳转 `/pages/settings/index?section=faq`。
- 联系我们跳转 `/pages/settings/index?section=contact`。
- 在线客服使用 `button open-type="contact"`，不走普通 `bindtap` toast。

### 设置页

文件：`miniprogram/pages/settings/*`

`settings` 页面改为多 section 配置页：

- `section=title`：发票抬头维护。
- `section=guide`：收票说明与指引。
- `section=faq`：常见问题。
- `section=contact`：联系我们。

发票抬头维护界面：

- 顶部说明卡显示“发票抬头”与说明。
- 列表展示已有抬头：名称、税号、常用科目、默认标记。
- 空状态提示“还没有常用抬头”。
- 底部或列表顶部提供“新增抬头”按钮。
- 表单在当前页面内切换展示，避免新增路由：
  - 抬头名称，必填。
  - 纳税人识别号，选填但输入后做基本格式限制。
  - 地址电话，选填。
  - 开户行及账号，选填。
  - 常用科目，选填文本。
  - 备注，选填。
  - 设为默认，开关。
- 编辑进入同一表单；删除需要二次确认。
- 保存后回到列表并刷新“我的”页统计。

静态内容 section：

- `guide` 展示四组说明：聊天文件、相册/拍照、手动录入、原票附件保留。
- `faq` 展示常见问题折叠或普通列表：支持哪些发票、为什么要保留原票、PDF 导出失败怎么办、本地配置会不会同步。
- `contact` 展示联系说明：在线客服优先，补充产品反馈说明。

### 导出中心设置模式

文件：`miniprogram/pages/export-center/*`

保留现有导出记录和生成 PDF 能力，同时支持 `mode=settings`：

- 普通模式继续展示导出清单、记录、预设、生成 PDF。
- 设置模式强调“PDF 导出模板”，展示可选择模板：
  - 原票归档：默认模板，适合保留原始图片/PDF。
  - 按月份归档：导出文件名优先按月份组织。
  - 简洁清单：弱化说明，适合快速转发。
- 选择模板后写入本地存储并显示选中态。
- 不改变 `generateExportPdf` 请求参数；模板选择先作为本地偏好和 UI 状态，不影响云端 PDF 生成内容。

## 本地数据设计

使用 `wx.setStorageSync` / `wx.getStorageSync`，不新增云端依赖。

### 发票抬头

Storage key：`profileInvoiceTitles`

数据结构：

```json
[
  {
    "id": "title-1716537600000",
    "name": "上海知行科技有限公司",
    "taxNumber": "91310000MA1K000000",
    "addressPhone": "上海市浦东新区示例路 88 号 021-00000000",
    "bankAccount": "招商银行上海分行 6222000000000000",
    "commonSubject": "信息服务",
    "remark": "默认软件订阅抬头",
    "isDefault": true,
    "createdAt": 1716537600000,
    "updatedAt": 1716537600000
  }
]
```

规则：

- `id` 由时间戳和随机片段生成，保证本地唯一。
- 保存第一个抬头时自动设为默认。
- 设某个抬头为默认时，其他抬头的 `isDefault` 统一置为 `false`。
- 删除默认抬头后，如果仍有抬头，第一条自动成为默认。
- 抬头名称不能为空。
- 纳税人识别号只做基础格式校验：允许大写字母和数字，长度在 15 到 20 之间；为空时不校验。

### PDF 模板偏好

Storage key：`profilePdfTemplate`

数据结构：

```json
{
  "selectedTemplateId": "original-archive",
  "updatedAt": 1716537600000
}
```

模板常量：

- `original-archive`：原票归档。
- `month-archive`：按月份归档。
- `simple-list`：简洁清单。

### 统计派生

- 常用抬头数：`profileInvoiceTitles.length`。
- 导出模板数：固定模板数量 `3`，菜单右侧展示当前模板名称。
- 常用科目数：对所有抬头的 `commonSubject` 去空、去重后的数量。

## 组件与状态

### `profile` 页面状态

- `profileStats`：由本地数据派生，不再固定写死。
- `menuGroups`：保留现有结构，菜单右侧 `value` 在 `onShow` 中动态更新。
- `pdfTemplateLabel`：当前模板名称，用于菜单状态。

### `settings` 页面状态

- `currentSection`：当前 section 的标题、说明和类型。
- `invoiceTitles`：本地抬头列表。
- `editingTitleId`：正在编辑的抬头 id；新增时为空。
- `titleForm`：表单数据。
- `titleErrors`：字段错误。
- `showTitleForm`：控制列表和表单展示。
- `guideGroups` / `faqItems` / `contactItems`：静态内容。

### `export-center` 页面状态

- `mode`：`normal` 或 `settings`。
- `templateOptions`：PDF 模板列表。
- `selectedTemplateId`：当前模板 id。

## 错误处理

- 本地存储读取失败时使用空列表和默认模板，不阻断页面展示。
- 保存抬头时：
  - 名称为空：显示“请填写抬头名称”。
  - 税号格式不合法：显示“纳税人识别号格式不正确”。
  - 其他异常：显示“保存失败，请稍后重试”。
- 删除抬头前使用 `wx.showModal` 二次确认。
- PDF 模板保存失败时显示“模板保存失败”。
- 静态说明页面不依赖网络，无加载失败态。

## 测试设计

采用现有 Node 静态测试风格，并为关键本地逻辑增加行为测试。

新增测试建议：

- `tests/profile-light-settings-behavior.test.js`
  - 发票抬头新增后统计数量增加。
  - 设置默认抬头会取消其他默认。
  - 删除默认抬头后剩余第一条成为默认。
  - 常用科目统计会去重并忽略空值。
  - PDF 模板选择会落入 `profilePdfTemplate`。
- 更新 `tests/ui-redesign-readiness.test.js`
  - 确认“我的”页包含客服 open-type、FAQ、联系我们入口。
  - 确认 `settings` 页面包含发票抬头维护字段。
  - 确认 `export-center` 支持 `mode=settings` 和模板选中态。
- 更新 `tests/v1-readiness.test.js`
  - 确认没有新增企业、报销、打印、Excel、会员等入口。

语法检查：

- `node --check miniprogram/pages/profile/index.js`
- `node --check miniprogram/pages/settings/index.js`
- `node --check miniprogram/pages/export-center/index.js`

## 验收标准

- 从“我的”进入“发票抬头”，可以新增、编辑、删除、设为默认。
- 回到“我的”后，常用抬头和常用科目统计刷新。
- “PDF 导出模板”可以选择三个模板之一，回到“我的”后菜单右侧展示当前模板。
- “收票说明与指引”“常见问题”“联系我们”能展示清晰静态内容。
- “在线客服”使用微信原生客服入口。
- 首页、票夹、发票详情、导出 PDF 现有流程不受影响。
- 页面中不出现 v1 未开放的会员、企业协作、打印、Excel、审批或报销入口。

## 实施边界

实现应优先复用现有 `profile`、`settings`、`export-center` 页面，避免新增路由。业务逻辑集中在页面 JS 内的小型 helper 中，先不抽公共模块，等云端同步或跨页面复用需求明确后再抽象。

所有新增行为先按 TDD 写测试，再实现最小代码通过测试。
