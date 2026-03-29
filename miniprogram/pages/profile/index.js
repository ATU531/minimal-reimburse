Page({
  data: {
    menuGroups: [
      {
        id: "company",
        title: "企业与抬头",
        items: [
          { label: "我的企业", page: "/pages/settings/index?section=company" },
          { label: "发票抬头", page: "/pages/settings/index?section=title" },
          { label: "收票邮箱", page: "/pages/settings/index?section=email" },
        ],
      },
      {
        id: "workflow",
        title: "报销与导出",
        items: [
          { label: "报销单设置", page: "/pages/settings/index?section=reimburse" },
          { label: "导出偏好", page: "/pages/export-center/index?type=preference" },
          { label: "打印设置", page: "/pages/settings/index?section=print" },
        ],
      },
      {
        id: "support",
        title: "服务支持",
        items: [
          { label: "在线客服" },
          { label: "常见问题" },
          { label: "联系我们" },
        ],
      },
    ],
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
