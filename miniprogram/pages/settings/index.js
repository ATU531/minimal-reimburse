Page({
  data: {
    currentSection: {
      title: "发票资料设置",
      subtitle: "维护常用抬头和收票说明，便于录入发票时统一使用",
    },
    sectionMap: {
      title: {
        title: "发票抬头",
        subtitle: "维护常用购买方信息，减少重复填写",
      },
      email: {
        title: "收票说明与指引",
        subtitle: "整理微信文件、相册上传和原票 PDF 归档说明",
      },
    },
    settingGroups: [
      {
        title: "常用抬头",
        items: ["默认抬头名称", "纳税人识别号", "购买方地址电话"],
      },
      {
        title: "收票说明",
        items: ["微信文件导入说明", "原票附件保留说明", "重复发票检查提示"],
      },
      {
        title: "归档偏好",
        items: ["PDF 原票归档", "按月份整理票夹", "导出前提示缺少原票"],
      },
    ],
  },
  onLoad(options) {
    const section = options.section || "title";
    const currentSection = this.data.sectionMap[section] || this.data.sectionMap.title;
    this.setData({
      currentSection,
    });
  },
  handleTap(e) {
    wx.showToast({
      title: e.currentTarget.dataset.label,
      icon: "none",
    });
  },
});
