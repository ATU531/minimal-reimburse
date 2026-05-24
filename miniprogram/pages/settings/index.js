const INVOICE_TITLES_STORAGE_KEY = "profileInvoiceTitles";

const EMPTY_TITLE_FORM = {
  name: "",
  taxNumber: "",
  addressPhone: "",
  bankAccount: "",
  commonSubject: "",
  remark: "",
  isDefault: false,
};

const SECTION_MAP = {
  title: {
    title: "发票资料设置",
    subtitle: "维护常用发票抬头和收票说明，便于录入发票时统一使用",
  },
  guide: {
    title: "收票说明与指引",
    subtitle: "整理微信文件、相册上传和原票 PDF 归档说明",
  },
  faq: {
    title: "常见问题",
    subtitle: "查看发票整理、抬头维护和附件归档的常见处理方式",
  },
  contact: {
    title: "联系我们",
    subtitle: "遇到发票资料维护问题时，可以通过以下方式联系支持",
  },
};

const trimTitleForm = (form) => ({
  name: (form.name || "").trim(),
  taxNumber: (form.taxNumber || "").trim().toUpperCase(),
  addressPhone: (form.addressPhone || "").trim(),
  bankAccount: (form.bankAccount || "").trim(),
  commonSubject: (form.commonSubject || "").trim(),
  remark: (form.remark || "").trim(),
  isDefault: !!form.isDefault,
});

const applyDefaultRule = (titles) => {
  const safeTitles = Array.isArray(titles) ? titles : [];
  if (!safeTitles.length) {
    return [];
  }

  const defaultIndex = safeTitles.findIndex((item) => item.isDefault);
  const activeIndex = defaultIndex >= 0 ? defaultIndex : 0;
  return safeTitles.map((item, index) => ({
    ...item,
    isDefault: index === activeIndex,
  }));
};

const loadInvoiceTitles = () => applyDefaultRule(wx.getStorageSync(INVOICE_TITLES_STORAGE_KEY));

Page({
  data: {
    activeSection: "title",
    currentSection: SECTION_MAP.title,
    sectionMap: SECTION_MAP,
    invoiceTitles: [],
    showTitleForm: false,
    editingTitleId: "",
    titleForm: { ...EMPTY_TITLE_FORM },
    titleErrors: {},
    guideGroups: [
      {
        title: "上传前检查",
        items: ["确认发票抬头、税号和金额清晰可读", "优先保留原票 PDF，图片票据请避免裁切边缘", "同一报销单的票据建议按月份集中整理"],
      },
      {
        title: "原票附件保留说明",
        items: ["微信文件和相册图片均可作为附件来源", "电子发票建议保留完整 PDF 原件", "重复发票请先核对发票代码、号码和金额"],
      },
    ],
    faqItems: [
      {
        question: "保存多个抬头后如何选择默认项？",
        answer: "在抬头卡片中点击设为默认，系统会自动取消其他抬头的默认状态。",
      },
      {
        question: "税号可以不填写吗？",
        answer: "个人或无需税号的场景可以留空；填写时需为 15 到 20 位数字或大写字母。",
      },
      {
        question: "删除默认抬头后会怎样？",
        answer: "如果仍有其他抬头，列表第一条会自动成为新的默认抬头。",
      },
    ],
    contactItems: [
      { label: "在线客服", value: "通过个人中心的联系客服入口提交问题" },
      { label: "资料反馈", value: "请附上发票截图、PDF 文件名和问题描述" },
      { label: "处理时间", value: "工作日 9:00-18:00 优先处理发票资料问题" },
    ],
  },

  onLoad(options = {}) {
    const section = options.section || "title";
    const activeSection = SECTION_MAP[section] ? section : "title";

    this.setData({
      activeSection,
      currentSection: SECTION_MAP[activeSection],
      invoiceTitles: loadInvoiceTitles(),
    });
  },

  persistInvoiceTitles(titles) {
    const normalizedTitles = applyDefaultRule(titles);
    wx.setStorageSync(INVOICE_TITLES_STORAGE_KEY, normalizedTitles);
    this.setData({
      invoiceTitles: normalizedTitles,
    });
  },

  showNewTitleForm() {
    this.setData({
      showTitleForm: true,
      editingTitleId: "",
      titleForm: { ...EMPTY_TITLE_FORM, isDefault: this.data.invoiceTitles.length === 0 },
      titleErrors: {},
    });
  },

  editTitle(e) {
    const { id } = e.currentTarget.dataset;
    const title = this.data.invoiceTitles.find((item) => item.id === id);
    if (!title) {
      return;
    }

    this.setData({
      showTitleForm: true,
      editingTitleId: id,
      titleForm: { ...EMPTY_TITLE_FORM, ...title },
      titleErrors: {},
    });
  },

  cancelTitleForm() {
    this.setData({
      showTitleForm: false,
      editingTitleId: "",
      titleForm: { ...EMPTY_TITLE_FORM },
      titleErrors: {},
    });
  },

  handleTitleInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`titleForm.${field}`]: e.detail.value,
      [`titleErrors.${field}`]: "",
    });
  },

  handleDefaultChange(e) {
    this.setData({
      "titleForm.isDefault": !!e.detail.value,
    });
  },

  saveTitleForm() {
    const form = trimTitleForm(this.data.titleForm);
    const errors = {};

    if (!form.name) {
      errors.name = "抬头名称不能为空";
    }

    if (form.taxNumber && !/^[0-9A-Z]{15,20}$/.test(form.taxNumber)) {
      errors.taxNumber = "纳税人识别号格式不正确";
    }

    if (Object.keys(errors).length) {
      this.setData({
        titleErrors: errors,
        titleForm: form,
      });
      return;
    }

    const titles = this.data.invoiceTitles.slice();
    const editingIndex = titles.findIndex((item) => item.id === this.data.editingTitleId);
    const shouldDefault = form.isDefault || titles.length === 0;
    const nextTitle = {
      ...form,
      id: this.data.editingTitleId || `title-${Date.now()}-${titles.length}`,
      isDefault: shouldDefault,
    };

    let nextTitles = titles;
    if (editingIndex >= 0) {
      nextTitles = titles.map((item, index) => (index === editingIndex ? nextTitle : item));
    } else {
      nextTitles = titles.concat(nextTitle);
    }

    if (shouldDefault) {
      nextTitles = nextTitles.map((item) => ({
        ...item,
        isDefault: item.id === nextTitle.id,
      }));
    }

    this.persistInvoiceTitles(nextTitles);
    this.cancelTitleForm();
  },

  setDefaultTitle(e) {
    const { id } = e.currentTarget.dataset;
    const nextTitles = this.data.invoiceTitles.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    this.persistInvoiceTitles(nextTitles);
  },

  deleteTitle(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: "删除抬头",
      content: "删除后不会影响已保存的发票记录。",
      confirmText: "删除",
      confirmColor: "#D92D20",
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        const currentTitles = Array.isArray(this.data.invoiceTitles) ? this.data.invoiceTitles : [];
        const nextTitles = currentTitles.filter((item) => item.id !== id);
        this.persistInvoiceTitles(nextTitles);
        if (this.data.editingTitleId === id) {
          this.cancelTitleForm();
        }
      },
    });
  },
});
