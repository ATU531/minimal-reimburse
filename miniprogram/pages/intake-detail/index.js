Page({
  data: {
    currentSource: null,
    sources: {
      chat: {
        title: "聊天记录导入",
        subtitle: "从聊天图片、文件或转发内容中整理发票",
        guide: "适合报销人先把零散票据转发到工作群，再批量筛出待识别内容。",
      },
      card: {
        title: "微信卡包同步",
        subtitle: "导入卡包中的电子发票并补齐票据字段",
        guide: "适合同步已开具完成的电子票，减少二次上传动作。",
      },
      local: {
        title: "本地文件导入",
        subtitle: "批量导入 PDF、图片或压缩包中的票据文件",
        guide: "适合财务按月整理归档文件，再做统一识别与校验。",
      },
      scan: {
        title: "扫码录入",
        subtitle: "扫描二维码或条码后创建发票草稿",
        guide: "适合纸票、线下票据或临时场景的快速录入。",
      },
      album: {
        title: "手机相册导入",
        subtitle: "从相册中选择票据照片并进入识别流程",
        guide: "适合差旅结束后一次性补录手机里保存的发票图片。",
      },
      ocr: {
        title: "智能识别",
        subtitle: "拍照或从相册导入后自动提取金额、抬头、税号",
        guide: "适合希望先拿到结构化结果，再补充校验和报销归类的场景。",
      },
      manual: {
        title: "手动录入",
        subtitle: "手工填写发票核心字段并保存为票夹记录",
        guide: "适合识别失败、特殊票据或仅做示意录入的情况。",
      },
      more: {
        title: "更多录入方式",
        subtitle: "预留邮件转发、批量采集、企业代收等扩展入口",
        guide: "适合后续功能扩展，当前先确定信息架构和操作布局。",
      },
    },
    sections: [
      { title: "导入来源", detail: "支持单次选择或最近来源快捷重试" },
      { title: "识别预览", detail: "展示金额、抬头、税号、开票日期等核心字段" },
      { title: "补充信息", detail: "可填写科目、项目、报销人、备注等业务字段" },
    ],
    recentRecords: [
      { title: "午餐接待发票", meta: "聊天记录 · 2 分钟前" },
      { title: "软件订阅发票", meta: "微信卡包 · 今天 10:26" },
      { title: "酒店住宿发票", meta: "手机相册 · 昨天" },
    ],
  },
  onLoad(options) {
    const source = options.source || "ocr";
    const currentSource = this.data.sources[source] || this.data.sources.ocr;
    this.setData({
      currentSource,
    });
  },
  handleTap(e) {
    wx.showToast({
      title: e.currentTarget.dataset.label,
      icon: "none",
    });
  },
});
