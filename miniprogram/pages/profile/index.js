Page({
  data: {
    menuGroups: [
      {
        id: "invoice",
        title: "发票资料",
        items: [
          { label: "发票抬头", page: "/pages/settings/index?section=title" },
          { label: "收票说明", page: "/pages/settings/index?section=email" },
        ],
      },
      {
        id: "export",
        title: "导出设置",
        items: [
          { label: "PDF 导出", page: "/pages/export-center/index?type=pdf" },
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
