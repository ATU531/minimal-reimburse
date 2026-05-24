const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";

Page({
  data: {
    heroStats: [
      { label: "本月票据数", value: "0", unit: "张" },
      { label: "本月合计金额", value: "¥0.00", unit: "" },
    ],
    intakeMethods: [
      {
        id: "ocr",
        title: "智能识别",
        subtitle: "拍照或相册AI提取",
        icon: "/images/icons/ui-camera.svg",
        badge: "推荐",
        page: "/pages/intake-detail/index?source=ocr",
      },
      {
        id: "chat",
        title: "聊天文件",
        subtitle: "直接导入微信文件",
        icon: "/images/icons/ui-chat.svg",
        page: "/pages/intake-detail/index?source=chat",
      },
      {
        id: "album",
        title: "手机相册",
        subtitle: "上传已有发票照片",
        icon: "/images/icons/ui-gallery.svg",
        page: "/pages/intake-detail/index?source=album",
      },
      {
        id: "manual",
        title: "手动录入",
        subtitle: "无原票或手工记账",
        icon: "/images/icons/ui-edit.svg",
        page: "/pages/manual-entry/index",
      },
    ],
    featureCards: [
      {
        id: "folder",
        title: "票夹归集",
        subtitle: "发票统一归集，快速检索筛选",
        tag: "智能聚合",
        icon: "/images/icons/ui-archive.svg",
        action: "switchTab",
        page: "/pages/folder/index",
      },
      {
        id: "export",
        title: "原票 PDF",
        subtitle: "原票附件合并导出，便于归档",
        tag: "极速归档",
        icon: "/images/icons/ui-pdf.svg",
        action: "switchTab",
        page: "/pages/folder/index?filter=ready",
      },
    ],
  },
  onShow() {
    this.fetchHomeStats();
  },
  getCurrentMonthPrefix() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  },
  formatAmount(amountInCents) {
    return `¥${(Number(amountInCents || 0) / 100).toFixed(2)}`;
  },
  getInvoiceAmount(invoice) {
    return Number(invoice.totalAmount || invoice.amount || 0);
  },
  getInvoiceDate(invoice) {
    return String(invoice.issueDate || invoice.date || "");
  },
  getInvoiceMonthPrefix(invoice) {
    const dateText = this.getInvoiceDate(invoice);
    const matched = dateText.match(/^(\d{4})[-/.年](\d{1,2})/);
    if (!matched) {
      return "";
    }
    return `${matched[1]}-${String(matched[2]).padStart(2, "0")}`;
  },
  getLocalDraftInvoices() {
    return wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
  },
  filterCurrentMonthInvoices(invoices, monthPrefix = this.getCurrentMonthPrefix()) {
    return (invoices || []).filter((invoice) =>
      this.getInvoiceMonthPrefix(invoice) === monthPrefix
    );
  },
  getInvoiceIdentity(invoice, fallbackIndex) {
    const invoiceCode = String(invoice.invoiceCode || "").trim();
    const invoiceNumber = String(invoice.invoiceNumber || "").trim();
    if (invoiceCode && invoiceNumber) {
      return `${invoiceCode}|${invoiceNumber}`;
    }
    return (
      invoice._id ||
      invoice.id ||
      [
        invoice.invoiceCode,
        invoice.invoiceNumber,
        this.getInvoiceDate(invoice),
        this.getInvoiceAmount(invoice),
        invoice.title,
      ]
        .filter(Boolean)
        .join("|") ||
      `invoice-${fallbackIndex}`
    );
  },
  mergeInvoices(remoteInvoices, localInvoices) {
    const mergedMap = {};
    [...(localInvoices || []), ...(remoteInvoices || [])].forEach((item, index) => {
      mergedMap[this.getInvoiceIdentity(item, index)] = item;
    });
    return Object.values(mergedMap);
  },
  updateHeroStats(invoices) {
    const totalAmount = (invoices || []).reduce(
      (total, invoice) => total + this.getInvoiceAmount(invoice),
      0
    );
    this.setData({
      heroStats: [
        { label: "本月票据数", value: String((invoices || []).length), unit: "张" },
        { label: "本月合计金额", value: this.formatAmount(totalAmount), unit: "" },
      ],
    });
  },
  fetchHomeStats() {
    const monthPrefix = this.getCurrentMonthPrefix();
    const localMonthInvoices = this.filterCurrentMonthInvoices(
      this.getLocalDraftInvoices(),
      monthPrefix
    );
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listInvoices",
          activeFilter: "month",
          monthPrefix,
        },
      })
      .then((response) => {
        const remoteInvoices = (response.result && response.result.data) || [];
        const remoteMonthInvoices = this.filterCurrentMonthInvoices(
          remoteInvoices,
          monthPrefix
        );
        this.updateHeroStats(this.mergeInvoices(remoteMonthInvoices, localMonthInvoices));
      })
      .catch(() => {
        this.updateHeroStats(localMonthInvoices);
      });
  },
  handleEntryTap(e) {
    const { page, label } = e.currentTarget.dataset;
    if (page) {
      wx.navigateTo({
        url: page,
      });
      return;
    }
    wx.showToast({
      title: label,
      icon: "none",
    });
  },
  getQueryValue(query, targetKey) {
    if (!query) {
      return "";
    }
    const safeDecode = (value) => {
      try {
        return decodeURIComponent(value);
      } catch (e) {
        return value;
      }
    };
    const parts = query.split("&");
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const separatorIndex = part.indexOf("=");
      const rawKey = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
      const rawValue = separatorIndex === -1 ? "" : part.slice(separatorIndex + 1);
      if (safeDecode(rawKey) === targetKey) {
        return safeDecode(rawValue);
      }
    }
    return "";
  },
  handleFeatureTap(e) {
    const { action, page, label } = e.currentTarget.dataset;
    if (action === "switchTab" && page) {
      const queryIndex = page.indexOf("?");
      const tabPath = queryIndex === -1 ? page : page.slice(0, queryIndex);
      const query = queryIndex === -1 ? "" : page.slice(queryIndex + 1);
      const filter = this.getQueryValue(query, "filter");
      if (filter) {
        wx.setStorageSync("folderDefaultFilter", filter);
      }
      wx.switchTab({
        url: tabPath,
      });
      return;
    }
    if (action === "navigate" && page) {
      wx.navigateTo({
        url: page,
      });
      return;
    }
    wx.showToast({
      title: label,
      icon: "none",
    });
  },
});
