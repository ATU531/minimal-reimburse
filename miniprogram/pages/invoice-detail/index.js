Page({
  data: {
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
