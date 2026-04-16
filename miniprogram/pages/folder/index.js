const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";
const PENDING_REIMBURSEMENT_STORAGE_KEY = "pendingReimbursementTarget";

Page({
  data: {
    activeFilter: "all",
    showFilterPanel: false,
    searchKeyword: "",
    selectedCount: 2,
    loading: false,
    syncingLocalDrafts: false,
    pendingReimbursementTarget: null,
    allInvoices: [],
    filters: [
      { id: "all", label: "全部" },
      { id: "month", label: "本月" },
      { id: "unreimbursed", label: "未报销" },
      { id: "ready", label: "可导出" },
      { id: "printed", label: "已打印" },
    ],
    summaryCards: [
      { label: "待整理", value: "18" },
      { label: "本月金额", value: "¥9,860" },
      { label: "待导出", value: "12" },
    ],
    invoices: [
      {
        id: "inv-001",
        selected: true,
        title: "餐饮服务 · 午餐接待",
        type: "电子普票",
        amount: "¥268.00",
        date: "2026-03-27",
        source: "聊天记录",
        owner: "上海知行科技有限公司",
        tags: ["未报销", "未打印", "已识别"],
      },
      {
        id: "inv-002",
        selected: true,
        title: "信息服务 · 软件订阅",
        type: "电子专票",
        amount: "¥3,980.00",
        date: "2026-03-24",
        source: "微信卡包",
        owner: "杭州云行信息技术有限公司",
        tags: ["待核验", "可导出", "未报销"],
      },
      {
        id: "inv-003",
        selected: false,
        title: "交通服务 · 出行报销",
        type: "电子普票",
        amount: "¥186.50",
        date: "2026-03-21",
        source: "智能识别",
        owner: "王芳",
        tags: ["已报销", "已打印", "已归档"],
      },
    ],
  },
  onShow() {
    this.setData({
      pendingReimbursementTarget:
        wx.getStorageSync(PENDING_REIMBURSEMENT_STORAGE_KEY) || null,
    });
    this.syncLocalDrafts().finally(() => {
      this.fetchInvoices();
    });
  },
  formatAmount(amountInCents) {
    return `¥${(Number(amountInCents || 0) / 100).toFixed(2)}`;
  },
  buildSummaryCards(invoices) {
    const pendingCount = invoices.filter(
      (item) => item.verifyStatus !== "verified"
    ).length;
    const amountTotal = invoices.reduce(
      (total, item) => total + Number(item.totalAmount || 0),
      0
    );
    const exportableCount = invoices.filter(
      (item) => item.exportStatus !== "exported"
    ).length;
    return [
      { label: "待整理", value: String(pendingCount) },
      { label: "本月金额", value: this.formatAmount(amountTotal) },
      { label: "待导出", value: String(exportableCount) },
    ];
  },
  normalizeInvoice(invoice) {
    return {
      id: invoice._id,
      selected: false,
      title: invoice.title,
      type: invoice.invoiceTypeLabel,
      amount: this.formatAmount(invoice.totalAmount || invoice.amount),
      amountInCents: Number(invoice.totalAmount || invoice.amount || 0),
      date: invoice.issueDate,
      invoiceCode: invoice.invoiceCode || "",
      invoiceNumber: invoice.invoiceNumber || "",
      source: invoice.sourceLabel,
      owner: invoice.buyerName || invoice.sellerName || "未命名抬头",
      tags: invoice.tags || [],
      verifyStatus: invoice.verifyStatus,
      reimburseStatus: invoice.reimburseStatus,
      printStatus: invoice.printStatus,
      exportStatus: invoice.exportStatus,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  },
  normalizeLocalInvoice(invoice) {
    return {
      id: invoice._id,
      selected: false,
      title: invoice.title,
      type: invoice.invoiceTypeLabel,
      amount: this.formatAmount(invoice.totalAmount || invoice.amount),
      totalAmount: Number(invoice.totalAmount || invoice.amount || 0),
      amountInCents: Number(invoice.totalAmount || invoice.amount || 0),
      date: invoice.issueDate,
      invoiceCode: invoice.invoiceCode || "",
      invoiceNumber: invoice.invoiceNumber || "",
      source: invoice.sourceLabel,
      owner: invoice.buyerName || invoice.sellerName || "未命名抬头",
      tags: invoice.tags || [],
      verifyStatus: invoice.verifyStatus || "unverified",
      reimburseStatus: invoice.reimburseStatus || "unreimbursed",
      printStatus: invoice.printStatus || "unprinted",
      exportStatus: invoice.exportStatus || "none",
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  },
  getLocalDraftInvoices() {
    const localDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    return localDrafts.map((item) => this.normalizeLocalInvoice(item));
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
    if (filterId === "unreimbursed") {
      invoices = allInvoices.filter(
        (item) => item.reimburseStatus === "unreimbursed"
      );
    }
    if (filterId === "ready") {
      invoices = allInvoices.filter((item) => item.exportStatus !== "exported");
    }
    if (filterId === "printed") {
      invoices = allInvoices.filter((item) => item.printStatus === "printed");
    }
    if (filterId === "month") {
      invoices = allInvoices.filter((item) => String(item.date || "").startsWith("2026-03"));
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
    this.setData({
      invoices,
      selectedCount: invoices.filter((item) => item.selected).length,
      summaryCards: this.buildSummaryCards(allInvoices),
    });
  },
  fetchInvoices() {
    this.setData({
      loading: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listInvoices",
          activeFilter: this.data.activeFilter,
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
        this.setData({
          allInvoices: mergedInvoices,
          loading: false,
        });
        this.applyFilter(this.data.activeFilter, mergedInvoices);
      })
      .catch(() => {
        const fallbackInvoices = this.data.invoices.map((item) =>
          Object.assign({}, item, {
            totalAmount: Math.round(
              Number(String(item.amount).replace(/[^\d.]/g, "")) * 100
            ),
            amountInCents: Math.round(
              Number(String(item.amount).replace(/[^\d.]/g, "")) * 100
            ),
            verifyStatus: item.tags.includes("已核验") ? "verified" : "unverified",
            reimburseStatus: item.tags.includes("已报销") ? "reimbursed" : "unreimbursed",
            printStatus: item.tags.includes("已打印") ? "printed" : "unprinted",
            exportStatus: item.tags.includes("已导出") ? "exported" : "none",
          })
        );
        const mergedInvoices = this.mergeInvoices(
          fallbackInvoices,
          this.getLocalDraftInvoices()
        );
        this.setData({
          allInvoices: mergedInvoices,
          loading: false,
        });
        this.applyFilter(this.data.activeFilter, mergedInvoices);
        wx.showToast({
          title: "已展示本地票夹数据",
          icon: "none",
        });
      });
  },
  handleSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
    });
    this.fetchInvoices();
  },
  clearSearch() {
    this.setData({
      searchKeyword: "",
    });
    this.fetchInvoices();
  },
  toggleFilterPanel() {
    this.setData({
      showFilterPanel: !this.data.showFilterPanel,
    });
  },
  closeFilterPanel() {
    this.setData({
      showFilterPanel: false,
    });
  },
  applyPanelFilter(e) {
    const activeFilter = e.currentTarget.dataset.id;
    this.setData({
      activeFilter,
      showFilterPanel: false,
    });
    this.fetchInvoices();
  },
  resetAllFilters() {
    this.setData({
      activeFilter: "all",
      searchKeyword: "",
      showFilterPanel: false,
    });
    this.fetchInvoices();
  },
  clearPendingReimbursementTarget() {
    wx.removeStorageSync(PENDING_REIMBURSEMENT_STORAGE_KEY);
    this.setData({
      pendingReimbursementTarget: null,
    });
  },
  selectFilter(e) {
    const activeFilter = e.currentTarget.dataset.id;
    this.setData({
      activeFilter,
    });
    this.fetchInvoices();
  },
  toggleInvoice(e) {
    const currentId = e.currentTarget.dataset.id;
    const invoices = this.data.invoices.map((item) => {
      if (item.id === currentId) {
        return Object.assign({}, item, {
          selected: !item.selected,
        });
      }
      return item;
    });
    const selectedCount = invoices.filter((item) => item.selected).length;
    this.setData({
      invoices,
      selectedCount,
    });
  },
  openInvoiceDetail(e) {
    wx.navigateTo({
      url: `/pages/invoice-detail/index?id=${e.currentTarget.dataset.id}`,
    });
  },
  handleAction(e) {
    const { label, page } = e.currentTarget.dataset;
    if (label === "加入报销单") {
      const selectedInvoices = this.data.invoices.filter((item) => item.selected);
      if (!selectedInvoices.length) {
        wx.showToast({
          title: "请先勾选发票",
          icon: "none",
        });
        return;
      }
      if (selectedInvoices.some((item) => String(item.id).startsWith("local-"))) {
        wx.showToast({
          title: "请等待本地草稿同步后再创建报销单",
          icon: "none",
        });
        return;
      }
      wx.showLoading({
        title: "生成草稿中",
        mask: true,
      });
      const pendingTarget = this.data.pendingReimbursementTarget;
      wx.cloud
        .callFunction({
          name: "quickstartFunctions",
          data: {
            type: pendingTarget ? "addInvoicesToReimbursement" : "createReimbursementDraft",
            id: pendingTarget && pendingTarget.id,
            invoiceIds: selectedInvoices.map((item) => item.id),
            title: pendingTarget ? pendingTarget.title : "票夹新建报销单",
          },
        })
        .then((response) => {
          const result = response.result;
          if (!result || result.success === false || !(result.data && result.data._id)) {
            throw new Error((result && result.errMsg) || "create reimbursement failed");
          }
          wx.hideLoading();
          if (pendingTarget) {
            this.clearPendingReimbursementTarget();
          }
          wx.navigateTo({
            url: `/pages/reimburse-detail/index?id=${result.data._id}`,
          });
        })
        .catch(() => {
          wx.hideLoading();
          wx.showToast({
            title: pendingTarget ? "追加发票失败" : "生成报销单失败",
            icon: "none",
          });
        });
      return;
    }
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
          throw new Error((result && result.errMsg) || "生成PDF失败");
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
        wx.showToast({
          title: (err.message || "导出失败").substring(0, 20),
          icon: "none",
          duration: 3000,
        });
      });
  },
});
