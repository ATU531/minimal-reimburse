Page({
  data: {
    currentSection: {
      title: "报销单设置",
      subtitle: "配置模板字段、抬头展示与导出默认项",
    },
    sectionMap: {
      company: {
        title: "我的企业",
        subtitle: "管理企业主体、税号与开票信息",
      },
      title: {
        title: "发票抬头",
        subtitle: "设置常用抬头、税号与收票规则",
      },
      email: {
        title: "收票邮箱",
        subtitle: "集中管理邮件收票地址与同步说明",
      },
      reimburse: {
        title: "报销单设置",
        subtitle: "配置模板字段、抬头展示与导出默认项",
      },
      print: {
        title: "打印设置",
        subtitle: "定义打印版式、纸张与页脚信息",
      },
    },
    settingGroups: [
      {
        title: "模板字段",
        items: ["报销人", "部门", "项目", "费用科目", "审批备注"],
      },
      {
        title: "导出与打印",
        items: ["默认导出 Excel", "附带 PDF 版式", "打印页脚展示公司信息"],
      },
      {
        title: "协作规则",
        items: ["允许成员代录", "导出前必须核验", "提交前检查重复发票"],
      },
    ],
  },
  onLoad(options) {
    const section = options.section || "reimburse";
    const currentSection = this.data.sectionMap[section] || this.data.sectionMap.reimburse;
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
