# 极简报销

> 项目名称：极简报销 (minimal-reimburse)  
> 文档版本：v1.0  
> 最后更新：2026-04-01

---

## 1. 项目概述

### 1.1 产品定位
极简报销是一款面向个人和小微企业的发票管理与报销工具，基于微信小程序平台开发，提供发票归集、核验、报销、导出等一站式解决方案。

### 1.2 目标用户
- 需要管理大量发票的职场人士
- 小微企业财务人员
- 经常出差需要报销的商务人士

### 1.3 核心价值
- **极简操作**：快速录入、一键报销
- **多端同步**：云端存储，换设备不丢失
- **智能识别**：OCR自动识别发票信息
- **合规导出**：支持PDF、Excel等多种格式

---

## 2. 功能需求

### 2.1 发票录入模块

#### 2.1.1 多渠道录入 ✅ 已实现
| 功能点 | 状态 | 说明 |
|--------|------|------|
| 聊天记录导入 | ✅ 已实现 | 从微信聊天记录提取发票 |
| 微信卡包同步 | ✅ 已实现 | 同步微信卡包电子发票 |
| 本地文件导入 | ✅ 已实现 | 导入PDF、图片等文件 |
| 扫码录入 | ✅ 已实现 | 扫描二维码快速录入 |
| 手机相册选择 | ✅ 已实现 | 从相册批量选择图片 |
| 智能OCR识别 | ✅ 已实现 | 拍照自动识别发票字段 |
| 手动录入 | ✅ 已实现 | 手动填写发票信息 |

#### 2.1.2 手动录入表单 ✅ 已实现
- 发票类型选择（电子普票/电子专票/纸质普票）
- 发票标题（必填）
- 金额（必填，单位：元）
- 开票日期（必填）
- 购买方名称
- 销售方名称
- 发票代码
- 发票号码
- 费用类别
- 备注信息
- 数据来源标记

#### 2.1.3 重复发票校验 ✅ 已实现
- 基于发票代码+发票号码精确匹配
- 基于标题+日期+金额+购买方指纹匹配
- 本地草稿重复检测
- 云端数据库重复检测
- 重复时自动跳转详情页

---

### 2.2 票夹管理模块

#### 2.2.1 发票列表 ✅ 已实现
- 列表展示（标题、类型、金额、日期、来源）
- 状态标签（待核验/已核验/可导出/未报销/已报销/未打印/已打印）
- 本地草稿与云端数据合并展示
- 下拉刷新
- 上拉加载更多（预留）

#### 2.2.2 搜索与筛选 ✅ 已实现
- 关键词搜索（支持标题、抬头、金额、发票代码/号码）
- 筛选条件：
  - 全部
  - 本月
  - 未报销
  - 可导出
  - 已打印
- 搜索与筛选联动

#### 2.2.3 数据统计 ✅ 已实现
- 待整理发票数量
- 本月金额汇总
- 待导出发票数量

#### 2.2.4 发票详情 ✅ 已实现
- 完整字段展示
- 状态时间线（导入→OCR校验→报销状态）
- 标签展示
- 编辑入口
- 删除功能（支持本地草稿和云端发票）

---

### 2.3 报销管理模块

#### 2.3.1 报销单创建 ✅ 已实现
- 从票夹选择发票创建报销单
- 自动生成报销单号（RB+年月日+序号）
- 自动计算发票数量和总金额
- 发票快照保存

#### 2.3.2 报销单编辑 ✅ 已实现
- 报销单标题
- 报销人
- 报销部门
- 关联项目
- 费用类别
- 备注信息

#### 2.3.3 报销单状态流转 ✅ 已实现
| 状态 | 说明 | 可操作 |
|------|------|--------|
| 草稿 | 初始状态 | 编辑、追加发票、删除、提交 |
| 待提交 | 准备提交 | 编辑、提交 |
| 已提交 | 已送审 | 查看 |
| 已通过 | 审批通过 | 查看、导出 |
| 已驳回 | 审批驳回 | 编辑、重新提交 |
| 已归档 | 完成归档 | 查看 |

#### 2.3.4 发票关联管理 ✅ 已实现
- 向报销单追加发票
- 从报销单移除发票
- 发票状态自动更新（未报销→报销中→已报销）

#### 2.3.5 报销单列表 ✅ 已实现
- 按更新时间倒序排列
- 展示报销单号、状态、发票数量、金额、报销人

---

### 2.4 导出中心模块

#### 2.4.1 导出任务创建 ✅ 已实现（基础版）
- 导出格式选择（PDF/Excel）
- 导出范围选择（当前筛选结果/指定报销单）
- 创建导出任务

