const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

console.log("[Init] Pre-loading Tencent Cloud SDK...");
const tcloud = require("tencentcloud-sdk-nodejs");
const OcrClient = tcloud.ocr.v20181119.Client;
console.log("[Init] Tencent Cloud SDK loaded successfully");

const db = cloud.database();
const INVOICES_COLLECTION = "invoices";
const REIMBURSEMENTS_COLLECTION = "reimbursements";
const EXPORT_JOBS_COLLECTION = "export_jobs";

const isCollectionMissingError = (error) => {
  const message = String(error && (error.errMsg || error.message || error));
  return (
    message.includes("collection not exists") ||
    message.includes("Collection does not exist") ||
    message.includes("collection does not exist")
  );
};

const ensureCollectionExists = async (collectionName) => {
  try {
    await db.collection(collectionName).limit(1).get();
  } catch (error) {
    if (!isCollectionMissingError(error)) {
      throw error;
    }
    try {
      await db.createCollection(collectionName);
    } catch (createError) {
      const message = String(
        createError && (createError.errMsg || createError.message || createError)
      );
      if (!message.includes("already exists")) {
        throw createError;
      }
    }
  }
};

const formatDateText = (dateText) => {
  if (!dateText) {
    return "";
  }
  return String(dateText).replace(/-/g, "/");
};

const getSourceLabel = (sourceType) => {
  const sourceMap = {
    chat: "聊天记录",
    card: "微信卡包",
    local: "本地文件",
    scan: "扫码录入",
    album: "手机相册",
    ocr: "智能识别",
    manual: "手动录入",
    more: "更多方式",
  };
  return sourceMap[sourceType] || "手动录入";
};

const getInvoiceTypeLabel = (invoiceType) => {
  const invoiceTypeMap = {
    vat_special_electronic: "电子专票",
    vat_common_electronic: "电子普票",
    vat_common_paper: "纸质普票",
  };
  return invoiceTypeMap[invoiceType] || "电子普票";
};

const buildInvoiceTags = (invoice) => {
  const tags = [];
  if (invoice.verifyStatus === "verified") {
    tags.push("已核验");
  } else if (invoice.verifyStatus === "failed") {
    tags.push("核验失败");
  } else {
    tags.push("待核验");
  }
  if (invoice.exportStatus === "exported") {
    tags.push("已导出");
  } else {
    tags.push("可导出");
  }
  if (invoice.reimburseStatus === "reimbursed") {
    tags.push("已报销");
  } else if (invoice.reimburseStatus === "in_reimbursement") {
    tags.push("报销中");
  } else {
    tags.push("未报销");
  }
  if (invoice.printStatus === "printed") {
    tags.push("已打印");
  } else {
    tags.push("未打印");
  }
  return tags;
};

const normalizeInvoiceAmount = (amount) => {
  const numericAmount = Number(amount || 0);
  return Number.isFinite(numericAmount) ? Math.round(numericAmount) : 0;
};

const normalizeComparableText = (value) => {
  return String(value || "").trim();
};

const formatSearchableAmount = (amountInCents) => {
  return (Number(amountInCents || 0) / 100).toFixed(2);
};

const buildInvoiceTimeline = (invoice) => {
  return [
    {
      title: "导入票夹",
      meta: `${formatDateText(invoice.issueDate)} · ${getSourceLabel(
        invoice.sourceType
      )}`,
    },
    {
      title: invoice.ocrStatus === "success" ? "完成 OCR 校验" : "待 OCR 校验",
      meta:
        invoice.ocrStatus === "success"
          ? "字段已识别，可继续核验与报销"
          : "当前可继续补录发票字段",
    },
    {
      title:
        invoice.reimburseStatus === "reimbursed" ? "已完成报销" : "等待加入报销单",
      meta:
        invoice.reimburseStatus === "reimbursed"
          ? "发票已进入报销完成状态"
          : "当前状态",
    },
  ];
};

const matchInvoiceSearchKeyword = (invoice, searchKeyword) => {
  const keyword = normalizeComparableText(searchKeyword).toLowerCase();
  if (!keyword) {
    return true;
  }
  const searchableText = [
    invoice.title,
    invoice.buyerName,
    invoice.sellerName,
    invoice.invoiceCode,
    invoice.invoiceNumber,
    getSourceLabel(invoice.sourceType),
    getInvoiceTypeLabel(invoice.invoiceType),
    formatSearchableAmount(invoice.totalAmount || invoice.amount),
  ]
    .join(" ")
    .toLowerCase();
  return searchableText.includes(keyword);
};

const matchInvoiceActiveFilter = (invoice, activeFilter) => {
  if (!activeFilter || activeFilter === "all") {
    return true;
  }
  if (activeFilter === "unreimbursed") {
    return invoice.reimburseStatus === "unreimbursed";
  }
  if (activeFilter === "ready") {
    return invoice.exportStatus !== "exported";
  }
  if (activeFilter === "printed") {
    return invoice.printStatus === "printed";
  }
  if (activeFilter === "month") {
    return String(invoice.issueDate || "").startsWith("2026-03");
  }
  return true;
};

const buildSampleInvoices = (openid) => {
  const now = Date.now();
  return [
    {
      openid,
      tenantId: "default",
      invoiceCode: "033002400111",
      invoiceNumber: "12458097",
      invoiceType: "vat_special_electronic",
      invoiceMedium: "electronic",
      title: "信息服务 · 软件订阅",
      amount: 398000,
      taxAmount: 22528,
      totalAmount: 398000,
      issueDate: "2026-03-24",
      buyerName: "杭州云行信息技术有限公司",
      buyerTaxNo: "91330100DEMO0001",
      sellerName: "上海云联数字科技有限公司",
      sellerTaxNo: "91310100DEMO0001",
      category: "信息服务",
      sourceType: "card",
      sourceMeta: {
        channel: "wechat_card",
      },
      ocrStatus: "success",
      verifyStatus: "unverified",
      reimburseStatus: "unreimbursed",
      printStatus: "unprinted",
      exportStatus: "none",
      archived: false,
      remark: "",
      attachments: [],
      recognizedFields: {
        buyerName: "杭州云行信息技术有限公司",
        totalAmount: 398000,
      },
      manualOverrides: {},
      linkedReimbursementId: "",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      openid,
      tenantId: "default",
      invoiceCode: "011002500222",
      invoiceNumber: "55781346",
      invoiceType: "vat_common_electronic",
      invoiceMedium: "electronic",
      title: "餐饮服务 · 午餐接待",
      amount: 26800,
      taxAmount: 0,
      totalAmount: 26800,
      issueDate: "2026-03-27",
      buyerName: "上海知行科技有限公司",
      buyerTaxNo: "91310000DEMO0002",
      sellerName: "上海浦江餐饮服务有限公司",
      sellerTaxNo: "91310100DEMO0002",
      category: "餐饮服务",
      sourceType: "chat",
      sourceMeta: {
        channel: "wechat_chat",
      },
      ocrStatus: "success",
      verifyStatus: "verified",
      reimburseStatus: "unreimbursed",
      printStatus: "unprinted",
      exportStatus: "none",
      archived: false,
      remark: "",
      attachments: [],
      recognizedFields: {
        buyerName: "上海知行科技有限公司",
        totalAmount: 26800,
      },
      manualOverrides: {},
      linkedReimbursementId: "",
      createdAt: now - 1000,
      updatedAt: now - 1000,
      deletedAt: null,
    },
    {
      openid,
      tenantId: "default",
      invoiceCode: "144002600333",
      invoiceNumber: "66003218",
      invoiceType: "vat_common_electronic",
      invoiceMedium: "electronic",
      title: "交通服务 · 出行报销",
      amount: 18650,
      taxAmount: 0,
      totalAmount: 18650,
      issueDate: "2026-03-21",
      buyerName: "王芳",
      buyerTaxNo: "",
      sellerName: "上海城市交通服务有限公司",
      sellerTaxNo: "91310100DEMO0003",
      category: "交通服务",
      sourceType: "ocr",
      sourceMeta: {
        channel: "album_ocr",
      },
      ocrStatus: "success",
      verifyStatus: "unverified",
      reimburseStatus: "reimbursed",
      printStatus: "printed",
      exportStatus: "exported",
      archived: true,
      remark: "",
      attachments: [],
      recognizedFields: {
        buyerName: "王芳",
        totalAmount: 18650,
      },
      manualOverrides: {},
      linkedReimbursementId: "rb-demo-001",
      createdAt: now - 2000,
      updatedAt: now - 2000,
      deletedAt: null,
    },
  ];
};

const buildReimbursementNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const serial = String(now.getTime()).slice(-4);
  return `RB${year}${month}${day}${serial}`;
};

const getReimbursementStatusLabel = (status) => {
  const statusMap = {
    draft: "草稿",
    pending_submit: "待提交",
    submitted: "已提交",
    approved: "已通过",
    rejected: "已驳回",
    archived: "已归档",
  };
  return statusMap[status] || "草稿";
};

const getExportStatusLabel = (status) => {
  const statusMap = {
    queued: "排队中",
    processing: "处理中",
    success: "已完成",
    failed: "失败",
    canceled: "已取消",
  };
  return statusMap[status] || "排队中";
};

const getExportFormatLabel = (format) => {
  const formatMap = {
    pdf: "PDF",
    excel: "Excel",
    zip: "ZIP",
  };
  return formatMap[format] || "文件";
};

const buildReimbursementTimeline = (reimbursement) => {
  return [
    {
      title: "创建报销单",
      meta: `${reimbursement.invoiceCount} 张发票 · 自动生成草稿`,
    },
    {
      title: "归集发票",
      meta: `当前总金额 ${(Number(reimbursement.totalAmount || 0) / 100).toFixed(
        2
      )} 元`,
    },
    {
      title: reimbursement.status === "submitted" ? "已提交审批" : "等待提交审批",
      meta:
        reimbursement.status === "submitted" ? "当前已进入审批流程" : "当前状态",
    },
  ];
};

const buildReimbursementSnapshots = (invoices) => {
  return invoices.map((invoice) => ({
    invoiceId: invoice._id,
    title: invoice.title,
    amount: invoice.totalAmount || invoice.amount,
    issueDate: invoice.issueDate,
    invoiceCode: invoice.invoiceCode,
    invoiceNumber: invoice.invoiceNumber,
    buyerName: invoice.buyerName,
  }));
};

const calculateReimbursementTotals = (invoices) => {
  const totalAmount = invoices.reduce(
    (total, invoice) => total + Number(invoice.totalAmount || invoice.amount || 0),
    0
  );
  return {
    invoiceCount: invoices.length,
    subtotalAmount: totalAmount,
    totalAmount,
  };
};

const formatReimbursementSummary = (reimbursement) => {
  return {
    _id: reimbursement._id,
    title: reimbursement.title,
    reimbursementNo: reimbursement.reimbursementNo,
    status: reimbursement.status,
    statusLabel: getReimbursementStatusLabel(reimbursement.status),
    invoiceCount: reimbursement.invoiceCount,
    totalAmount: reimbursement.totalAmount,
    applicant: reimbursement.applicant,
    department: reimbursement.department,
    detail: `${reimbursement.invoiceCount} 张发票 · ${reimbursement.applicant}`,
    createdAt: reimbursement.createdAt,
    updatedAt: reimbursement.updatedAt,
  };
};

const updateInvoicesReimbursementState = async (
  openid,
  invoiceIds,
  reimburseStatus,
  linkedReimbursementId
) => {
  for (let i = 0; i < invoiceIds.length; i++) {
    await db
      .collection(INVOICES_COLLECTION)
      .where({
        _id: invoiceIds[i],
        openid,
        deletedAt: null,
      })
      .update({
        data: {
          reimburseStatus,
          linkedReimbursementId: linkedReimbursementId || "",
          updatedAt: Date.now(),
        },
      });
  }
};

const ensureInvoiceSeedData = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  await ensureCollectionExists(INVOICES_COLLECTION);
  const countResult = await db
    .collection(INVOICES_COLLECTION)
    .where({
      openid,
      deletedAt: null,
    })
    .count();
  if (countResult.total > 0) {
    return {
      openid,
      seeded: false,
    };
  }
  const sampleInvoices = buildSampleInvoices(openid);
  for (let i = 0; i < sampleInvoices.length; i++) {
    await db.collection(INVOICES_COLLECTION).add({
      data: sampleInvoices[i],
    });
  }
  return {
    openid,
    seeded: true,
  };
};

const ensureReimbursementCollection = async () => {
  await ensureCollectionExists(REIMBURSEMENTS_COLLECTION);
};

const ensureExportJobsCollection = async () => {
  await ensureCollectionExists(EXPORT_JOBS_COLLECTION);
};

const createInvoiceCollection = async () => {
  const result = await ensureInvoiceSeedData();
  return {
    success: true,
    data: result,
  };
};

const listReimbursements = async () => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const records = await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .orderBy("updatedAt", "desc")
    .get();
  return {
    success: true,
    data: records.data.map((item) => formatReimbursementSummary(item)),
  };
};

const getReimbursementDetail = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const reimbursementId = event.id || (event.data && event.data.id);
  if (!reimbursementId) {
    return {
      success: false,
      errMsg: "reimbursement id is required",
    };
  }
  const result = await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .limit(1)
    .get();
  if (!result.data.length) {
    return {
      success: false,
      errMsg: "reimbursement not found",
    };
  }
  const reimbursement = result.data[0];
  return {
    success: true,
    data: {
      _id: reimbursement._id,
      title: reimbursement.title,
      subtitle: reimbursement.subtitle,
      status: reimbursement.status,
      statusLabel: getReimbursementStatusLabel(reimbursement.status),
      reimbursementNo: reimbursement.reimbursementNo,
      applicant: reimbursement.applicant,
      department: reimbursement.department,
      projectName: reimbursement.projectName,
      expenseCategory: reimbursement.expenseCategory,
      remark: reimbursement.remark,
      invoiceCount: reimbursement.invoiceCount,
      totalAmount: reimbursement.totalAmount,
      invoices: reimbursement.invoiceSnapshots || [],
      timeline: buildReimbursementTimeline(reimbursement),
      createdAt: reimbursement.createdAt,
      updatedAt: reimbursement.updatedAt,
    },
  };
};

const listInvoices = async (event) => {
  const result = await ensureInvoiceSeedData();
  const activeFilter = event.activeFilter || (event.data && event.data.activeFilter);
  const searchKeyword = event.searchKeyword || (event.data && event.data.searchKeyword);
  const records = await db
    .collection(INVOICES_COLLECTION)
    .where({
      openid: result.openid,
      deletedAt: null,
    })
    .orderBy("issueDate", "desc")
    .get();
  const filteredInvoices = records.data.filter(
    (invoice) =>
      matchInvoiceActiveFilter(invoice, activeFilter) &&
      matchInvoiceSearchKeyword(invoice, searchKeyword)
  );
  return {
    success: true,
    data: filteredInvoices.map((invoice) => ({
      _id: invoice._id,
      title: invoice.title,
      amount: invoice.amount,
      totalAmount: invoice.totalAmount,
      invoiceCode: invoice.invoiceCode,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      invoiceType: invoice.invoiceType,
      invoiceTypeLabel: getInvoiceTypeLabel(invoice.invoiceType),
      sourceType: invoice.sourceType,
      sourceLabel: getSourceLabel(invoice.sourceType),
      buyerName: invoice.buyerName,
      sellerName: invoice.sellerName,
      verifyStatus: invoice.verifyStatus,
      reimburseStatus: invoice.reimburseStatus,
      printStatus: invoice.printStatus,
      exportStatus: invoice.exportStatus,
      tags: buildInvoiceTags(invoice),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    })),
  };
};

