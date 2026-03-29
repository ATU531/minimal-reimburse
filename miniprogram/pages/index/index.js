Page({
  data: {
    intakeMethods: [
      {
        id: "chat",
        title: "聊天记录",
        short: "聊",
        desc: "提取聊天里的发票截图或转发内容",
        page: "/pages/intake-detail/index?source=chat",
      },
      {
        id: "card",
        title: "微信卡包",
        short: "卡",
        desc: "同步卡包中的电子发票",
        page: "/pages/intake-detail/index?source=card",
      },
      {
        id: "local",
        title: "本地文件",
        short: "文",
        desc: "导入 PDF、图片或压缩包中的票据",
        page: "/pages/intake-detail/index?source=local",
      },
      {
        id: "scan",
        title: "扫码录入",
        short: "扫",
        desc: "扫描二维码快速创建发票记录",
        page: "/pages/intake-detail/index?source=scan",
      },
      {
        id: "album",
        title: "手机相册",
        short: "册",
        desc: "从相册中批量挑选待识别票据图片",
        page: "/pages/intake-detail/index?source=album",
      },
      {
        id: "ocr",
        title: "智能识别",
        short: "AI",
        desc: "拍照或相册导入后自动识别字段",
        page: "/pages/intake-detail/index?source=ocr",
      },
      {
        id: "manual",
        title: "手动录入",
        short: "填",
        desc: "手动补录金额、抬头、税号等信息",
        page: "/pages/manual-entry/index",
      },
      {
        id: "more",
        title: "更多方式",
        short: "···",
        desc: "预留邮件转发、批量导入等扩展入口",
        page: "/pages/intake-detail/index?source=more",
      },
    ],
    featureCards: [
      {
        id: "folder",
        title: "票夹归集",
        tag: "核心",
        desc: "集中查看发票状态、来源、金额与导出准备情况",
        action: "switchTab",
        page: "/pages/folder/index",
      },
      {
        id: "export",
        title: "导出中心",
        tag: "新增",
        desc: "按发票或报销单导出 PDF、Excel，便于归档与流转",
        action: "navigate",
        page: "/pages/export-center/index",
      },
      {
        id: "reimburse",
        title: "报销管理",
        tag: "流程",
        desc: "创建报销单、查看草稿与历史记录",
        action: "switchTab",
        page: "/pages/reimburse/index",
      },
      {
        id: "print",
        title: "打印与归档",
        tag: "效率",
        desc: "支持打印版式预览与后续发票打印流程扩展",
        action: "navigate",
        page: "/pages/export-center/index?mode=print",
      },
    ],
    reminders: [
      {
        title: "待核验发票",
        value: "12",
        helper: "建议优先处理金额较高票据",
      },
      {
        title: "本周可导出",
        value: "28",
        helper: "适合批量导出 PDF 与 Excel 台账",
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
