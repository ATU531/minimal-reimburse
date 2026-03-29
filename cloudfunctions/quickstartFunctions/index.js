const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const INVOICES_COLLECTION = "invoices";

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

const createInvoiceCollection = async () => {
  const result = await ensureInvoiceSeedData();
  return {
    success: true,
    data: result,
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
  }
};
