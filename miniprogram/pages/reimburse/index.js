Page({
  data: {
    actionCards: [
      {
        id: "create",
        title: "新建报销单",
        desc: "按部门、项目或周期归集发票",
        accent: "primary",
      },
      {
        id: "draft",
        title: "草稿箱",
        desc: "继续编辑未完成的报销单",
        accent: "light",
      },
      {
        id: "history",
        title: "报销记录",
        desc: "查看历史单据与导出记录",
        accent: "light",
      },
      {
        id: "settings",
        title: "报销单设置",
        desc: "配置抬头、模板、打印与导出字段",
        accent: "light",
      },
    ],
    records: [
      {
        id: "rb-001",
        title: "三月差旅报销",
        amount: "¥5,640.00",
        status: "待提交",
        detail: "12 张发票 · 3 位申请人",
      },
      {
        id: "rb-002",
        title: "市场活动物料报销",
        amount: "¥2,180.00",
        status: "审批中",
        detail: "6 张发票 · 导出 PDF",
      },
      {
        id: "rb-003",
        title: "办公室采购报销",
        amount: "¥980.00",
        status: "已归档",
        detail: "4 张发票 · 已打印",
      },
    ],
  },
  handleTap(e) {
    wx.showToast({
      title: e.currentTarget.dataset.label,
      icon: "none",
    });
  },
});
