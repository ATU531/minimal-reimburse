Page({
  data: {
    loading: false,
    actionCards: [
      {
        id: "create",
        title: "新建报销单",
        desc: "按部门、项目或周期归集发票",
        accent: "primary",
        page: "/pages/reimburse-detail/index?mode=create",
      },
      {
        id: "draft",
        title: "草稿箱",
        desc: "继续编辑未完成的报销单",
        accent: "light",
        page: "/pages/reimburse-detail/index?mode=draft",
      },
      {
        id: "history",
        title: "报销记录",
        desc: "查看历史单据与导出记录",
        accent: "light",
        page: "/pages/reimburse-detail/index?mode=history",
      },
      {
        id: "settings",
        title: "报销单设置",
        desc: "配置抬头、模板、打印与导出字段",
        accent: "light",
        page: "/pages/settings/index?section=reimburse",
      },
    ],
    records: [
      {
        id: "rb-001",
        title: "三月差旅报销",
        amount: "¥5,640.00",
        status: "待提交",
        detail: "12 张发票 · 3 位申请人",
        page: "/pages/reimburse-detail/index?id=rb-001",
      },
      {
        id: "rb-002",
        title: "市场活动物料报销",
        amount: "¥2,180.00",
        status: "审批中",
        detail: "6 张发票 · 导出 PDF",
        page: "/pages/reimburse-detail/index?id=rb-002",
      },
      {
        id: "rb-003",
        title: "办公室采购报销",
        amount: "¥980.00",
        status: "已归档",
        detail: "4 张发票 · 已打印",
        page: "/pages/reimburse-detail/index?id=rb-003",
      },
    ],
    summary: {
      draftCount: "0",
      submittedCount: "0",
      exportedCount: "0",
    },
  },
  onShow() {
    this.fetchReimbursements();
  },
  formatAmount(amountInCents) {
    return `¥${(Number(amountInCents || 0) / 100).toFixed(2)}`;
  },
  fetchReimbursements() {
    this.setData({
      loading: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listReimbursements",
        },
      })
      .then((response) => {
        const records = ((response.result && response.result.data) || []).map((item) => ({
          id: item._id,
          title: item.title,
          amount: this.formatAmount(item.totalAmount),
          status: item.statusLabel,
          detail: item.detail,
          page: `/pages/reimburse-detail/index?id=${item._id}`,
        }));
        const rawItems = (response.result && response.result.data) || [];
        this.setData({
          loading: false,
          records,
          summary: {
            draftCount: String(
              rawItems.filter((item) => item.status === "draft").length
            ),
            submittedCount: String(
              rawItems.filter((item) => item.status === "submitted").length
            ),
            exportedCount: String(
              rawItems.filter((item) => item.status === "approved").length
            ),
          },
        });
      })
      .catch(() => {
        this.setData({
          loading: false,
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