#### 2.4.2 导出任务管理 ✅ 已实现（基础版）
- 任务列表展示
- 任务状态跟踪（排队中→处理中→已完成/失败）
- 本地模拟任务（云端不可用时降级）

#### 2.4.3 文件生成与下载 ⏳ 未实现
- 真实Excel文件生成
- 真实PDF文件生成
- 云存储上传
- 文件下载链接
- 微信小程序文件打开

#### 2.4.4 导出偏好设置 ⏳ 未实现
- 默认导出格式
- 字段顺序配置
- 文件命名规则

---

### 2.5 数据同步与离线

#### 2.5.1 本地草稿 ✅ 已实现
- 云端超时时自动保存本地
- 本地草稿列表展示
- 本地草稿编辑
- 本地草稿删除

#### 2.5.2 数据同步 ✅ 已实现
- 启动时自动同步本地草稿到云端
- 同步成功后清除本地草稿
- 同步失败保留本地数据

#### 2.5.3 示例数据 ✅ 已实现
- 新用户首次进入自动创建示例发票
- 3张不同状态的发票样本

---

### 2.6 用户与系统

#### 2.6.1 微信登录 ✅ 已实现
- 微信一键登录
- 自动获取用户openid
- 数据隔离（基于openid）

#### 2.6.2 个人中心 ⏳ 部分实现
- 用户信息展示（框架已搭建）
- 设置页面（框架已搭建）

---

## 3. 非功能需求

### 3.1 性能需求
- 页面加载时间 < 2秒
- 列表滚动流畅（60fps）
- 云函数调用超时 5秒（带降级处理）

### 3.2 可靠性需求
- 云端不可用时自动降级到本地存储
- 关键操作（保存、提交）失败时提示用户
- 数据一致性校验（重复检测）

### 3.3 安全需求
- 用户数据基于openid隔离
- 敏感操作需确认（删除、提交）
- 本地存储数据加密（预留）

### 3.4 兼容性需求
- 支持微信基础库 2.19.4+
- 适配各种屏幕尺寸
- 支持深色模式（预留）

---

## 4. 数据库设计

### 4.1 发票集合 (invoices)
```javascript
{
  _id: String,              // 唯一标识
  openid: String,           // 用户标识
  tenantId: String,         // 租户标识
  invoiceCode: String,      // 发票代码
  invoiceNumber: String,    // 发票号码
  invoiceType: String,      // 发票类型
  invoiceMedium: String,    // 发票介质
  title: String,            // 发票标题
  amount: Number,           // 金额（分）
  taxAmount: Number,        // 税额（分）
  totalAmount: Number,      // 价税合计（分）
  issueDate: String,        // 开票日期
  buyerName: String,        // 购买方名称
  buyerTaxNo: String,       // 购买方税号
  sellerName: String,       // 销售方名称
  sellerTaxNo: String,      // 销售方税号
  category: String,         // 费用类别
  sourceType: String,       // 数据来源
  sourceMeta: Object,       // 来源元数据
  ocrStatus: String,        // OCR状态
  verifyStatus: String,     // 核验状态
  reimburseStatus: String,  // 报销状态
  printStatus: String,      // 打印状态
  exportStatus: String,     // 导出状态
  archived: Boolean,        // 是否归档
  remark: String,           // 备注
  attachments: Array,       // 附件列表
  recognizedFields: Object, // 识别字段
  manualOverrides: Object,  // 手动覆盖字段
  linkedReimbursementId: String, // 关联报销单ID
  createdAt: Number,        // 创建时间
  updatedAt: Number,        // 更新时间
  deletedAt: Number|null    // 删除时间（软删除）
}
```

### 4.2 报销单集合 (reimbursements)
```javascript
{
  _id: String,              // 唯一标识
  openid: String,           // 用户标识
  tenantId: String,         // 租户标识
  title: String,            // 报销单标题
  subtitle: String,         // 副标题
  reimbursementNo: String,  // 报销单号
  status: String,           // 状态
  applicant: String,        // 报销人
  department: String,       // 报销部门
  projectName: String,      // 关联项目
  expenseCategory: String,  // 费用类别
  remark: String,           // 备注
  invoiceCount: Number,     // 发票数量
  totalAmount: Number,      // 总金额（分）
  invoiceIds: Array,        // 发票ID列表
  invoiceSnapshots: Array,  // 发票快照
  timeline: Array,          // 时间线
  createdAt: Number,        // 创建时间
  updatedAt: Number,        // 更新时间
  deletedAt: Number|null    // 删除时间（软删除）
}
```

