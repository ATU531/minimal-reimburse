Page({
  data: {
    intakeMethods: [
      {
        id: "chat",
        title: "聊天文件",
        short: "聊",
        page: "/pages/intake-detail/index?source=chat",
      },
      {
        id: "album",
        title: "手机相册",
        short: "册",
        page: "/pages/intake-detail/index?source=album",
      },
      {
        id: "ocr",
        title: "智能识别",
        short: "AI",
        page: "/pages/intake-detail/index?source=ocr",
      },
      {
        id: "manual",
        title: "手动录入",
        short: "填",
        page: "/pages/manual-entry/index",
      },
    ],
    featureCards: [
      {
        id: "folder",
        title: "票夹归集",
        tag: "核心",
        action: "switchTab",
        page: "/pages/folder/index",
      },
      {
        id: "export",
        title: "原票 PDF",
        tag: "新增",
        action: "switchTab",
        page: "/pages/folder/index",
      },
    ],
    reminders: [
      {
        title: "可导出原票",
        value: "28",
      },
    ],
  },
  handleEntryTap(e) {
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
  handleFeatureTap(e) {
    const { action, page, label } = e.currentTarget.dataset;
    if (action === "switchTab" && page) {
      wx.switchTab({
        url: page,
      });
      return;
    }
    if (action === "navigate" && page) {
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
