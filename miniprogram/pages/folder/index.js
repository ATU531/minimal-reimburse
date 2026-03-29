Page({
  data: {
    activeFilter: "all",
    selectedCount: 2,
    filters: [
      { id: "all", label: "全部" },
      { id: "month", label: "本月" },
      { id: "unreimbursed", label: "未报销" },
      { id: "ready", label: "可导出" },
      { id: "printed", label: "已打印" },
    ],
    summaryCards: [
      { label: "待整理", value: "18" },
      { label: "本月金额", value: "¥9,860" },
      { label: "待导出", value: "12" },
    ],
    invoices: [
      {
        id: "inv-001",
        selected: true,
        title: "餐饮服务 · 午餐接待",
        type: "电子普票",
        amount: "¥268.00",
        date: "2026-03-27",
        source: "聊天记录",
        owner: "上海知行科技有限公司",
        tags: ["未报销", "未打印", "已识别"],
      },
      {
        id: "inv-002",
        selected: true,
        title: "信息服务 · 软件订阅",
        type: "电子专票",
        amount: "¥3,980.00",
        date: "2026-03-24",
        source: "微信卡包",
        owner: "杭州云行信息技术有限公司",
        tags: ["待核验", "可导出", "未报销"],
      },
      {
        id: "inv-003",
        selected: false,
        title: "交通服务 · 出行报销",
        type: "电子普票",
        amount: "¥186.50",
        date: "2026-03-21",
        source: "智能识别",
        owner: "王芳",
        tags: ["已报销", "已打印", "已归档"],
      },
    ],
  },
  selectFilter(e) {
    this.setData({
      activeFilter: e.currentTarget.dataset.id,
    });
  },
  toggleInvoice(e) {
    const currentId = e.currentTarget.dataset.id;
    const invoices = this.data.invoices.map((item) => {
      if (item.id === currentId) {
        return Object.assign({}, item, {
          selected: !item.selected,
        });
      }
      return item;
    });
    const selectedCount = invoices.filter((item) => item.selected).length;
    this.setData({
      invoices,
      selectedCount,
    });
  },
  openInvoiceDetail(e) {
    wx.navigateTo({
      url: `/pages/invoice-detail/index?id=${e.currentTarget.dataset.id}`,
    });
  },
  handleAction(e) {
    const { label, page } = e.currentTarget.dataset;
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
