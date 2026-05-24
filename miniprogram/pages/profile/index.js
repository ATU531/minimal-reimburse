Page({
  data: {
    profileStats: [
      { label: "常用抬头", value: "2" },
      { label: "导出模板", value: "5" },
      { label: "常用科目", value: "9" },
    ],
    menuGroups: [
      {
        id: "invoice",
        title: "发票资料",
        items: [
          {
            label: "发票抬头",
            value: "已设2个",
            icon: "/images/icons/ui-building.svg",
            page: "/pages/settings/index?section=title",
          },
          {
            label: "收票说明与指引",
            value: "可查看",
            icon: "/images/icons/ui-guide.svg",
            page: "/pages/settings/index?section=email",
          },
        ],
      },
      {
        id: "export",
        title: "导出设置",
        items: [
          {
            label: "PDF 导出模板",
            value: "原票归档",
            icon: "/images/icons/ui-pdf.svg",
            page: "/pages/export-center/index?type=pdf",
          },
        ],
      },
      {
        id: "support",
        title: "服务支持",
        items: [
          {
            label: "在线客服",
            value: "",
            icon: "/images/icons/ui-service.svg",
          },
          {
            label: "常见问题",
            value: "",
            icon: "/images/icons/ui-question.svg",
          },
          {
            label: "联系我们",
            value: "",
            icon: "/images/icons/ui-phone.svg",
          },
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
