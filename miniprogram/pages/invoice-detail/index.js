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
      source: "微信卡包",
      statusTags: ["待核验", "可导出", "未报销"],
    },
    timeline: [
      { title: "导入票夹", meta: "今天 10:26 · 微信卡包" },
      { title: "完成 OCR 校验", meta: "今天 10:28 · 字段已识别" },
      { title: "等待加入报销单", meta: "当前状态" },
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
        statusTags: invoice.tags || invoice.statusTags || [],
      },
      timeline: timeline || invoice.timeline || this.data.timeline,
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
  handleTap(e) {
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
});
