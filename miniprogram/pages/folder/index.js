const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";

Page({
  data: {
    activeFilter: "all",
    searchKeyword: "",
    selectedCount: 0,
    selectedInvoiceIds: [],
    loading: false,
    syncingLocalDrafts: false,
    allInvoices: [],
    filters: [
      { id: "all", label: "全部" },
      { id: "month", label: "本月" },
      { id: "ready", label: "未导出" },
    ],
    summaryCards: [
      { label: "票据数", value: "0" },
      { label: "合计金额", value: "¥0.00" },
      { label: "已选待导", value: "0" },
    ],
    invoices: [
      {
        id: "inv-001",
        selected: true,
        title: "餐饮服务 · 午餐接待",
        type: "电子普票",
        amount: "¥268.00",
        date: "2026-03-27",
        source: "聊天文件",
        typeIcon: "/images/icons/ui-pdf.svg",
        owner: "上海知行科技有限公司",
        tags: ["已识别", "有原票"],
        totalAmount: 26800,
        amountInCents: 26800,
        verifyStatus: "unverified",
        reimburseStatus: "unreimbursed",
        printStatus: "unprinted",
        exportStatus: "none",
        hasOriginalAttachment: true,
        attachmentTypes: ["pdf"],
        createdAt: 1711516800000,
        updatedAt: 1711516800000,
      },
      {
        id: "inv-002",
        selected: true,
        title: "信息服务 · 软件订阅",
        type: "电子专票",
        amount: "¥3,980.00",
        date: "2026-03-24",
        source: "智能识别",
        typeIcon: "/images/icons/ui-pdf.svg",
        owner: "杭州云行信息技术有限公司",
        tags: ["可导出"],
        totalAmount: 398000,
        amountInCents: 398000,
        verifyStatus: "unverified",
        reimburseStatus: "unreimbursed",
        printStatus: "unprinted",
        exportStatus: "none",
        hasOriginalAttachment: true,
        attachmentTypes: ["pdf"],
        createdAt: 1711257600000,
        updatedAt: 1711257600000,
      },
      {
        id: "inv-003",
        selected: false,
        title: "交通服务 · 出行票据",
        type: "电子普票",
        amount: "¥186.50",
        date: "2026-03-21",
        source: "智能识别",
        typeIcon: "/images/icons/ui-archive.svg",
        owner: "王芳",
        tags: ["已导出", "已归档"],
        totalAmount: 18650,
        amountInCents: 18650,
        verifyStatus: "unverified",
        reimburseStatus: "unreimbursed",
        printStatus: "unprinted",
        exportStatus: "exported",
        hasOriginalAttachment: false,
        attachmentTypes: [],
        createdAt: 1711008000000,
        updatedAt: 1711008000000,
      },
    ],
  },
  consumeDefaultFilter() {
    const defaultFilter = wx.getStorageSync("folderDefaultFilter");
    if (defaultFilter) {
      wx.removeStorageSync("folderDefaultFilter");
      this.setData({
        activeFilter: defaultFilter,
      });
      return defaultFilter;
    }
    return "";
  },
  onLoad() {
    this.consumeDefaultFilter();
  },
  getCurrentMonthPrefix() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  },
  onShow() {
    const activeFilter = this.consumeDefaultFilter() || this.data.activeFilter;
    this.syncLocalDrafts().finally(() => {
      this.fetchInvoices(activeFilter);
    });
  },
  formatAmount(amountInCents) {
    return `¥${(Number(amountInCents || 0) / 100).toFixed(2)}`;
  },
  buildSummaryCards(invoices, selectedCount = this.data.selectedCount) {
    const invoiceCount = invoices.length;
    const amountTotal = invoices.reduce(
      (total, item) => total + Number(item.totalAmount || 0),
      0
    );
    return [
      { label: "票据数", value: String(invoiceCount) },
      { label: "合计金额", value: this.formatAmount(amountTotal) },
      { label: "已选待导", value: String(selectedCount || 0) },
    ];
  },
  filterVisibleTags(tags) {
    const hiddenTags = [
      "已核验",
      "待核验",
      "核验失败",
      "未报销",
      "报销中",
      "已报销",
      "未打印",
      "已打印",
    ];
    return (tags || []).filter((tag) => !hiddenTags.includes(tag));
  },
  normalizeInvoice(invoice) {
    const totalAmount = Number(invoice.totalAmount || invoice.amount || 0);
    return {
      id: invoice._id,
      selected: false,
      title: invoice.title,
      type: invoice.invoiceTypeLabel,
      amount: this.formatAmount(totalAmount),
      totalAmount,
      amountInCents: totalAmount,
      date: invoice.issueDate,
      invoiceCode: invoice.invoiceCode || "",
      invoiceNumber: invoice.invoiceNumber || "",
      source: invoice.sourceLabel,
      typeIcon: invoice.hasOriginalAttachment
        ? "/images/icons/ui-pdf.svg"
        : "/images/icons/ui-archive.svg",
      owner: invoice.buyerName || invoice.sellerName || "未命名抬头",
      tags: this.filterVisibleTags(invoice.tags),
      verifyStatus: invoice.verifyStatus,
      reimburseStatus: invoice.reimburseStatus,
      printStatus: invoice.printStatus,
      exportStatus: invoice.exportStatus,
      hasOriginalAttachment: Boolean(invoice.hasOriginalAttachment),
      attachmentTypes: invoice.attachmentTypes || [],
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  },
  normalizeLocalInvoice(invoice) {
    const totalAmount = Number(invoice.totalAmount || invoice.amount || 0);
    return {
      id: invoice._id,
      selected: false,
      title: invoice.title,
      type: invoice.invoiceTypeLabel,
      amount: this.formatAmount(totalAmount),
      totalAmount,
      amountInCents: totalAmount,
      date: invoice.issueDate,
      invoiceCode: invoice.invoiceCode || "",
      invoiceNumber: invoice.invoiceNumber || "",
      source: invoice.sourceLabel,
      typeIcon: "/images/icons/ui-archive.svg",
      owner: invoice.buyerName || invoice.sellerName || "未命名抬头",
      tags: this.filterVisibleTags(invoice.tags),
      verifyStatus: invoice.verifyStatus || "unverified",
      reimburseStatus: invoice.reimburseStatus || "unreimbursed",
      printStatus: invoice.printStatus || "unprinted",
      exportStatus: invoice.exportStatus || "none",
      hasOriginalAttachment: false,
      attachmentTypes: [],
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  },
  getLocalDraftInvoices() {
    const localDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    return localDrafts.map((item) => this.normalizeLocalInvoice(item));
  },
  getSelectedInvoiceIdMap(selectedInvoiceIds = this.data.selectedInvoiceIds) {
    const selectedIdMap = {};
    (selectedInvoiceIds || []).forEach((id) => {
      selectedIdMap[id] = true;
    });
    return selectedIdMap;
  },
  applySelectedState(invoices, selectedIdMap) {
    return invoices.map((item) =>
      Object.assign({}, item, {
        selected: Boolean(selectedIdMap[item.id]),
      })
    );
  },
  mergeInvoices(remoteInvoices, localInvoices) {
    const mergedMap = {};
    [...localInvoices, ...remoteInvoices].forEach((item) => {
      mergedMap[item.id] = item;
    });
    return Object.values(mergedMap).sort(
      (left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0)
    );
  },
  syncLocalDrafts() {
    const localDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    if (!localDrafts.length) {
      return Promise.resolve();
    }
    this.setData({
      syncingLocalDrafts: true,
    });
    return wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "syncLocalInvoices",
          data: {
            invoices: localDrafts,
          },
        },
      })
      .then((response) => {
        const syncedItems = (response.result && response.result.data) || [];
        if (!syncedItems.length) {
          return;
        }
        const syncedIdMap = {};
        syncedItems.forEach((item) => {
          syncedIdMap[item.localId] = true;
        });
        const remainingDrafts = localDrafts.filter(
          (item) => !syncedIdMap[item._id]
        );
        wx.setStorageSync(LOCAL_INVOICES_STORAGE_KEY, remainingDrafts);
      })
      .catch(() => {})
      .finally(() => {
        this.setData({
          syncingLocalDrafts: false,
        });
      });
  },
  applyFilter(filterId, nextAllInvoices) {
    const allInvoices = nextAllInvoices || this.data.allInvoices;
    const keyword = String(this.data.searchKeyword || "").trim().toLowerCase();
    let invoices = allInvoices;
    if (filterId === "ready") {
      invoices = allInvoices.filter(
        (item) => item.exportStatus === "none"
      );
    }
    if (filterId === "month") {
      const currentMonthPrefix = this.getCurrentMonthPrefix();
      invoices = allInvoices.filter((item) =>
        String(item.date || "").startsWith(currentMonthPrefix)
      );
    }
    if (keyword) {
      invoices = invoices.filter((item) => {
        const searchableText = [
          item.title,
          item.owner,
          item.amount,
          item.source,
          item.invoiceCode,
          item.invoiceNumber,
        ]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(keyword);
      });
    }
    const selectedCount = invoices.filter((item) => item.selected).length;
    this.setData({
      invoices,
      selectedCount,
      summaryCards: this.buildSummaryCards(invoices, selectedCount),
    });
  },
  fetchInvoices(activeFilter = this.data.activeFilter) {
    this.setData({
      loading: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listInvoices",
          activeFilter: activeFilter,
          monthPrefix: this.getCurrentMonthPrefix(),
          searchKeyword: this.data.searchKeyword,
        },
      })
      .then((response) => {
        const remoteInvoices = ((response.result && response.result.data) || []).map(
          (item) => this.normalizeInvoice(item)
        );
        const mergedInvoices = this.mergeInvoices(
          remoteInvoices,
          this.getLocalDraftInvoices()
        );
        const selectedIdMap = this.getSelectedInvoiceIdMap();
        const invoicesWithSelection = this.applySelectedState(
          mergedInvoices,
          selectedIdMap
        );
        this.setData({
          allInvoices: invoicesWithSelection,
          loading: false,
        });
        this.applyFilter(activeFilter, invoicesWithSelection);
      })
      .catch(() => {
        const fallbackInvoices = this.data.invoices.map((item) =>
          Object.assign({}, item, {
            totalAmount: Number(item.totalAmount || item.amountInCents || 0),
            amountInCents: Number(item.amountInCents || item.totalAmount || 0),
            verifyStatus: item.verifyStatus || "unverified",
            reimburseStatus: item.reimburseStatus || "unreimbursed",
            printStatus: item.printStatus || "unprinted",
            exportStatus: item.exportStatus || "none",
            hasOriginalAttachment: Boolean(item.hasOriginalAttachment),
          })
        );
        const mergedInvoices = this.mergeInvoices(
          fallbackInvoices,
          this.getLocalDraftInvoices()
        );
        const selectedIdMap = this.getSelectedInvoiceIdMap();
        const invoicesWithSelection = this.applySelectedState(
          mergedInvoices,
          selectedIdMap
        );
        this.setData({
          allInvoices: invoicesWithSelection,
          loading: false,
        });
        this.applyFilter(activeFilter, invoicesWithSelection);
        wx.showToast({
          title: "已展示本地票夹数据",
          icon: "none",
        });
      });
  },
  handleSearchInput(e) {
    this.setData(
      {
        searchKeyword: e.detail.value,
      },
      () => {
        this.fetchInvoices(this.data.activeFilter);
      }
    );
  },
  clearSearch() {
    this.setData(
      {
        searchKeyword: "",
      },
      () => {
        this.fetchInvoices(this.data.activeFilter);
      }
    );
  },
  refreshCurrentFilter() {
    this.fetchInvoices(this.data.activeFilter);
  },
  selectFilter(e) {
    const activeFilter = e.currentTarget.dataset.id;
    this.setData(
      {
        activeFilter,
      },
      () => {
        this.fetchInvoices(activeFilter);
      }
    );
  },
  toggleInvoice(e) {
    const currentId = e.currentTarget.dataset.id;
    const currentSelectedIds = this.data.selectedInvoiceIds || [];
    const isSelected = currentSelectedIds.includes(currentId);
    const selectedInvoiceIds = isSelected
      ? currentSelectedIds.filter((id) => id !== currentId)
      : currentSelectedIds.concat(currentId);
    const selectedIdMap = this.getSelectedInvoiceIdMap(selectedInvoiceIds);
    const invoices = this.applySelectedState(this.data.invoices, selectedIdMap);
    const allInvoices = this.applySelectedState(
      this.data.allInvoices,
      selectedIdMap
    );
    const selectedCount = invoices.filter((item) => item.selected).length;
    this.setData({
      invoices,
      allInvoices,
      selectedInvoiceIds,
      selectedCount,
      summaryCards: this.buildSummaryCards(invoices, selectedCount),
    });
  },
  openInvoiceDetail(e) {
    wx.navigateTo({
      url: `/pages/invoice-detail/index?id=${e.currentTarget.dataset.id}`,
    });
  },
  handleAction(e) {
    const { label, page } = e.currentTarget.dataset;
    if (label === "导出 PDF") {
      this.exportSelectedPdf();
      return;
    }
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
  exportSelectedPdf() {
    const selectedInvoices = this.data.invoices.filter((item) => item.selected);
    if (!selectedInvoices.length) {
      wx.showToast({ title: "请先勾选要导出的发票", icon: "none" });
      return;
    }
    if (selectedInvoices.some((item) => String(item.id).startsWith("local-"))) {
      wx.showToast({ title: "本地草稿无法导出，请等待同步", icon: "none" });
      return;
    }
    const invoiceIds = selectedInvoices.map((item) => item.id);
    wx.showLoading({ title: "正在生成PDF...", mask: true });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "generateExportPdf",
          invoiceIds: invoiceIds,
        },
        timeout: 30000,
      })
      .then((res) => {
        wx.hideLoading();
        const result = res.result;
        if (!result || !result.success || !result.data) {
          throw new Error(this.formatExportError(result));
        }
        const { tempFileURL, fileName } = result.data;
        console.log("[Export PDF] tempFileURL:", tempFileURL);
        wx.downloadFile({
          url: tempFileURL,
          filePath: `${wx.env.USER_DATA_PATH}/${fileName}`,
          success: (downloadRes) => {
            if (downloadRes.statusCode === 200) {
              wx.showActionSheet({
                itemList: ["打开PDF", "转发到聊天"],
                success: (actionRes) => {
                  if (actionRes.tapIndex === 0) {
                    wx.openDocument({
                      filePath: downloadRes.filePath,
                      showMenu: true,
                      fileType: "pdf",
                      fail: () => {
                        wx.showToast({ title: "打开PDF失败", icon: "none" });
                      },
                    });
                  } else if (actionRes.tapIndex === 1) {
                    wx.shareFileMessage({
                      filePath: downloadRes.filePath,
                      fileName: fileName,
                      fail: () => {
                        wx.showToast({ title: "转发失败", icon: "none" });
                      },
                    });
                  }
                },
              });
            }
          },
          fail: () => {
            wx.showToast({ title: "下载PDF失败", icon: "none" });
          },
        });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("[Export PDF] Error:", err);
        wx.showModal({
          title: "导出失败",
          content: err.message || "导出失败",
          showCancel: false,
        });
      });
  },
  formatExportError(result) {
    if (
      result &&
      result.errCode === "EXPORT_UNSUPPORTED_ATTACHMENT" &&
      result.data &&
      result.data.unsupportedInvoices
    ) {
      const names = result.data.unsupportedInvoices
        .map((item) => item.title)
        .filter(Boolean)
        .slice(0, 5)
        .join("、");
      return names
        ? `以下发票缺少原始图片或PDF：${names}`
        : result.errMsg || "所选发票缺少可导出的原始图片或PDF";
    }
    return (result && result.errMsg) || "生成PDF失败";
  },
});
