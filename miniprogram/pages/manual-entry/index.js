const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";

Page({
  data: {
    submitting: false,
    invoiceTypeOptions: [
      { label: "电子普票", value: "vat_common_electronic" },
      { label: "电子专票", value: "vat_special_electronic" },
      { label: "纸质普票", value: "vat_common_paper" },
    ],
    sourceOptions: [
      { label: "手动录入", value: "manual" },
      { label: "聊天记录补录", value: "chat" },
      { label: "微信卡包补录", value: "card" },
      { label: "智能识别修正", value: "ocr" },
    ],
    form: {
      title: "",
      amount: "",
      issueDate: "2026-03-30",
      buyerName: "",
      sellerName: "",
      invoiceCode: "",
      invoiceNumber: "",
      category: "",
      remark: "",
      invoiceType: "vat_common_electronic",
      sourceType: "manual",
    },
    invoiceTypeIndex: 0,
    sourceIndex: 0,
  },
  getInvoiceTypeLabel(invoiceType) {
    const matchedOption = this.data.invoiceTypeOptions.find(
      (item) => item.value === invoiceType
    );
    return matchedOption ? matchedOption.label : "电子普票";
  },
  getSourceLabel(sourceType) {
    const matchedOption = this.data.sourceOptions.find(
      (item) => item.value === sourceType
    );
    return matchedOption ? matchedOption.label : "手动录入";
  },
  saveLocalDraftInvoice(form) {
    const timestamp = Date.now();
    const draftInvoice = {
      _id: `local-${timestamp}`,
      title: form.title.trim(),
      totalAmount: Math.round(Number(form.amount) * 100),
      amount: Math.round(Number(form.amount) * 100),
      issueDate: form.issueDate,
      invoiceType: form.invoiceType,
      invoiceTypeLabel: this.getInvoiceTypeLabel(form.invoiceType),
      invoiceCode: form.invoiceCode.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      buyerName: form.buyerName.trim(),
      sellerName: form.sellerName.trim(),
      sourceType: form.sourceType,
      sourceLabel: this.getSourceLabel(form.sourceType),
      verifyStatus: "unverified",
      reimburseStatus: "unreimbursed",
      printStatus: "unprinted",
      exportStatus: "none",
      tags: ["待核验", "可导出", "未报销", "未打印"],
      timeline: [
        {
          title: "保存到本地票夹",
          meta: "云端超时，已暂存到本地",
        },
        {
          title: "等待云端同步",
          meta: "可继续在票夹中查看该草稿",
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const existingDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    wx.setStorageSync(LOCAL_INVOICES_STORAGE_KEY, [
      draftInvoice,
      ...existingDrafts,
    ]);
    return draftInvoice;
  },
  getLocalDrafts() {
    return wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
  },
  findDuplicateLocalDraft(form) {
    const invoiceCode = String(form.invoiceCode || "").trim();
    const invoiceNumber = String(form.invoiceNumber || "").trim();
    const totalAmount = Math.round(Number(form.amount) * 100);
    return this.getLocalDrafts().find((item) => {
      if (
        invoiceCode &&
        invoiceNumber &&
        item.invoiceCode === invoiceCode &&
        item.invoiceNumber === invoiceNumber
      ) {
        return true;
      }
      return (
        item.title === form.title.trim() &&
        item.issueDate === form.issueDate &&
        Number(item.totalAmount || item.amount || 0) === totalAmount &&
        String(item.buyerName || "") === form.buyerName.trim()
      );
    });
  },
  finishSubmit(options) {
    this.setData({
      submitting: false,
    });
    wx.hideLoading();
    wx.showToast({
      title: options.message,
      icon: options.icon || "success",
    });
    setTimeout(() => {
      if (options.invoiceId) {
        wx.redirectTo({
          url: `/pages/invoice-detail/index?id=${options.invoiceId}`,
        });
        return;
      }
      wx.switchTab({
        url: "/pages/folder/index",
      });
    }, options.delay || 500);
  },
  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const nextForm = Object.assign({}, this.data.form, {
      [field]: e.detail.value,
    });
    this.setData({
      form: nextForm,
    });
  },
  handleDateChange(e) {
    this.setData({
      form: Object.assign({}, this.data.form, {
        issueDate: e.detail.value,
      }),
    });
  },
  handleInvoiceTypeChange(e) {
    const invoiceTypeIndex = Number(e.detail.value);
    this.setData({
      invoiceTypeIndex,
      form: Object.assign({}, this.data.form, {
        invoiceType: this.data.invoiceTypeOptions[invoiceTypeIndex].value,
      }),
    });
  },
  handleSourceChange(e) {
    const sourceIndex = Number(e.detail.value);
    this.setData({
      sourceIndex,
      form: Object.assign({}, this.data.form, {
        sourceType: this.data.sourceOptions[sourceIndex].value,
      }),
    });
  },
  validateForm() {
    const { title, amount, issueDate } = this.data.form;
    if (!title.trim()) {
      return "请填写发票标题";
    }
    if (!amount || Number(amount) <= 0) {
      return "请填写正确金额";
    }
    if (!issueDate) {
      return "请选择开票日期";
    }
    return "";
  },
  handleSubmit() {
    if (this.data.submitting) {
      return;
    }
    const validationMessage = this.validateForm();
    if (validationMessage) {
      wx.showToast({
        title: validationMessage,
        icon: "none",
      });
      return;
    }
    const { form } = this.data;
    const duplicateLocalDraft = this.findDuplicateLocalDraft(form);
    if (duplicateLocalDraft) {
      wx.showToast({
        title: "本地已有重复发票",
        icon: "none",
      });
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/invoice-detail/index?id=${duplicateLocalDraft._id}`,
        });
      }, 600);
      return;
    }
    this.setData({
      submitting: true,
    });
    wx.showLoading({
      title: "保存中",
      mask: true,
    });
    const requestPayload = {
      title: form.title.trim(),
      amount: Math.round(Number(form.amount) * 100),
      totalAmount: Math.round(Number(form.amount) * 100),
      issueDate: form.issueDate,
      buyerName: form.buyerName.trim(),
      sellerName: form.sellerName.trim(),
      invoiceCode: form.invoiceCode.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      category: form.category.trim(),
      remark: form.remark.trim(),
      invoiceType: form.invoiceType,
      sourceType: form.sourceType,
    };
    Promise.race([
      wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "createInvoice",
          data: requestPayload,
        },
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("timeout"));
        }, 5000);
      }),
    ])
      .then((response) => {
        const result = response && response.result;
        if (result && result.success === false && result.errCode === "DUPLICATE_INVOICE") {
          this.finishSubmit({
            message: "检测到重复发票",
            icon: "none",
            invoiceId: result.data && result.data._id,
            delay: 900,
          });
          return;
        }
        if (!result || result.success === false || !(result.data && result.data._id)) {
          throw new Error((result && result.errMsg) || "save invoice failed");
        }
        this.finishSubmit({
          message: "已保存到票夹",
          icon: "success",
          invoiceId: result.data._id,
        });
      })
      .catch((error) => {
        const errorMessage = String(error && (error.errMsg || error.message || error));
        const localDraft = this.saveLocalDraftInvoice(form);
        this.finishSubmit({
          message: errorMessage.includes("timeout")
            ? "云端超时，已暂存本地"
            : "云端不可用，已暂存本地",
          icon: "none",
          delay: 900,
          invoiceId: localDraft._id,
        });
      });
  },
});
