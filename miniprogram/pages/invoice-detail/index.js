const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";

Page({
  data: {
    invoiceId: "",
    loading: false,
    isLocalDraft: false,
    rawInvoice: null,
    invoice: {
      title: "信息服务 · 软件订阅",
      amount: "¥3,980.00",
      type: "电子专票",
      code: "033002400111",
      number: "12458097",
      date: "2026-03-24",
      buyer: "杭州云行信息技术有限公司",
      seller: "上海云联数字科技有限公司",
      source: "智能识别",
      statusTags: ["待核验", "可导出"],
      hasOriginalAttachment: true,
      attachmentTypes: ["image"],
    },
    timeline: [
      { title: "导入票夹", meta: "今天 10:26 · 智能识别" },
      { title: "完成 OCR 校验", meta: "今天 10:28 · 字段已识别" },
      { title: "等待导出归档", meta: "当前状态" },
    ],
  },
  onLoad(options) {
    if (!options.id) {
      return;
    }
    this.setData({
      invoiceId: options.id,
    });
    this.fetchInvoiceDetail(options.id);
  },
  formatAmount(amountInCents) {
    return `¥${(Number(amountInCents || 0) / 100).toFixed(2)}`;
  },
  filterVisibleTags(tags) {
    const hiddenTags = ["未报销", "报销中", "已报销", "未打印", "已打印"];
    return (tags || []).filter((tag) => !hiddenTags.includes(tag));
  },
  normalizeTimeline(timeline) {
    return (timeline || this.data.timeline).map((item) => ({
      title: String(item.title || "")
        .replace("等待加入报销单", "等待导出归档")
        .replace("已完成报销", "已导出归档"),
      meta: String(item.meta || "").replace("报销", "归档"),
    }));
  },
  applyInvoiceDetail(invoice, timeline) {
    this.setData({
      loading: false,
      rawInvoice: invoice,
      invoice: {
        title: invoice.title,
        amount: this.formatAmount(invoice.totalAmount || invoice.amount),
        type: invoice.invoiceTypeLabel || invoice.type,
        code: invoice.invoiceCode || invoice.code,
        number: invoice.invoiceNumber || invoice.number,
        date: invoice.issueDate || invoice.date,
        buyer: invoice.buyerName || invoice.buyer,
        seller: invoice.sellerName || invoice.seller,
        source: invoice.sourceLabel || invoice.source,
        statusTags: this.filterVisibleTags(invoice.tags || invoice.statusTags),
        hasOriginalAttachment: Boolean(invoice.hasOriginalAttachment),
        attachmentTypes: invoice.attachmentTypes || [],
      },
      timeline: this.normalizeTimeline(timeline || invoice.timeline),
    });
  },
  findLocalDraft(invoiceId) {
    const localDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    return localDrafts.find((item) => item._id === invoiceId);
  },
  fetchInvoiceDetail(invoiceId) {
    const localDraft = this.findLocalDraft(invoiceId);
    if (localDraft) {
      this.setData({
        isLocalDraft: true,
      });
      this.applyInvoiceDetail(localDraft, localDraft.timeline);
      return;
    }
    this.setData({
      loading: true,
      isLocalDraft: false,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "getInvoiceDetail",
          id: invoiceId,
        },
      })
      .then((response) => {
        const invoice = response.result && response.result.data;
        if (!invoice) {
          throw new Error("invoice detail is empty");
        }
        this.applyInvoiceDetail(invoice, invoice.timeline);
      })
      .catch(() => {
        this.setData({
          loading: false,
        });
        wx.showToast({
          title: "展示本地示例详情",
          icon: "none",
        });
      });
  },
  handleEdit() {
    wx.navigateTo({
      url: `/pages/manual-entry/index?id=${this.data.invoiceId}`,
    });
  },
  deleteLocalDraft() {
    const localDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    wx.setStorageSync(
      LOCAL_INVOICES_STORAGE_KEY,
      localDrafts.filter((item) => item._id !== this.data.invoiceId)
    );
    wx.showToast({
      title: "已删除本地发票",
      icon: "success",
    });
    setTimeout(() => {
      wx.switchTab({
        url: "/pages/folder/index",
      });
    }, 500);
  },
  deleteRemoteInvoice() {
    wx.showLoading({
      title: "删除中",
      mask: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "deleteInvoice",
          id: this.data.invoiceId,
        },
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: "已删除发票",
          icon: "success",
        });
        setTimeout(() => {
          wx.switchTab({
            url: "/pages/folder/index",
          });
        }, 500);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({
          title: "删除失败",
          icon: "none",
        });
      });
  },
  handleDelete() {
    wx.showModal({
      title: "删除发票",
      content: "删除后会从票夹中移除该发票，是否继续？",
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        if (this.data.isLocalDraft) {
          this.deleteLocalDraft();
          return;
        }
        this.deleteRemoteInvoice();
      },
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
        : result.errMsg || "当前发票缺少可导出的原始图片或PDF";
    }
    return (result && result.errMsg) || "生成PDF失败";
  },
  openGeneratedPdf(exportData) {
    const { tempFileURL, fileName } = exportData;
    wx.downloadFile({
      url: tempFileURL,
      filePath: `${wx.env.USER_DATA_PATH}/${fileName}`,
      success: (downloadRes) => {
        if (downloadRes.statusCode !== 200) {
          wx.showToast({ title: "下载PDF失败", icon: "none" });
          return;
        }
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
              return;
            }
            wx.shareFileMessage({
              filePath: downloadRes.filePath,
              fileName,
              fail: () => {
                wx.showToast({ title: "转发失败", icon: "none" });
              },
            });
          },
        });
      },
      fail: () => {
        wx.showToast({ title: "下载PDF失败", icon: "none" });
      },
    });
  },
  exportCurrentPdf() {
    if (this.data.isLocalDraft) {
      wx.showToast({ title: "本地草稿无法导出，请等待同步", icon: "none" });
      return;
    }
    if (!this.data.invoice.hasOriginalAttachment) {
      wx.showModal({
        title: "暂不可导出",
        content: "当前发票缺少原始图片或PDF，请从票夹选择有原票的发票导出。",
        showCancel: false,
      });
      return;
    }
    wx.showLoading({ title: "正在生成PDF...", mask: true });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "generateExportPdf",
          invoiceIds: [this.data.invoiceId],
        },
        timeout: 30000,
      })
      .then((response) => {
        wx.hideLoading();
        const result = response.result;
        if (!result || !result.success || !result.data) {
          throw new Error(this.formatExportError(result));
        }
        this.openGeneratedPdf(result.data);
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showModal({
          title: "导出失败",
          content: err.message || "导出失败",
          showCancel: false,
        });
      });
  },
  handleTap(e) {
    const { page, label } = e.currentTarget.dataset;
    if (label === "导出 PDF") {
      this.exportCurrentPdf();
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
});
