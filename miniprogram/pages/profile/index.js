const INVOICE_TITLES_STORAGE_KEY = "profileInvoiceTitles";
const PDF_TEMPLATE_STORAGE_KEY = "profilePdfTemplate";
const CONTACT_ROWS = [
  { label: "邮箱", value: "piaoyili2026@126.com" },
  { label: "微信号", value: "ATU-531" },
];

const PDF_TEMPLATE_OPTIONS = [
  {
    id: "original-archive",
    label: "原票模板",
  },
];

const getLocalInvoiceTitles = () => {
  const titles = wx.getStorageSync(INVOICE_TITLES_STORAGE_KEY);
  return Array.isArray(titles) ? titles : [];
};

const getLocalPdfTemplate = () => {
  const storedTemplate = wx.getStorageSync(PDF_TEMPLATE_STORAGE_KEY) || {};
  const selectedTemplateId = storedTemplate.selectedTemplateId || PDF_TEMPLATE_OPTIONS[0].id;
  return (
    PDF_TEMPLATE_OPTIONS.find((template) => template.id === selectedTemplateId) ||
    PDF_TEMPLATE_OPTIONS[0]
  );
};

const hasDefaultTitle = (invoiceTitles) =>
  invoiceTitles.some((title) => title && title.isDefault);

const buildProfileStats = (invoiceTitles) => [
  { label: "常用抬头", value: String(invoiceTitles.length) },
  { label: "导出模板", value: String(PDF_TEMPLATE_OPTIONS.length) },
  { label: "默认抬头", value: hasDefaultTitle(invoiceTitles) ? "1" : "0" },
];

const buildMenuGroups = (invoiceTitles, selectedTemplate) => [
  {
    id: "invoice",
    title: "发票资料",
    items: [
      {
        label: "发票抬头",
        value: invoiceTitles.length ? `已设${invoiceTitles.length}个` : "待设置",
        icon: "/images/icons/ui-building.svg",
        page: "/pages/settings/index?section=title",
      },
      {
        label: "收票说明与指引",
        value: "可查看",
        icon: "/images/icons/ui-guide.svg",
        page: "/pages/settings/index?section=guide",
      },
    ],
  },
  {
    id: "export",
    title: "导出设置",
    items: [
      {
        label: "PDF 导出模板",
        value: selectedTemplate.label,
        icon: "/images/icons/ui-pdf.svg",
        page: "/pages/export-center/index?type=pdf&mode=settings",
      },
    ],
  },
  {
    id: "support",
    title: "服务支持",
    items: [
      {
        label: "常见问题",
        icon: "/images/icons/ui-question.svg",
        page: "/pages/settings/index?section=faq",
      },
      {
        label: "联系我们",
        icon: "/images/icons/ui-phone.svg",
        action: "contact-modal",
      },
    ],
  },
];

Page({
  data: {
    profileStats: [],
    menuGroups: [],
    contactRows: CONTACT_ROWS,
    showContactModal: false,
  },

  onLoad() {
    this.refreshProfileData();
  },

  onShow() {
    this.refreshProfileData();
  },

  refreshProfileData() {
    const invoiceTitles = getLocalInvoiceTitles();
    const selectedTemplate = getLocalPdfTemplate();

    this.setData({
      profileStats: buildProfileStats(invoiceTitles),
      menuGroups: buildMenuGroups(invoiceTitles, selectedTemplate),
    });
  },

  handleTap(e) {
    const { action, page, label } = e.currentTarget.dataset;
    if (action === "contact-modal") {
      this.setData({
        showContactModal: true,
      });
      return;
    }

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

  hideContactModal() {
    this.setData({
      showContactModal: false,
    });
  },

  noop() {},
});
