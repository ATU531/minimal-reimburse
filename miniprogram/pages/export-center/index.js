Page({
  data: {
    currentView: {
      title: "导出中心",
      subtitle: "统一管理 PDF、Excel、打印和导出偏好",
    },
    viewMap: {
      pdf: {
        title: "PDF 导出",
        subtitle: "适合存档、打印预览与对外发送",
      },
      excel: {
        title: "Excel 导出",
        subtitle: "适合财务台账、汇总统计与后续加工",
      },
      preference: {
        title: "导出偏好",
        subtitle: "配置默认格式、字段顺序与命名规则",
      },
      print: {
        title: "打印与归档",
        subtitle: "选择打印版式并确认归档打包内容",
      },
    },
    exportTasks: [
      { title: "发票明细 Excel", status: "可导出", desc: "按票夹筛选结果生成明细表" },
      { title: "报销单 PDF", status: "待确认", desc: "附带封面、发票清单和签字区" },
      { title: "打印打包", status: "预览中", desc: "合并单据、发票与附件页" },
    ],
    presets: [
      "按月份命名文件",
      "导出时附带金额汇总",
      "PDF 中展示核验状态",
      "Excel 中保留来源字段",
    ],
  },
  onLoad(options) {
    const type = options.type || options.mode || "pdf";
    const currentView = this.data.viewMap[type] || this.data.viewMap.pdf;
    this.setData({
      currentView,
    });
  },
  handleTap(e) {
    wx.showToast({
      title: e.currentTarget.dataset.label,
      icon: "none",
    });
  },
});
