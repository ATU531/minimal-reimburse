const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";

Page({
  data: {
    invoiceId: "",
    loading: false,
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
      this.applyInvoiceDetail(localDraft, localDraft.timeline);
      return;
    }
    this.setData({
      loading: true,
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
