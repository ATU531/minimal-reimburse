Page({
  data: {
    currentView: {
      title: "报销单详情",
      subtitle: "查看发票归集、审批状态与导出动作",
      status: "待提交",
      amount: "¥5,640.00",
    },
    viewMap: {
      create: {
        title: "新建报销单",
        subtitle: "先选择发票，再补齐报销人与费用归属信息",
        status: "新建中",
        amount: "¥0.00",
      },
      draft: {
        title: "草稿箱",
        subtitle: "继续补全未提交的报销单并检查缺失字段",
        status: "草稿",
        amount: "¥2,860.00",
      },
      history: {
        title: "报销记录",
        subtitle: "按时间查看历史报销单、导出结果与审批状态",
        status: "历史",
        amount: "¥18,760.00",
      },
    },
    sections: [
      { label: "报销人", value: "王芳" },
      { label: "报销部门", value: "市场与运营中心" },
      { label: "关联项目", value: "Q2 差旅与客户接待" },
      { label: "发票数量", value: "12 张" },
      { label: "导出模板", value: "标准报销单 + 明细 Excel" },
    ],
    invoices: [
      { title: "餐饮服务 · 午餐接待", amount: "¥268.00", status: "未报销" },
      { title: "酒店住宿 · 差旅报销", amount: "¥1,860.00", status: "可打印" },
      { title: "信息服务 · 软件订阅", amount: "¥3,980.00", status: "待核验" },
    ],
    timeline: [
      { title: "创建报销单", meta: "今天 09:40 · 静态页面示意" },
      { title: "加入 12 张发票", meta: "今天 10:10 · 来自票夹批量选择" },
      { title: "等待提交审批", meta: "当前状态" },
    ],
  },
  onLoad(options) {
    const mode = options.mode;
    const currentView = this.data.viewMap[mode] || this.data.currentView;
    this.setData({
      currentView,
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