### 4.3 导出任务集合 (export_jobs)
```javascript
{
  _id: String,              // 唯一标识
  openid: String,           // 用户标识
  jobTitle: String,         // 任务标题
  format: String,           // 导出格式
  status: String,           // 任务状态
  scopeType: String,        // 范围类型
  scopeId: String,          // 范围ID
  fileName: String,         // 文件名
  fileUrl: String,          // 文件URL
  createdAt: Number,        // 创建时间
  updatedAt: Number         // 更新时间
}
```

---

## 5. 接口清单

### 5.1 发票相关
| 接口 | 类型 | 状态 |
|------|------|------|
| createInvoice | 创建发票 | ✅ 已实现 |
| updateInvoice | 更新发票 | ✅ 已实现 |
| deleteInvoice | 删除发票 | ✅ 已实现 |
| getInvoiceDetail | 获取发票详情 | ✅ 已实现 |
| listInvoices | 获取发票列表 | ✅ 已实现 |
| findDuplicateInvoice | 查找重复发票 | ✅ 已实现 |
| syncLocalInvoices | 同步本地发票 | ✅ 已实现 |

### 5.2 报销单相关
| 接口 | 类型 | 状态 |
|------|------|------|
| createReimbursementDraft | 创建报销单草稿 | ✅ 已实现 |
| updateReimbursement | 更新报销单 | ✅ 已实现 |
| submitReimbursement | 提交报销单 | ✅ 已实现 |
| deleteReimbursementDraft | 删除报销单草稿 | ✅ 已实现 |
| getReimbursementDetail | 获取报销单详情 | ✅ 已实现 |
| listReimbursements | 获取报销单列表 | ✅ 已实现 |
| addInvoicesToReimbursement | 追加发票到报销单 | ✅ 已实现 |
| removeInvoiceFromReimbursement | 从报销单移除发票 | ✅ 已实现 |

### 5.3 导出相关
| 接口 | 类型 | 状态 |
|------|------|------|
| createExportJob | 创建导出任务 | ✅ 已实现（基础版） |
| listExportJobs | 获取导出任务列表 | ✅ 已实现（基础版） |
| getExportJobDetail | 获取导出任务详情 | ⏳ 未实现 |
| downloadExportFile | 下载导出文件 | ⏳ 未实现 |

---

## 6. 页面清单

| 页面 | 路径 | 状态 |
|------|------|------|
| 首页 | pages/index/index | ✅ 已实现 |
| 票夹 | pages/folder/index | ✅ 已实现 |
| 报销 | pages/reimburse/index | ✅ 已实现 |
| 我的 | pages/profile/index | ⏳ 框架已搭建 |
| 录入详情 | pages/intake-detail/index | ⏳ 静态页面 |
| 手动录入 | pages/manual-entry/index | ✅ 已实现 |
| 发票详情 | pages/invoice-detail/index | ✅ 已实现 |
| 报销单详情 | pages/reimburse-detail/index | ✅ 已实现 |
| 导出中心 | pages/export-center/index | ✅ 已实现（基础版） |
| 设置 | pages/settings/index | ⏳ 框架已搭建 |
| 示例页面 | pages/example/index | ✅ 保留 |

---

## 7. 待办事项

### 高优先级
1. 实现真实Excel/PDF文件生成与下载
2. 完善OCR识别功能（接入真实OCR服务）
3. 实现发票核验功能（接入税务接口）

### 中优先级
4. 完善个人中心功能
5. 添加发票打印功能
6. 实现邮件转发导入

### 低优先级
7. 添加数据备份与恢复
8. 支持团队协作（多用户）
9. 添加数据分析报表

---

## 8. 附录

### 8.1 状态枚举

**发票核验状态**
- `unverified` - 待核验
- `verified` - 已核验
- `failed` - 核验失败

**发票报销状态**
- `unreimbursed` - 未报销
- `in_reimbursement` - 报销中
- `reimbursed` - 已报销

**发票打印状态**
- `unprinted` - 未打印
- `printed` - 已打印

**发票导出状态**
- `none` - 未导出
- `exported` - 已导出

**报销单状态**
- `draft` - 草稿
- `pending_submit` - 待提交
- `submitted` - 已提交
- `approved` - 已通过
- `rejected` - 已驳回
- `archived` - 已归档

**导出任务状态**
- `queued` - 排队中
- `processing` - 处理中
- `success` - 已完成
- `failed` - 失败
- `canceled` - 已取消

### 8.2 技术栈
- 微信小程序原生框架
- 微信云开发（云函数 + 云数据库）
- JavaScript ES6+
- WXSS/WXML