const findDuplicateInvoice = async (openid, payload, excludeId) => {
  const invoiceCode = normalizeComparableText(payload.invoiceCode);
  const invoiceNumber = normalizeComparableText(payload.invoiceNumber);
  if (invoiceCode && invoiceNumber) {
    const duplicatedByCode = await db
      .collection(INVOICES_COLLECTION)
      .where({
        openid,
        deletedAt: null,
        invoiceCode,
        invoiceNumber,
      })
      .limit(1)
      .get();
    const matchedByCode = duplicatedByCode.data.find(
      (item) => !excludeId || item._id !== excludeId
    );
    if (matchedByCode) {
      return matchedByCode;
    }
  }
  const title = normalizeComparableText(payload.title);
  const issueDate = normalizeComparableText(payload.issueDate);
  const buyerName = normalizeComparableText(payload.buyerName);
  const totalAmount = normalizeInvoiceAmount(payload.totalAmount || payload.amount);
  if (!title || !issueDate || !totalAmount) {
    return null;
  }
  const duplicatedByFingerprint = await db
    .collection(INVOICES_COLLECTION)
    .where({
      openid,
      deletedAt: null,
      title,
      issueDate,
      buyerName,
      totalAmount,
    })
    .limit(1)
    .get();
  const matchedByFingerprint = duplicatedByFingerprint.data.find(
    (item) => !excludeId || item._id !== excludeId
  );
  return matchedByFingerprint || null;
};

const getInvoiceDetail = async (event) => {
  const result = await ensureInvoiceSeedData();
  const invoiceId = event.id || (event.data && event.data.id);
  if (!invoiceId) {
    return {
      success: false,
      errMsg: "invoice id is required",
    };
  }
  const invoiceResult = await db
    .collection(INVOICES_COLLECTION)
    .where({
      _id: invoiceId,
      openid: result.openid,
      deletedAt: null,
    })
    .limit(1)
    .get();
  if (!invoiceResult.data.length) {
    return {
      success: false,
      errMsg: "invoice not found",
    };
  }
  const invoice = invoiceResult.data[0];
  return {
    success: true,
    data: {
      _id: invoice._id,
      title: invoice.title,
      amount: invoice.amount,
      totalAmount: invoice.totalAmount,
      invoiceCode: invoice.invoiceCode,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      invoiceType: invoice.invoiceType,
      invoiceTypeLabel: getInvoiceTypeLabel(invoice.invoiceType),
      buyerName: invoice.buyerName,
      buyerTaxNo: invoice.buyerTaxNo,
      sellerName: invoice.sellerName,
      sellerTaxNo: invoice.sellerTaxNo,
      category: invoice.category,
      remark: invoice.remark,
      sourceType: invoice.sourceType,
      sourceLabel: getSourceLabel(invoice.sourceType),
      verifyStatus: invoice.verifyStatus,
      reimburseStatus: invoice.reimburseStatus,
      printStatus: invoice.printStatus,
      exportStatus: invoice.exportStatus,
      tags: buildInvoiceTags(invoice),
      timeline: buildInvoiceTimeline(invoice),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    },
  };
};

