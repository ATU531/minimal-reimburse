Page({
  data: {
    menuGroups: [
      {
        id: "company",
        title: "企业与抬头",
        items: ["我的企业", "发票抬头", "收票邮箱"],
      },
      {
        id: "workflow",
        title: "报销与导出",
        items: ["报销单设置", "导出偏好", "打印设置"],
      },
      {
        id: "support",
        title: "服务支持",
        items: ["在线客服", "常见问题", "联系我们"],
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
