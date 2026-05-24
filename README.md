# 票易理

票易理是一个微信小程序项目。当前 v1 上线范围收口为个人主体可发布的发票收集工具，优先完成真实 OCR 录入、票夹管理、发票详情维护和原票 PDF 导出。

## v1 上线范围

- 发票收集：聊天文件/PDF、拍照/相册 OCR、手动录入。
- 真实 OCR：OCR 路径只调用腾讯云发票 OCR，识别成功后才允许保存 OCR 发票。
- 票夹管理：展示云端发票与本地草稿，支持搜索、筛选、详情、编辑和删除。
- 原票 PDF 导出：支持原始图片附件和原始 PDF 附件；图片按 A4 一页两张排版，PDF 原页合并进导出文件。
- 个人中心：保留个人发票资料、导出设置、服务支持等基础入口。

## v1 暂不展示

以下能力的代码或页面路由可能仍在仓库中保留，但不会在 v1 用户入口展示：

- 报销流程、报销单、审批、团队协作。
- 微信卡包同步、扫码解析等个人主体受限能力。
- Excel 导出、打印、企业管理等后续功能。
- Mock OCR、示例导出任务和开发期静态页面说明。

## 项目结构

```text
minimal-reimburse/
├── miniprogram/                         # 微信小程序前端
│   ├── app.json                         # 页面与 Tab 配置
│   └── pages/
│       ├── index/                       # 首页
│       ├── intake-detail/               # OCR 录入
│       ├── manual-entry/                # 手动录入/编辑
│       ├── folder/                      # 票夹
│       ├── invoice-detail/              # 发票详情
│       ├── export-center/               # PDF 导出页
│       └── profile/                     # 我的
├── cloudfunctions/
│   └── quickstartFunctions/             # 云函数入口
├── tests/
│   └── v1-readiness.test.js             # v1 静态就绪检查
└── docs/superpowers/plans/              # 实施计划与状态
```

## 云函数能力

`quickstartFunctions` 继续作为统一云函数入口，v1 重点使用以下接口：

- `ocrInvoice`：请求 `{ type: "ocrInvoice", data: { fileID } }`，只走腾讯云 OCR。
- `createInvoice` / `updateInvoice` / `deleteInvoice`：发票保存、编辑、删除。
- `listInvoices` / `getInvoiceDetail`：返回发票展示数据，并包含只读字段 `hasOriginalAttachment`、`attachmentTypes`。
- `findDuplicateInvoice`：保存前重复发票检测。
- `syncLocalInvoices`：本地草稿同步到云端。
- `generateExportPdf`：请求 `{ type: "generateExportPdf", invoiceIds: [...] }`，生成原票 PDF 并返回 `fileID`、`tempFileURL`、`fileName`、`fileSize`、`invoiceCount`、`pageCount`。

当所选发票缺少图片/PDF 原始附件时，`generateExportPdf` 返回：

```json
{
  "success": false,
  "errCode": "EXPORT_UNSUPPORTED_ATTACHMENT",
  "errMsg": "所选发票缺少可导出的原始图片或PDF",
  "data": {
    "unsupportedInvoices": []
  }
}
```

## 环境变量

云函数部署后需要在云开发环境中配置：

```text
TENCENT_SECRET_ID=腾讯云 SecretId
TENCENT_SECRET_KEY=腾讯云 SecretKey
TENCENT_REGION=ap-beijing
```

`TENCENT_REGION` 可选，默认 `ap-beijing`。正式路径不读取 `config.local.json`，该文件只应作为本地私有材料保留并保持忽略，不要上传或部署。

本地 OCR 调试脚本同样读取环境变量：

```powershell
$env:TENCENT_SECRET_ID="..."
$env:TENCENT_SECRET_KEY="..."
$env:TENCENT_REGION="ap-beijing"
node test-ocr.js
```

## 开发与检查

安装云函数依赖：

```powershell
cd cloudfunctions/quickstartFunctions
npm install
```

运行 v1 静态就绪检查：

```powershell
node tests/v1-readiness.test.js
```

常用语法检查：

```powershell
node --check cloudfunctions/quickstartFunctions/index.js
node --check miniprogram/pages/intake-detail/index.js
node --check miniprogram/pages/folder/index.js
node --check miniprogram/pages/manual-entry/index.js
node --check miniprogram/pages/invoice-detail/index.js
node --check miniprogram/pages/export-center/index.js
node --check miniprogram/pages/index/index.js
node --check miniprogram/pages/profile/index.js
```

## 上线前人工验证

- 微信开发者工具中确认 Tab 只显示：首页、票夹、我的。
- 首页、票夹、详情、导出中心、我的页不出现卡包、扫码、Excel、打印、企业协作等入口。
- 关闭 OCR 环境变量时，OCR 录入失败并提示错误，不保存 OCR 发票。
- 手动录入可保存、编辑、删除，重复发票检测仍可用。
- 图片原票导出为 PDF 后，确认 A4 一页两张。
- PDF 原票导出后，确认原始 PDF 页面被合并。
- 无原始附件的手动发票导出时，确认出现中文错误且不生成空白 PDF。