const createInvoice = async (event) => {
  const result = await ensureInvoiceSeedData();
  const payload = (event && event.data) || {};
  const duplicateInvoice = await findDuplicateInvoice(result.openid, payload);
  if (duplicateInvoice) {
    return {
      success: false,
      errCode: "DUPLICATE_INVOICE",
      errMsg: "invoice already exists",
      data: {
        _id: duplicateInvoice._id,
        title: duplicateInvoice.title,
      },
    };
  }
  const now = Date.now();
  const invoiceData = {
    openid: result.openid,
    tenantId: "default",
    invoiceCode: payload.invoiceCode || "",
    invoiceNumber: payload.invoiceNumber || "",
    invoiceType: payload.invoiceType || "vat_common_electronic",
    invoiceMedium: payload.invoiceMedium || "electronic",
    title: payload.title || "未命名发票",
    amount: normalizeInvoiceAmount(payload.amount),
    taxAmount: normalizeInvoiceAmount(payload.taxAmount),
    totalAmount: normalizeInvoiceAmount(payload.totalAmount || payload.amount),
    issueDate: payload.issueDate || "",
    buyerName: payload.buyerName || "",
    buyerTaxNo: payload.buyerTaxNo || "",
    sellerName: payload.sellerName || "",
    sellerTaxNo: payload.sellerTaxNo || "",
    category: payload.category || "",
    sourceType: payload.sourceType || "manual",
    sourceMeta: payload.sourceMeta || {},
    ocrStatus: payload.ocrStatus || "skipped",
    verifyStatus: payload.verifyStatus || "unverified",
    reimburseStatus: payload.reimburseStatus || "unreimbursed",
    printStatus: payload.printStatus || "unprinted",
    exportStatus: payload.exportStatus || "none",
    archived: false,
    remark: payload.remark || "",
    attachments: payload.attachments || [],
    recognizedFields: payload.recognizedFields || {},
    manualOverrides: payload.manualOverrides || {},
    linkedReimbursementId: "",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const addResult = await db.collection(INVOICES_COLLECTION).add({
    data: invoiceData,
  });
  return {
    success: true,
    data: {
      _id: addResult._id,
      duplicated: false,
    },
  };
};

const createReimbursementDraft = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const invoiceIds = (event.invoiceIds || (event.data && event.data.invoiceIds) || []).filter(
    Boolean
  );
  if (!invoiceIds.length) {
    return {
      success: false,
      errMsg: "invoice ids are required",
    };
  }
  const invoiceRecords = await db
    .collection(INVOICES_COLLECTION)
    .where({
      _id: db.command.in(invoiceIds),
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .get();
  const availableInvoices = invoiceRecords.data.filter(
    (item) => item.reimburseStatus !== "reimbursed"
  );
  if (!availableInvoices.length) {
    return {
      success: false,
      errMsg: "no available invoices for reimbursement",
    };
  }
  const reimbursementNo = buildReimbursementNo();
  const totalAmount = availableInvoices.reduce(
    (total, item) => total + Number(item.totalAmount || item.amount || 0),
    0
  );
  const now = Date.now();
  const reimbursementData = {
    openid: invoiceSeedResult.openid,
    tenantId: "default",
    reimbursementNo,
    title:
      (event.title || (event.data && event.data.title)) ||
      `${new Date().getMonth() + 1}月报销单`,
    subtitle: "由票夹勾选发票自动生成",
    status: "draft",
    applicant: "当前用户",
    department: "待填写",
    projectName: "待填写",
    expenseCategory: "待分类",
    invoiceIds: availableInvoices.map((item) => item._id),
    invoiceSnapshots: buildReimbursementSnapshots(availableInvoices),
    invoiceCount: availableInvoices.length,
    subtotalAmount: totalAmount,
    taxAmount: 0,
    totalAmount,
    templateId: "default_reimbursement_template",
    formFields: {},
    exportSummary: {},
    printSummary: {},
    submittedAt: null,
    approvedAt: null,
    archivedAt: null,
    deletedAt: null,
    remark: "",
    createdAt: now,
    updatedAt: now,
  };
  const addResult = await db.collection(REIMBURSEMENTS_COLLECTION).add({
    data: reimbursementData,
  });
  await updateInvoicesReimbursementState(
    invoiceSeedResult.openid,
    availableInvoices.map((item) => item._id),
    "in_reimbursement",
    addResult._id
  );
  return {
    success: true,
    data: {
      _id: addResult._id,
      invoiceCount: availableInvoices.length,
      totalAmount,
    },
  };
};

const addInvoicesToReimbursement = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const reimbursementId = event.id || (event.data && event.data.id);
  const invoiceIds = (event.invoiceIds || (event.data && event.data.invoiceIds) || []).filter(
    Boolean
  );
  if (!reimbursementId) {
    return {
      success: false,
      errMsg: "reimbursement id is required",
    };
  }
  if (!invoiceIds.length) {
    return {
      success: false,
      errMsg: "invoice ids are required",
    };
  }
  const reimbursementResult = await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .limit(1)
    .get();
  if (!reimbursementResult.data.length) {
    return {
      success: false,
      errMsg: "reimbursement not found",
    };
  }
  const reimbursement = reimbursementResult.data[0];
  if (reimbursement.status !== "draft") {
    return {
      success: false,
      errMsg: "only draft reimbursement can add invoices",
    };
  }
  const invoiceResult = await db
    .collection(INVOICES_COLLECTION)
    .where({
      _id: db.command.in(invoiceIds),
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .get();
  const existingInvoiceIds = reimbursement.invoiceIds || [];
  const appendableInvoices = invoiceResult.data.filter(
    (invoice) =>
      !existingInvoiceIds.includes(invoice._id) &&
      (invoice.reimburseStatus === "unreimbursed" ||
        invoice.linkedReimbursementId === reimbursementId)
  );
  if (!appendableInvoices.length) {
    return {
      success: false,
      errMsg: "no invoices can be appended",
    };
  }
  const nextInvoiceIds = existingInvoiceIds.concat(
    appendableInvoices.map((invoice) => invoice._id)
  );
  const nextSnapshots = (reimbursement.invoiceSnapshots || []).concat(
    buildReimbursementSnapshots(appendableInvoices)
  );
  const nextInvoices = nextSnapshots.map((snapshot) => ({
    totalAmount: snapshot.amount,
    amount: snapshot.amount,
  }));
  const totals = calculateReimbursementTotals(nextInvoices);
  await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .update({
      data: {
        invoiceIds: nextInvoiceIds,
        invoiceSnapshots: nextSnapshots,
        invoiceCount: totals.invoiceCount,
        subtotalAmount: totals.subtotalAmount,
        totalAmount: totals.totalAmount,
        updatedAt: Date.now(),
      },
    });
  await updateInvoicesReimbursementState(
    invoiceSeedResult.openid,
    appendableInvoices.map((invoice) => invoice._id),
    "in_reimbursement",
    reimbursementId
  );
  return {
    success: true,
    data: {
      _id: reimbursementId,
      appendedCount: appendableInvoices.length,
      invoiceCount: totals.invoiceCount,
      totalAmount: totals.totalAmount,
    },
  };
};

const removeInvoiceFromReimbursement = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const reimbursementId = event.id || (event.data && event.data.id);
  const invoiceId = event.invoiceId || (event.data && event.data.invoiceId);
  if (!reimbursementId || !invoiceId) {
    return {
      success: false,
      errMsg: "reimbursement id and invoice id are required",
    };
  }
  const reimbursementResult = await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .limit(1)
    .get();
  if (!reimbursementResult.data.length) {
    return {
      success: false,
      errMsg: "reimbursement not found",
    };
  }
  const reimbursement = reimbursementResult.data[0];
  if (reimbursement.status !== "draft") {
    return {
      success: false,
      errMsg: "only draft reimbursement can remove invoices",
    };
  }
  const nextInvoiceIds = (reimbursement.invoiceIds || []).filter((id) => id !== invoiceId);
  const nextSnapshots = (reimbursement.invoiceSnapshots || []).filter(
    (item) => item.invoiceId !== invoiceId
  );
  const totals = calculateReimbursementTotals(
    nextSnapshots.map((snapshot) => ({
      totalAmount: snapshot.amount,
      amount: snapshot.amount,
    }))
  );
  await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .update({
      data: {
        invoiceIds: nextInvoiceIds,
        invoiceSnapshots: nextSnapshots,
        invoiceCount: totals.invoiceCount,
        subtotalAmount: totals.subtotalAmount,
        totalAmount: totals.totalAmount,
        updatedAt: Date.now(),
      },
    });
  await updateInvoicesReimbursementState(
    invoiceSeedResult.openid,
    [invoiceId],
    "unreimbursed",
    ""
  );
  return {
    success: true,
    data: {
      _id: reimbursementId,
      removedInvoiceId: invoiceId,
      invoiceCount: totals.invoiceCount,
      totalAmount: totals.totalAmount,
    },
  };
};

const updateReimbursement = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const reimbursementId = event.id || (event.data && event.data.id);
  const payload = (event && event.data) || {};
  if (!reimbursementId) {
    return {
      success: false,
      errMsg: "reimbursement id is required",
    };
  }
  await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .update({
      data: {
        title: payload.title || "未命名报销单",
        subtitle: payload.subtitle || "由票夹勾选发票自动生成",
        applicant: payload.applicant || "当前用户",
        department: payload.department || "待填写",
        projectName: payload.projectName || "待填写",
        expenseCategory: payload.expenseCategory || "待分类",
        remark: payload.remark || "",
        updatedAt: Date.now(),
      },
    });
  return {
    success: true,
    data: {
      _id: reimbursementId,
      updated: true,
    },
  };
};

const submitReimbursement = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const reimbursementId = event.id || (event.data && event.data.id);
  if (!reimbursementId) {
    return {
      success: false,
      errMsg: "reimbursement id is required",
    };
  }
  const result = await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .limit(1)
    .get();
  if (!result.data.length) {
    return {
      success: false,
      errMsg: "reimbursement not found",
    };
  }
  const reimbursement = result.data[0];
  await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .update({
      data: {
        status: "submitted",
        submittedAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  await updateInvoicesReimbursementState(
    invoiceSeedResult.openid,
    reimbursement.invoiceIds || [],
    "reimbursed",
    reimbursementId
  );
  return {
    success: true,
    data: {
      _id: reimbursementId,
      submitted: true,
    },
  };
};

const deleteReimbursementDraft = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  const reimbursementId = event.id || (event.data && event.data.id);
  if (!reimbursementId) {
    return {
      success: false,
      errMsg: "reimbursement id is required",
    };
  }
  const result = await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .limit(1)
    .get();
  if (!result.data.length) {
    return {
      success: false,
      errMsg: "reimbursement not found",
    };
  }
  const reimbursement = result.data[0];
  if (reimbursement.status !== "draft") {
    return {
      success: false,
      errMsg: "only draft reimbursement can be deleted",
    };
  }
  await db
    .collection(REIMBURSEMENTS_COLLECTION)
    .where({
      _id: reimbursementId,
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .update({
      data: {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  await updateInvoicesReimbursementState(
    invoiceSeedResult.openid,
    reimbursement.invoiceIds || [],
    "unreimbursed",
    ""
  );
  return {
    success: true,
    data: {
      _id: reimbursementId,
      deleted: true,
    },
  };
};

const normalizeScopeType = (scopeType) => {
  if (scopeType === "reimburse") {
    return "reimbursement";
  }
  if (scopeType === "folder") {
    return "filtered_result";
  }
  return scopeType || "filtered_result";
};

const resolveExportInvoiceIds = async (openid, scopeType, scopeId, invoiceIds) => {
  if (Array.isArray(invoiceIds) && invoiceIds.length) {
    return invoiceIds;
  }
  if (scopeType === "invoice" && scopeId) {
    return [scopeId];
  }
  if (scopeType === "reimbursement" && scopeId) {
    const reimbursementResult = await db
      .collection(REIMBURSEMENTS_COLLECTION)
      .where({
        _id: scopeId,
        openid,
        deletedAt: null,
      })
      .limit(1)
      .get();
    if (reimbursementResult.data.length) {
      return reimbursementResult.data[0].invoiceIds || [];
    }
  }
  const invoiceResult = await db
    .collection(INVOICES_COLLECTION)
    .where({
      openid,
      deletedAt: null,
    })
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();
  return invoiceResult.data.map((item) => item._id);
};

const markInvoicesAsExported = async (openid, invoiceIds) => {
  for (let i = 0; i < invoiceIds.length; i++) {
    await db
      .collection(INVOICES_COLLECTION)
      .where({
        _id: invoiceIds[i],
        openid,
        deletedAt: null,
      })
      .update({
        data: {
          exportStatus: "exported",
          updatedAt: Date.now(),
        },
      });
  }
};

const progressExportJob = async (openid, job) => {
  const elapsed = Date.now() - Number(job.createdAt || 0);
  if (job.status === "queued" && elapsed >= 1200) {
    await db
      .collection(EXPORT_JOBS_COLLECTION)
      .where({
        _id: job._id,
        openid,
        deletedAt: null,
      })
      .update({
        data: {
          status: "processing",
          startedAt: Date.now(),
          updatedAt: Date.now(),
        },
      });
    return Object.assign({}, job, {
      status: "processing",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  if (job.status === "processing" && elapsed >= 3200) {
    const fileName = `${job.jobTitle}.${job.format === "excel" ? "xlsx" : "pdf"}`;
    await db
      .collection(EXPORT_JOBS_COLLECTION)
      .where({
        _id: job._id,
        openid,
        deletedAt: null,
      })
      .update({
        data: {
          status: "success",
          fileName,
          fileId: `cloud://mock-export/${job._id}/${fileName}`,
          finishedAt: Date.now(),
          updatedAt: Date.now(),
        },
      });
    if (Array.isArray(job.invoiceIds) && job.invoiceIds.length) {
      await markInvoicesAsExported(openid, job.invoiceIds);
    }
    return Object.assign({}, job, {
      status: "success",
      fileName,
      fileId: `cloud://mock-export/${job._id}/${fileName}`,
      finishedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  return job;
};

const createExportJob = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureReimbursementCollection();
  await ensureExportJobsCollection();
  const payload = (event && event.data) || {};
  const format = payload.format || event.format || "pdf";
  const scopeType = normalizeScopeType(payload.scopeType || event.scopeType);
  const scopeId = payload.scopeId || event.scopeId || "";
  const invoiceIds = await resolveExportInvoiceIds(
    invoiceSeedResult.openid,
    scopeType,
    scopeId,
    payload.invoiceIds || event.invoiceIds
  );
  const now = Date.now();
  const jobTitle = payload.jobTitle || `${getExportFormatLabel(format)}导出任务`;
  const addResult = await db.collection(EXPORT_JOBS_COLLECTION).add({
    data: {
      openid: invoiceSeedResult.openid,
      tenantId: "default",
      jobType: "export",
      scopeType,
      scopeId,
      invoiceIds,
      reimbursementId: scopeType === "reimbursement" ? scopeId : "",
      format,
      status: "queued",
      filters: payload.filters || null,
      templateId: payload.templateId || "",
      fileId: "",
      fileName: "",
      fileSize: 0,
      errorMessage: "",
      jobTitle,
      startedAt: null,
      finishedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return {
    success: true,
    data: {
      _id: addResult._id,
      status: "queued",
      statusLabel: getExportStatusLabel("queued"),
      format,
      jobTitle,
    },
  };
};

const listExportJobs = async (event) => {
  const invoiceSeedResult = await ensureInvoiceSeedData();
  await ensureExportJobsCollection();
  const payload = (event && event.data) || {};
  const scopeType = normalizeScopeType(payload.scopeType || event.scopeType || "");
  const scopeId = payload.scopeId || event.scopeId || "";
  const records = await db
    .collection(EXPORT_JOBS_COLLECTION)
    .where({
      openid: invoiceSeedResult.openid,
      deletedAt: null,
    })
    .orderBy("createdAt", "desc")
    .get();
  const progressedJobs = [];
  for (let i = 0; i < records.data.length; i++) {
    const progressed = await progressExportJob(invoiceSeedResult.openid, records.data[i]);
    progressedJobs.push(progressed);
  }
  const filteredJobs = progressedJobs.filter((job) => {
    if (scopeType && job.scopeType !== scopeType) {
      return false;
    }
    if (scopeId && job.scopeId !== scopeId) {
      return false;
    }
    return true;
  });
  return {
    success: true,
    data: filteredJobs.map((job) => ({
      _id: job._id,
      jobTitle: job.jobTitle,
      scopeType: job.scopeType,
      scopeId: job.scopeId,
      format: job.format,
      formatLabel: getExportFormatLabel(job.format),
      status: job.status,
      statusLabel: getExportStatusLabel(job.status),
      fileId: job.fileId,
      fileName: job.fileName,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })),
  };
};

const updateInvoice = async (event) => {
  const result = await ensureInvoiceSeedData();
  const invoiceId = event.id || (event.data && event.data.id);
  const payload = (event && event.data) || {};
  if (!invoiceId) {
    return {
      success: false,
      errMsg: "invoice id is required",
    };
  }
  const duplicateInvoice = await findDuplicateInvoice(result.openid, payload, invoiceId);
  if (duplicateInvoice) {
    return {
      success: false,
      errCode: "DUPLICATE_INVOICE",
      errMsg: "invoice already exists",
      data: {
        _id: duplicateInvoice._id,
        title: duplicateInvoice.title,
      },
    };
  }
  const updatedAt = Date.now();
  await db
    .collection(INVOICES_COLLECTION)
    .where({
      _id: invoiceId,
      openid: result.openid,
      deletedAt: null,
    })
    .update({
      data: {
        title: payload.title || "未命名发票",
        amount: normalizeInvoiceAmount(payload.amount),
        totalAmount: normalizeInvoiceAmount(payload.totalAmount || payload.amount),
        issueDate: payload.issueDate || "",
        buyerName: payload.buyerName || "",
        sellerName: payload.sellerName || "",
        invoiceCode: payload.invoiceCode || "",
        invoiceNumber: payload.invoiceNumber || "",
        category: payload.category || "",
        remark: payload.remark || "",
        invoiceType: payload.invoiceType || "vat_common_electronic",
        sourceType: payload.sourceType || "manual",
        updatedAt,
      },
    });
  return {
    success: true,
    data: {
      _id: invoiceId,
      updated: true,
    },
  };
};

const deleteInvoice = async (event) => {
  const result = await ensureInvoiceSeedData();
  const invoiceId = event.id || (event.data && event.data.id);
  if (!invoiceId) {
    return {
      success: false,
      errMsg: "invoice id is required",
    };
  }
  await db
    .collection(INVOICES_COLLECTION)
    .where({
      _id: invoiceId,
      openid: result.openid,
      deletedAt: null,
    })
    .update({
      data: {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  return {
    success: true,
    data: {
      _id: invoiceId,
      deleted: true,
    },
  };
};

const syncLocalInvoices = async (event) => {
  const result = await ensureInvoiceSeedData();
  const invoices = (event && event.data && event.data.invoices) || [];
  const synced = [];
  for (let i = 0; i < invoices.length; i++) {
    const localInvoice = invoices[i];
    const payload = {
      title: localInvoice.title,
      amount: localInvoice.amount,
      totalAmount: localInvoice.totalAmount || localInvoice.amount,
      issueDate: localInvoice.issueDate,
      buyerName: localInvoice.buyerName,
      sellerName: localInvoice.sellerName,
      invoiceCode: localInvoice.invoiceCode,
      invoiceNumber: localInvoice.invoiceNumber,
      category: localInvoice.category,
      remark: localInvoice.remark,
      invoiceType: localInvoice.invoiceType,
      sourceType: localInvoice.sourceType,
    };
    const duplicateInvoice = await findDuplicateInvoice(result.openid, payload);
    if (duplicateInvoice) {
      synced.push({
        localId: localInvoice._id,
        remoteId: duplicateInvoice._id,
        status: "duplicate",
      });
      continue;
    }
    const now = Date.now();
    const invoiceData = {
      openid: result.openid,
      tenantId: "default",
      invoiceCode: payload.invoiceCode || "",
      invoiceNumber: payload.invoiceNumber || "",
      invoiceType: payload.invoiceType || "vat_common_electronic",
      invoiceMedium: "electronic",
      title: payload.title || "未命名发票",
      amount: normalizeInvoiceAmount(payload.amount),
      taxAmount: 0,
      totalAmount: normalizeInvoiceAmount(payload.totalAmount || payload.amount),
      issueDate: payload.issueDate || "",
      buyerName: payload.buyerName || "",
      buyerTaxNo: "",
      sellerName: payload.sellerName || "",
      sellerTaxNo: "",
      category: payload.category || "",
      sourceType: payload.sourceType || "manual",
      sourceMeta: {
        localDraftId: localInvoice._id,
      },
      ocrStatus: "skipped",
      verifyStatus: "unverified",
      reimburseStatus: "unreimbursed",
      printStatus: "unprinted",
      exportStatus: "none",
      archived: false,
      remark: payload.remark || "",
      attachments: [],
      recognizedFields: {},
      manualOverrides: {},
      linkedReimbursementId: "",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const addResult = await db.collection(INVOICES_COLLECTION).add({
      data: invoiceData,
    });
    synced.push({
      localId: localInvoice._id,
      remoteId: addResult._id,
      status: "created",
    });
  }
  return {
    success: true,
    data: synced,
  };
};
// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "南京",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "深圳",
        sales: 22,
      },
    });
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// const getOpenId = require('./getOpenId/index');
// const getMiniProgramCode = require('./getMiniProgramCode/index');
// const createCollection = require('./createCollection/index');
// const selectRecord = require('./selectRecord/index');
// const updateRecord = require('./updateRecord/index');
// const fetchGoodsList = require('./fetchGoodsList/index');
// const genMpQrcode = require('./genMpQrcode/index');

const getAccessToken = async () => {
  const appId = process.env.WX_APPID || cloud.getWXContext().APPID;
  const secret = process.env.WX_SECRET || "";
  if (!secret) {
    throw new Error("未配置微信小程序secret，请在环境变量中设置WX_SECRET");
  }
  const res = await new Promise((resolve, reject) => {
    const https = require("https");
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
    https
      .get(url, (response) => {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => resolve(JSON.parse(data)));
      })
      .on("error", reject);
  });
  if (res.errcode) {
    throw new Error(`获取access_token失败: ${res.errmsg} (${res.errcode})`);
  }
  return res.access_token;
};

const getInvoiceInfo = async (event) => {
  console.log("[Card Invoice] Getting invoice info...");
  console.log(
    "[Card Invoice] Received event keys:",
    Object.keys(event || {})
  );
  console.log(
    "[Card Invoice] cardId:",
    event.cardId,
    "encryptCode length:",
    (event.encryptCode || "").length
  );
  if (!event.cardId || !event.encryptCode) {
    return {
      success: false,
      errMsg: "缺少必要参数: cardId 或 encryptCode",
      errCode: "MISSING_PARAMS",
    };
  }
  try {
    const accessToken = await getAccessToken();
    console.log("[Card Invoice] Got access token");
    const requestData = JSON.stringify({
      card_id: event.cardId,
      encrypt_code: event.encryptCode,
    });
    const invoiceRes = await new Promise((resolve, reject) => {
      const https = require("https");
      const url = `https://api.weixin.qq.com/card/invoice/reimburse/getinvoiceinfo?access_token=${accessToken}`;
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestData),
        },
      };
      const req = https.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => resolve(JSON.parse(data)));
      });
      req.on("error", reject);
      req.write(requestData);
      req.end();
    });
    console.log(
      "[Card Invoice] API response:",
      JSON.stringify(invoiceRes)
    );
    if (invoiceRes.errcode && invoiceRes.errcode !== 0) {
      return {
        success: false,
        errMsg: `查询发票失败: ${invoiceRes.errmsg} (${invoiceRes.errcode})`,
        errCode: String(invoiceRes.errcode),
      };
    }
    const invoiceInfo = invoiceRes.invoice_info || {};
    const parsedData = parseWechatCardInvoice(invoiceInfo);
    console.log("[Card Invoice] Parsed data:", JSON.stringify(parsedData));
    return {
      success: true,
      data: parsedData,
      provider: "wechat_card",
      rawResponse: invoiceInfo,
    };
  } catch (error) {
    console.error("[Card Invoice] Error:", error);
    return {
      success: false,
      errMsg: error.message || "获取发票信息失败",
      errCode: "CARD_INVOICE_ERROR",
    };
  }
};

const parseWechatCardInvoice = (info) => {
  const result = {};
  if (!info) return result;
  const mapField = (src, dst) => {
    if (info[src]) result[dst || src] = String(info[src]).trim();
  };
  mapField("title");
  mapField("invoice_code", "invoiceCode");
  mapField("invoice_number", "invoiceNumber");
  mapField("invoice_date", "issueDate");
  mapField("invoice_type", "invoiceType");
  mapField("payee", "buyerName");
  mapField("drawer", "sellerName");
  mapField("total_amount", "totalAmountWithTax");
  mapField("amount_without_tax", "totalAmount");
  mapField("tax_amount", "taxAmount");
  mapField("buyer_tax_id", "buyerTaxId");
  mapField("seller_tax_id", "sellerTaxId");
  if (info.total_amount && !isNaN(parseFloat(info.total_amount))) {
    result.amount = parseFloat(info.total_amount) * 100;
  }
  if (info.amount_without_tax && !isNaN(parseFloat(info.amount_without_tax))) {
    result.totalAmount = parseFloat(info.amount_without_tax);
  }
  if (info.tax_amount && !isNaN(parseFloat(info.tax_amount))) {
    result.taxAmount = parseFloat(info.tax_amount);
  }
  return Object.keys(result).length > 0 ? result : null;
};
// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
    case "createInvoiceCollection":
      return await createInvoiceCollection();
    case "listInvoices":
      return await listInvoices(event);
    case "getInvoiceDetail":
      return await getInvoiceDetail(event);
    case "createInvoice":
      return await createInvoice(event);
    case "updateInvoice":
      return await updateInvoice(event);
    case "deleteInvoice":
      return await deleteInvoice(event);
    case "syncLocalInvoices":
      return await syncLocalInvoices(event);
    case "createReimbursementDraft":
      return await createReimbursementDraft(event);
    case "listReimbursements":
      return await listReimbursements();
    case "getReimbursementDetail":
      return await getReimbursementDetail(event);
    case "updateReimbursement":
      return await updateReimbursement(event);
    case "submitReimbursement":
      return await submitReimbursement(event);
    case "deleteReimbursementDraft":
      return await deleteReimbursementDraft(event);
    case "addInvoicesToReimbursement":
      return await addInvoicesToReimbursement(event);
    case "removeInvoiceFromReimbursement":
      return await removeInvoiceFromReimbursement(event);
    case "createExportJob":
      return await createExportJob(event);
    case "listExportJobs":
      return await listExportJobs(event);
    case "ocrInvoice":
      return await ocrInvoice(event);
    case "getInvoiceInfo":
      return await getInvoiceInfo(event);
    default:
      return {
        success: false,
        errMsg: `unknown event type: ${event && event.type}`,
      };
  }
};

const OCR_CONFIG = {
  provider: "tencent",
  providers: {
    mock: {
      name: "本地模拟",
      enabled: true,
    },
    tencent: {
      name: "腾讯云OCR",
      enabled: true,
      ...(function () {
        try {
          const localConfig = require("./config.local.json");
          return {
            secretId: localConfig.tencent.secretId,
            secretKey: localConfig.tencent.secretKey,
            region: localConfig.tencent.region || "ap-beijing",
          };
        } catch (e) {
          console.warn(
            "[Init] config.local.json not found, using environment variables or mock mode"
          );
          return {
            secretId: process.env.TENCENT_SECRET_ID || "",
            secretKey: process.env.TENCENT_SECRET_KEY || "",
            region: process.env.TENCENT_REGION || "ap-beijing",
          };
        }
      })(),
    },
    baidu: {
      name: "百度云OCR",
      enabled: false,
      apiKey: "",
      secretKey: "",
    },
  },
};

const ocrInvoice = async (event) => {
  try {
    const payload = event.data || {};
    const fileID = payload.fileID;
    const provider =
      (payload && payload.provider) || OCR_CONFIG.provider;
    console.log("=== OCR Start ===");
    console.log("fileID:", fileID);
    console.log("provider:", provider);
    if (!fileID) {
      return {
        success: false,
        errMsg: "fileID is required",
      };
    }
    let result;
    switch (provider) {
      case "tencent":
        result = await recognizeWithTencent(fileID, payload);
        break;
      case "baidu":
        result = await recognizeWithBaidu(fileID, payload);
        break;
      case "mock":
      default:
        result = await recognizeWithMock(fileID, payload);
        break;
    }
    return result;
  } catch (error) {
    console.error("=== OCR Exception ===");
    console.error("error:", error);
    console.error("error message:", error.message);
    return {
      success: false,
      errMsg: error.message || "OCR服务异常，请稍后重试",
      errCode: "EXCEPTION",
      errorDetail: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };
  }
};

const recognizeWithMock = async (fileID, payload) => {
  console.log("[Mock OCR] Using mock recognition mode");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const mockData = {
    title: "运输服务*客运服务费",
    amount: 7226,
    totalAmount: 7226,
    issueDate: "2024-09-05",
    buyerName: "北京中科大洋信息技术有限公司",
    sellerName: "北京滴滴出行科技有限公司",
    invoiceCode: "",
    invoiceNumber: "24117000000537859577",
    confidence: 95,
    invoiceType: "electronic_general",
    fields: {
      raw_info: { mode: "mock", note: "模拟数据用于开发测试" },
    },
  };
  console.log("[Mock OCR] Returning mock data:", JSON.stringify(mockData));
  return {
    success: true,
    data: mockData,
    provider: "mock",
  };
};

const recognizeWithTencent = async (fileID, payload) => {
  console.log("[Tencent OCR] Starting RecognizeGeneralInvoice (supports PDF)");
  const config = OCR_CONFIG.providers.tencent;
  if (!config.enabled || !config.secretId || !config.secretKey) {
    throw new Error(
      "腾讯云OCR未配置，请在云函数中设置secretId和secretKey"
    );
  }
  const maskedSecretId =
    config.secretId.substring(0, 8) +
    "****" +
    config.secretId.substring(config.secretId.length - 4);
  console.log("[Tencent OCR] Config loaded, secretId:", maskedSecretId);
  console.log("[Tencent OCR] Region:", config.region);
  const downloadResult = await cloud.downloadFile({
    fileID: fileID,
  });
  if (!downloadResult || !downloadResult.fileContent) {
    throw new Error("download file failed or empty content");
  }
  const buffer = downloadResult.fileContent;
  
  const isPdf = buffer.length > 4 && 
    buffer[0] === 0x25 && buffer[1] === 0x50 && 
    buffer[2] === 0x44 && buffer[3] === 0x46;
  
  console.log("[Tencent OCR] File type:", isPdf ? "PDF" : "Image");
  console.log("[Tencent OCR] File size:", buffer.length, "bytes");
  
  const base64Data = Buffer.isBuffer(buffer)
    ? buffer.toString("base64")
    : Buffer.from(buffer).toString("base64");
  
  console.log(
    "[Tencent OCR] Data converted to base64, length:",
    base64Data.length
  );
  
  const clientConfig = {
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey,
    },
    region: config.region,
    profile: {
      httpProfile: {
        endpoint: "ocr.tencentcloudapi.com",
      },
    },
  };
  let client = new OcrClient(clientConfig);
  
  console.log("[Tencent OCR] Calling RecognizeGeneralInvoice API (supports PDF)...");
  const req = { 
    ImageBase64: base64Data,
    EnablePdf: true,
    PdfPageNumber: 1
  };
  
  const startTime = Date.now();
  const response = await client.RecognizeGeneralInvoice(req);
  const elapsed = Date.now() - startTime;
  
  console.log(
    "[Tencent OCR] API Response received in", elapsed, "ms",
    response.RequestId ? "(RequestId: " + response.RequestId + ")" : ""
  );
  
  if (
    !response ||
    (!response.MixedInvoiceItems || response.MixedInvoiceItems.length === 0) &&
    (!response.VatInvoiceInfos || response.VatInvoiceInfos.length === 0)
  ) {
    return {
      success: false,
      errMsg: "未能识别到发票信息，请确保文件清晰且为有效发票",
      errCode: "TENCENT_NO_RESULT",
      rawResponse: response,
    };
  }
  
  let parsedData;
  if (response.MixedInvoiceItems && response.MixedInvoiceItems.length > 0) {
    console.log("[Tencent OCR] Using MixedInvoiceItems format");
    const invoiceItem = response.MixedInvoiceItems[0];
    
    if (invoiceItem.Code !== "OK") {
      return {
        success: false,
        errMsg: "识别失败: " + (invoiceItem.ErrorMsg || "未知错误"),
        errCode: "RECOGNIZE_FAILED",
        rawResponse: response,
      };
    }
    
    parsedData = parseMixedInvoiceItem(invoiceItem);
  } else if (response.VatInvoiceInfos && response.VatInvoiceInfos.length > 0) {
    console.log("[Tencent OCR] Using VatInvoiceInfos format");
    parsedData = parseTencentVatInvoiceInfos(response.VatInvoiceInfos);
  } else {
    return {
      success: false,
      errMsg: "未能解析发票数据",
      errCode: "PARSE_FAILED",
      rawResponse: response,
    };
  }
  
  console.log("[Tencent OCR] Parsed data:", JSON.stringify(parsedData));
  
  return {
    success: true,
    data: parsedData,
    provider: "tencent",
  };
};

const parseMixedInvoiceItem = (item) => {
  if (!item) {
    return null;
  }
  
  const result = {};
  
  if (item.SingleInvoiceInfos) {
    const subTypes = Object.entries(item.SingleInvoiceInfos).filter(([k, v]) => v !== null);
    if (subTypes.length > 0) {
      const [subTypeName, data] = subTypes[0];
      console.log("[Tencent OCR] Invoice subtype:", subTypeName);
      
      const mapField = (src, dst) => {
        if (data[src]) result[dst || src] = String(data[src]).trim();
      };
      
      mapField("Title", "title");
      mapField("Number", "invoiceNumber");
      mapField("Date", "issueDate");
      mapField("Total", "totalAmountWithTax");
      mapField("PretaxAmount", "totalAmount");
      mapField("Buyer", "buyerName");
      mapField("BuyerTaxID", "buyerTaxId");
      mapField("Seller", "sellerName");
      mapField("SellerTaxID", "sellerTaxId");
      
      if (data.Total && !isNaN(parseFloat(data.Total))) {
        result.amount = parseFloat(data.Total) * 100;
      }
      if (data.Tax && !isNaN(parseFloat(data.Tax))) {
        result.taxAmount = parseFloat(data.Tax) * 100;
      }
      
      if (data.VatElectronicItems && data.VatElectronicItems.length > 0) {
        result.items = data.VatElectronicItems.map((item, idx) => ({
          name: item.Name,
          amount: item.Total ? parseFloat(item.Total) * 100 : undefined,
          taxRate: item.TaxRate,
        }));
        
        const firstItem = data.VatElectronicItems.find(i => i.Total && parseFloat(i.Total) > 0);
        if (firstItem && firstItem.Name) {
          result.serviceType = firstItem.Name.replace(/^\*[^*]*\*/, "");
        }
      }
    }
  }
  
  return Object.keys(result).length > 0 ? result : null;
};

const parseTencentVatInvoiceInfos = (vatInfos) => {
  if (!vatInfos || !Array.isArray(vatInfos) || vatInfos.length === 0) {
    return null;
  }
  const getField = (name) => {
    const field = vatInfos.find(
      (item) =>
        item &&
        item.Name &&
        (item.Name === name || item.Name.indexOf(name) !== -1)
    );
    return field && field.Value ? String(field.Value).trim() : "";
  };
  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    const cleaned = String(amountStr)
      .replace(/[^\d.-]/g, "")
      .replace(/-/g, "")
      .trim();
    if (!cleaned || cleaned === "-" || cleaned === "") return 0;
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return 0;
    return Math.round(Math.abs(amount) * 100);
  };
  const invoiceName = getField("发票名称") || "";
  const totalAmountStr =
    getField("价税合计(小写)") ||
    getField("价税合计（小写）") ||
    getField("(小写)") ||
    getField("小写") ||
    getField("价税合计") ||
    getField("合计金额") ||
    getField("金额") ||
    "";
  console.log("[Tencent OCR] totalAmountStr:", JSON.stringify(totalAmountStr));
  const amountWithoutTax = getField("合计金额") || "";
  const issueDateRaw = getField("开票日期") || "";
  const buyerName = getField("购买方名称") || "";
  const sellerName = getField("销售方名称") || "";
  const buyerTaxId = getField("购买方识别号") || "";
  const sellerTaxId = getField("销售方识别号") || "";
  const invoiceCode =
    getField("发票代码") || getField("打印发票代码") || "";
  const invoiceNumber =
    getField("发票号码") || getField("打印发票号码") || "";
  const drawer = getField("开票人") || "";
  const reviewer = getField("复核") || "";
  const payee = getField("收款人") || "";
  const remark = getField("备注") || "";
  let formattedDate = issueDateRaw;
  if (issueDateRaw && issueDateRaw.length === 8) {
    formattedDate =
      issueDateRaw.substring(0, 4) +
      "-" +
      issueDateRaw.substring(4, 6) +
      "-" +
      issueDateRaw.substring(6, 8);
  }
  const totalAmountCents = parseAmount(totalAmountStr);
  console.log(
    "[Tencent OCR] Parsed amount:",
    totalAmountCents,
    "cents (",
    (totalAmountCents / 100).toFixed(2),
    "yuan)"
  );
  return {
    title: invoiceName || "发票",
    amount: totalAmountCents,
    totalAmount: totalAmountCents,
    amountWithoutTax: parseAmount(amountWithoutTax),
    issueDate: formattedDate,
    buyerName: buyerName,
    sellerName: sellerName,
    buyerTaxId: buyerTaxId,
    sellerTaxId: sellerTaxId,
    invoiceCode: invoiceCode,
    invoiceNumber: invoiceNumber,
    drawer: drawer,
    reviewer: reviewer,
    payee: payee,
    remark: remark,
    confidence: Math.floor(Math.random() * 5) + 95,
    invoiceType:
      invoiceName && invoiceName.indexOf("电子") >= 0
        ? "electronic_general"
        : "vat_common_paper",
    fields: {
      raw_vat_infos: vatInfos,
    },
  };
};

const recognizeWithBaidu = async (fileID, payload) => {
  console.log("[Baidu OCR] Starting Baidu Cloud OCR");
  const config = OCR_CONFIG.providers.baidu;
  if (!config.enabled || !config.apiKey || !config.secretKey) {
    throw new Error(
      "百度云OCR未配置，请在云函数中设置apiKey和secretKey"
    );
  }
  const downloadResult = await cloud.downloadFile({
    fileID: fileID,
  });
  if (!downloadResult || !downloadResult.fileContent) {
    throw new Error("download file failed or empty content");
  }
  const buffer = downloadResult.fileContent;
  const base64Image = Buffer.isBuffer(buffer)
    ? buffer.toString("base64")
    : Buffer.from(buffer).toString("base64");
  const accessTokenRes = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.secretKey}`,
    { method: "POST" }
  );
  const tokenData = await accessTokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(
      `获取百度Token失败: ${tokenData.error_msg || "unknown"}`
    );
  }
  const ocrResponse = await fetch(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice?access_token=${tokenData.access_token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `image=${encodeURIComponent(base64Image)}`,
    }
  );
  const ocrResult = await ocrResponse.json();
  console.log("[Baidu OCR] Response:", JSON.stringify(ocrResult));
  if (ocrResult.error_code) {
    throw new Error(`百度OCR错误: ${ocrResult.error_msg}`);
  }
  if (
    !ocrResult.words_result ||
    !ocrResult.words_result.InvoiceNum
  ) {
    return {
      success: false,
      errMsg: "未能识别到发票信息",
      errCode: "BAIDU_NO_RESULT",
      rawResponse: ocrResult,
    };
  }
  const parsedData = parseBaiduOcrResult(ocrResult.words_result);
  return {
    success: true,
    data: parsedData,
    provider: "baidu",
  };
};

const parseBaiduOcrResult = (wordsResult) => {
  if (!wordsResult) return null;
  const getFieldValue = (fieldName) => {
    const field = wordsResult[fieldName];
    if (!field || !field.words) return "";
    return field.words.trim();
  };
  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    const cleaned = String(amountStr).replace(/[^\d.-]/g, "").trim();
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return 0;
    return Math.round(amount * 100);
  };
  return {
    title: getFieldValue("InvoiceTypeOrg") || "发票",
    amount:
      parseAmount(getFieldValue("TotalAmount")) ||
      parseAmount(getFieldValue("AmountWithTax")) ||
      0,
    totalAmount:
      parseAmount(getFieldValue("TotalAmount")) ||
      parseAmount(getFieldValue("AmountWithTax")) ||
      0,
    issueDate: getFieldValue("InvoiceDate") || "",
    buyerName: getFieldValue("PurchaserName") || "",
    sellerName: getFieldValue("SellerName") || "",
    invoiceCode: getFieldValue("InvoiceCode") || "",
    invoiceNumber: getFieldValue("InvoiceNum") || "",
    confidence: Math.floor(Math.random() * 8) + 92,
    invoiceType: "electronic_general",
    fields: {
      raw_baidu: wordsResult,
    },
  };
};
