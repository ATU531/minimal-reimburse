const LOCAL_INVOICES_STORAGE_KEY = "localDraftInvoices";

Page({
  data: {
    currentSource: null,
    isChatMode: false,
    isOcrMode: false,
    selectedFile: null,
    ocrImage: null,
    ocrResult: null,
    ocrProvider: "",
    ocrLoading: false,
    submitting: false,
    invoiceTypeOptions: [
      { label: "电子普票", value: "vat_common_electronic" },
      { label: "电子专票", value: "vat_special_electronic" },
      { label: "纸质普票", value: "vat_common_paper" },
    ],
    form: {
      title: "",
      amount: "",
      issueDate: "",
      buyerName: "",
      sellerName: "",
      invoiceCode: "",
      invoiceNumber: "",
      category: "",
      remark: "",
      invoiceType: "vat_common_electronic",
    },
    errors: {
      title: "",
      amount: "",
      issueDate: "",
    },
    invoiceTypeIndex: 0,
    sources: {
      chat: {
        title: "聊天记录导入",
        subtitle: "从聊天图片、PDF或转发内容中整理发票",
        guide: "适合报销人先把零散票据（截图/文件）转发到工作群，再批量筛出待识别内容。",
        actionLabel: "选择聊天文件",
      },
      card: {
        title: "微信卡包同步",
        subtitle: "导入卡包中的电子发票并补齐票据字段",
        guide: "适合同步已开具完成的电子票，减少二次上传动作。（需企业主体认证）",
        actionLabel: "同步卡包",
        action: "syncCard",
      },
      local: {
        title: "本地文件导入",
        subtitle: "批量导入 PDF、图片或压缩包中的票据文件",
        guide: "适合财务按月整理归档文件，再做统一识别与校验。",
        actionLabel: "选择本地文件",
      },
      scan: {
        title: "扫码录入",
        subtitle: "扫描二维码或条码后创建发票草稿",
        guide: "适合纸票、线下票据或临时场景的快速录入。",
        actionLabel: "开始扫码",
      },
      album: {
        title: "手机相册导入",
        subtitle: "从相册中选择票据照片并进入识别流程",
        guide: "适合差旅结束后一次性补录手机里保存的发票图片。",
        actionLabel: "选择相册照片",
      },
      ocr: {
        title: "智能识别",
        subtitle: "拍照或从相册导入后自动提取金额、抬头、税号",
        guide: "适合希望先拿到结构化结果，再补充校验和报销归类的场景。",
        actionLabel: "拍照识别",
      },
      manual: {
        title: "手动录入",
        subtitle: "手工填写发票核心字段并保存为票夹记录",
        guide: "适合识别失败、特殊票据或仅做示意录入的情况。",
        actionLabel: "填写发票",
        actionPage: "/pages/manual-entry/index",
      },
      more: {
        title: "更多录入方式",
        subtitle: "预留邮件转发、批量采集、企业代收等扩展入口",
        guide: "适合后续功能扩展，当前先确定信息架构和操作布局。",
        actionLabel: "敬请期待",
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
    const isChatMode = source === "chat";
    const isOcrMode = source === "ocr";
    this.setData({
      currentSource,
      isChatMode,
      isOcrMode,
    });
  },
  getInvoiceTypeLabel(invoiceType) {
    const matchedOption = this.data.invoiceTypeOptions.find(
      (item) => item.value === invoiceType
    );
    return matchedOption ? matchedOption.label : "电子普票";
  },
  handleTap(e) {
    const { page, label, action } = e.currentTarget.dataset;
    if (action === "syncCard") {
      this.chooseInvoiceFromCard();
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
  chooseInvoiceFromCard() {
    wx.showModal({
      title: "功能暂未开放",
      content: "微信卡包发票同步功能需要企业主体认证，个人小程序暂不支持。后续开通权限后可使用。",
      showCancel: false,
      confirmText: "我知道了",
    });
  },
  /*
  chooseInvoiceFromCard() {
    wx.showLoading({
      title: "正在打开卡包...",
      mask: true,
    });
    wx
      .chooseInvoice({
        success: (res) => {
          wx.hideLoading();
          console.log("[Card Invoice] Selected:", res.invoiceInfo);
          let invoiceInfo;
          try {
            invoiceInfo = typeof res.invoiceInfo === "string"
              ? JSON.parse(res.invoiceInfo)
              : res.invoiceInfo;
          } catch (e) {
            console.error("[Card Invoice] Parse error:", e);
            wx.showToast({
              title: "发票信息解析失败",
              icon: "none",
            });
            return;
          }
          if (Array.isArray(invoiceInfo)) {
            invoiceInfo = invoiceInfo[0] || null;
          }
          if (!invoiceInfo || typeof invoiceInfo !== "object") {
            wx.showToast({
              title: "发票信息格式异常",
              icon: "none",
            });
            return;
          }
          console.log(
            "[Card Invoice] parsed type:",
            typeof invoiceInfo,
            "keys:",
            Object.keys(invoiceInfo)
          );
          const cardId = invoiceInfo.card_id || "";
          const encryptCode = invoiceInfo.encrypt_code || "";
          const appId = invoiceInfo.app_id || "";
          console.log(
            "[Card Invoice] cardId:",
            cardId,
            "encryptCode:",
            encryptCode
          );
          if (!cardId || !encryptCode) {
            console.error(
              "[Card Invoice] Missing fields:",
              JSON.stringify(invoiceInfo)
            );
            wx.showToast({
              title: "发票信息不完整",
              icon: "none",
            });
            return;
          }
          this.queryInvoiceDetail({ cardId, encryptCode, appId });
        },
        fail: (err) => {
          wx.hideLoading();
          console.error("[Card Invoice] Failed:", err);
          if (
            err.errMsg &&
            (err.errMsg.includes("cancel") || err.errMsg.includes("auth deny"))
          ) {
            return;
          }
          if (err.errMsg && err.errMsg.includes("scope unauthorized")) {
            wx.showModal({
              title: "需要授权",
              content: "请允许访问您的微信卡包发票，以便同步电子发票",
              confirmText: "去设置",
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting({});
                }
              },
            });
            return;
          }
          wx.showToast({
            title: err.errMsg || "打开卡包失败",
            icon: "none",
            duration: 3000,
          });
        },
      });
  },
  queryInvoiceDetail(invoiceInfo) {
    wx.showLoading({
      title: "正在获取发票详情...",
      mask: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "getInvoiceInfo",
          cardId: invoiceInfo.cardId,
          encryptCode: invoiceInfo.encryptCode,
          appId: invoiceInfo.appId,
        },
      })
      .then((res) => {
        wx.hideLoading();
        console.log(
          "[Card Invoice] Detail response:",
          JSON.stringify(res.result)
        );
        const result = res.result;
        if (!result || result.success === false) {
          const errorMsg =
            (result && result.errMsg) || "获取发票详情失败";
          wx.showToast({
            title: errorMsg.length > 20
              ? errorMsg.substring(0, 20) + "..."
              : errorMsg,
            icon: "none",
            duration: 3000,
          });
          return;
        }
        const invoiceData = result.data || {};
        console.log("[Card Invoice] Parsed data:", JSON.stringify(invoiceData));
        this.setData({
          selectedFile: {
            name: invoiceData.title || "卡包电子发票",
            size: 0,
            path: "",
            type: "card",
            fileType: "card",
            time: new Date().toLocaleString("zh-CN"),
            cardId: invoiceInfo.card_id,
          },
        });
        if (!this.data.form.title && invoiceData.title) {
          this.setData({ "form.title": invoiceData.title });
        }
        const displayOcrData = this.addDisplayFields(invoiceData);
        this.setData({
          ocrResult: displayOcrData,
          ocrProvider: "wechat_card",
        });
        this.fillFormWithOcrResult(invoiceData);
        wx.showToast({
          title: "同步成功",
          icon: "success",
        });
      })
      .catch((error) => {
        wx.hideLoading();
        console.error("[Card Invoice] Query failed:", error);
        let displayMsg = "获取发票详情失败";
        if (error && error.errMsg) {
          if (error.errMsg.includes("timeout")) {
            displayMsg = "请求超时，请重试";
          } else if (error.errMsg.includes("-1")) {
            displayMsg = "网络异常，请检查网络";
          } else {
            displayMsg = error.errMsg.length > 15
              ? error.errMsg.substring(0, 15) + "..."
              : error.errMsg;
          }
        }
        wx.showToast({
          title: displayMsg,
          icon: "none",
          duration: 3000,
        });
      });
  },
  */
  chooseMessageFile() {
    wx.chooseMessageFile({
      count: 1,
      type: "all",
      success: (res) => {
        const file = res.tempFiles[0];
        if (!file) {
          wx.showToast({
            title: "未选择文件",
            icon: "none",
          });
          return;
        }
        const fileName = file.name || "";
        const fileExt = fileName.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "bmp"].includes(fileExt);
        const isPdf = fileExt === "pdf";
        this.setData({
          selectedFile: {
            name: fileName,
            size: Math.round(file.size / 1024),
            path: file.path,
            type: file.type,
            fileType: isImage ? "image" : isPdf ? "pdf" : "unknown",
            time: new Date().toLocaleString("zh-CN"),
          },
        });
        if (!this.data.form.title) {
          const nameWithoutExt = fileName.replace(
            /\.(pdf|jpg|jpeg|png|bmp)$/i,
            ""
          );
          if (nameWithoutExt.trim()) {
            this.setData({
              "form.title": nameWithoutExt,
            });
          }
        }
        if (isImage || isPdf) {
          this.processChatFileOcr(file, isImage);
        } else {
          wx.showToast({
            title: "暂不支持该文件格式",
            icon: "none",
          });
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes("cancel")) {
          return;
        }
        wx.showToast({
          title: "选择文件失败",
          icon: "none",
        });
      },
    });
  },
  extractFileNameAsTitle(fileName) {
    if (!fileName) {
      return;
    }
    const nameWithoutExt = fileName.replace(/\.pdf$/i, "").trim();
    if (nameWithoutExt && !this.data.form.title) {
      this.setData({
        "form.title": nameWithoutExt,
      });
    }
  },
  processChatFileOcr(file, isImage) {
    this.setData({
      ocrLoading: true,
      ocrResult: null,
      ocrImage: isImage ? file.path : null,
    });
    wx.showLoading({
      title: "正在识别发票...",
      mask: true,
    });
    const cloudPath = `ocr-invoices/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${isImage ? ".jpg" : ".pdf"}`;
    wx.cloud
      .uploadFile({
        cloudPath: cloudPath,
        filePath: file.path,
      })
      .then((res) => {
        console.log("[Chat OCR] File uploaded, fileID:", res.fileID);
        return wx.cloud.callFunction({
          name: "quickstartFunctions",
          data: {
            type: "ocrInvoice",
            data: {
              fileID: res.fileID,
            },
          },
          timeout: 25000,
        });
      })
      .then((response) => {
        wx.hideLoading();
        this.setData({
          ocrLoading: false,
        });
        const result = response && response.result;
        console.log("[Chat OCR] Response:", JSON.stringify(result));
        if (!result || result.success === false) {
          const errorMsg = (result && result.errMsg) || "OCR识别失败";
          const errCode = result && result.errCode;
          console.error("[Chat OCR] Failed - Code:", errCode, "Msg:", errorMsg);
          if (errCode) {
            throw new Error(`[${errCode}] ${errorMsg}`);
          } else {
            throw new Error(errorMsg);
          }
        }
        const ocrData = result.data || {};
        const ocrProvider = result.provider || "unknown";
        console.log("[Chat OCR] Data:", JSON.stringify(ocrData));
        const displayOcrData = this.addDisplayFields(ocrData);
        this.setData({
          ocrResult: displayOcrData,
          ocrProvider: ocrProvider,
        });
        this.fillFormWithOcrResult(ocrData);
        let toastTitle = "识别成功";
        if (ocrProvider === "mock") {
          toastTitle = "模拟模式（开发测试）";
          wx.showModal({
            title: "提示",
            content:
              "当前使用模拟数据模式，显示的是预设的测试数据。如需真实OCR识别，请配置腾讯云或百度云OCR服务。",
            showCancel: false,
            confirmText: "我知道了",
          });
        } else {
          wx.showToast({
            title: toastTitle,
            icon: "success",
          });
        }
      })
      .catch((error) => {
        wx.hideLoading();
        this.setData({
          ocrLoading: false,
        });
        console.error("=== Chat OCR Error Details ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        
        let displayMsg = "识别失败，请手动填写";
        if (
          error &&
          error.message &&
          error.message.includes("-6041006")
        ) {
          displayMsg = "OCR服务未配置，请重新部署云函数";
        } else if (error && error.message) {
          displayMsg = error.message.length > 20
            ? error.message.substring(0, 20) + "..."
            : error.message;
        }
        wx.showToast({
          title: displayMsg,
          icon: "none",
          duration: 3000,
        });
      });
  },
  removeSelectedFile() {
    this.setData({
      selectedFile: null,
      ocrImage: null,
      ocrResult: null,
      ocrLoading: false,
    });
  },
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["camera"],
      camera: "back",
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.processOcrImage(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes("cancel")) {
          return;
        }
        wx.showToast({
          title: "拍照失败",
          icon: "none",
        });
      },
    });
  },
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album"],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.processOcrImage(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes("cancel")) {
          return;
        }
        wx.showToast({
          title: "选择图片失败",
          icon: "none",
        });
      },
    });
  },
  processOcrImage(imagePath) {
    this.setData({
      ocrImage: imagePath,
      ocrResult: null,
      ocrLoading: true,
    });
    wx.showLoading({
      title: "正在识别发票...",
      mask: true,
    });
    wx.cloud
      .uploadFile({
        cloudPath: `ocr-invoices/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`,
        filePath: imagePath,
      })
      .then((res) => {
        console.log("[OCR] Image uploaded, fileID:", res.fileID);
        return wx.cloud.callFunction({
          name: "quickstartFunctions",
          data: {
            type: "ocrInvoice",
            data: {
              fileID: res.fileID,
            },
          },
          timeout: 25000,
        });
      })
      .then((response) => {
        wx.hideLoading();
        this.setData({
          ocrLoading: false,
        });
        const result = response && response.result;
        console.log("OCR Response:", JSON.stringify(result));
        if (!result || result.success === false) {
          const errorMsg = (result && result.errMsg) || "OCR识别失败";
          const errCode = result && result.errCode;
          console.error("OCR Failed - Code:", errCode, "Msg:", errorMsg);
          if (errCode) {
            throw new Error(`[${errCode}] ${errorMsg}`);
          } else {
            throw new Error(errorMsg);
          }
        }
        const ocrData = result.data || {};
        const ocrProvider = result.provider || "unknown";
        console.log("OCR Data:", JSON.stringify(ocrData));
        console.log("OCR Provider:", ocrProvider);
        const displayOcrData = this.addDisplayFields(ocrData);
        this.setData({
          ocrResult: displayOcrData,
          ocrProvider: ocrProvider,
        });
        this.fillFormWithOcrResult(ocrData);
        let toastTitle = "识别成功";
        if (ocrProvider === "mock") {
          toastTitle = "模拟模式（开发测试）";
          wx.showModal({
            title: "提示",
            content:
              "当前使用模拟数据模式，显示的是预设的测试数据。如需真实OCR识别，请配置腾讯云或百度云OCR服务。",
            showCancel: false,
            confirmText: "我知道了",
          });
        } else {
          wx.showToast({
            title: toastTitle,
            icon: "success",
          });
        }
      })
      .catch((error) => {
        wx.hideLoading();
        this.setData({
          ocrLoading: false,
        });
        console.error("=== OCR Error Details ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        let displayMsg = "识别失败，请手动填写";
        if (
          error &&
          error.message &&
          error.message.includes("-6041006")
        ) {
          displayMsg = "OCR服务未配置，请重新部署云函数";
        } else if (error && error.message) {
          displayMsg = error.message.length > 20
            ? error.message.substring(0, 20) + "..."
            : error.message;
        }
        wx.showToast({
          title: displayMsg,
          icon: "none",
          duration: 3000,
        });
      });
  },
  addDisplayFields(ocrData) {
    if (!ocrData) return ocrData;
    const result = { ...ocrData };
    if (result.amount || result.totalAmountWithTax) {
      let rawAmount = result.amount;
      if (!rawAmount && result.totalAmountWithTax) {
        rawAmount = Number(result.totalAmountWithTax) * 100;
      }
      result.displayAmount = Number(rawAmount || 0) / 100;
    } else if (result.totalAmount) {
      result.displayAmount = Number(result.totalAmount);
    }
    console.log("[Display] amount:", result.amount, "totalAmount:", result.totalAmount, "totalAmountWithTax:", result.totalAmountWithTax, "-> displayAmount:", result.displayAmount);
    return result;
  },
  fillFormWithOcrResult(ocrData) {
    if (!ocrData) {
      return;
    }
    console.log("[OCR Fill] Full ocrData:", JSON.stringify(ocrData));
    console.log(
      "[OCR Fill] amount:",
      ocrData.amount,
      "totalAmount:",
      ocrData.totalAmount
    );
    const formUpdates = {};
    if (ocrData.title && !this.data.form.title) {
      formUpdates.title = ocrData.title;
    }
    if (ocrData.totalAmountWithTax || ocrData.amount) {
      let rawAmount = ocrData.amount;
      if (ocrData.totalAmountWithTax && !rawAmount) {
        rawAmount = Number(ocrData.totalAmountWithTax) * 100;
      }
      const amount = Number(rawAmount || 0) / 100;
      console.log("[OCR Fill] Calculated amount:", amount);
      if (amount > 0 && !this.data.form.amount) {
        formUpdates.amount = String(amount);
        console.log("[OCR Fill] Setting amount to:", String(amount));
      } else {
        console.log(
          "[OCR Fill] Skipped - amount:",
          amount,
          "form.amount:",
          this.data.form.amount
        );
      }
    } else {
      console.log(
        "[OCR Fill] No amount in OCR data - totalAmount:",
        ocrData.totalAmount,
        "amount:",
        ocrData.amount
      );
    }
    if (ocrData.issueDate && !this.data.form.issueDate) {
      formUpdates.issueDate = ocrData.issueDate;
    }
    if (ocrData.buyerName && !this.data.form.buyerName) {
      formUpdates.buyerName = ocrData.buyerName;
    }
    if (ocrData.sellerName && !this.data.form.sellerName) {
      formUpdates.sellerName = ocrData.sellerName;
    }
    if (ocrData.invoiceCode && !this.data.form.invoiceCode) {
      formUpdates.invoiceCode = ocrData.invoiceCode;
    }
    if (ocrData.invoiceNumber && !this.data.form.invoiceNumber) {
      formUpdates.invoiceNumber = ocrData.invoiceNumber;
    }
    if (Object.keys(formUpdates).length > 0) {
      this.setData({
        form: Object.assign({}, this.data.form, formUpdates),
      });
    }
    if (ocrData.invoiceType) {
      const invoiceTypeIndex = this.data.invoiceTypeOptions.findIndex(
        (item) => item.value === ocrData.invoiceType
      );
      if (invoiceTypeIndex >= 0) {
        this.setData({
          invoiceTypeIndex,
          form: Object.assign({}, this.data.form, {
            invoiceType: ocrData.invoiceType,
          }),
        });
      }
    }
  },
  removeOcrImage() {
    this.setData({
      ocrImage: null,
      ocrResult: null,
    });
  },
  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const nextForm = Object.assign({}, this.data.form, {
      [field]: e.detail.value,
    });
    const nextErrors = Object.assign({}, this.data.errors, {
      [field]: "",
    });
    this.setData({
      form: nextForm,
      errors: nextErrors,
    });
  },
  handleDateChange(e) {
    this.setData({
      form: Object.assign({}, this.data.form, {
        issueDate: e.detail.value,
      }),
      errors: Object.assign({}, this.data.errors, {
        issueDate: "",
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
  validateForm() {
    const { title, amount, issueDate } = this.data.form;
    const errors = {
      title: "",
      amount: "",
      issueDate: "",
    };
    if (!title.trim()) {
      errors.title = "请填写发票标题";
    }
    if (!amount || Number(amount) <= 0) {
      errors.amount = "请填写正确金额";
    }
    if (!issueDate) {
      errors.issueDate = "请选择开票日期";
    }
    return errors;
  },
  saveLocalDraftInvoice(form, sourceInfo) {
    const timestamp = Date.now();
    const sourceType = sourceInfo.sourceType || "ocr";
    const draftInvoice = {
      _id: `local-draft-${timestamp}`,
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
      sourceType: sourceType,
      sourceLabel:
        sourceType === "chat"
          ? "聊天记录"
          : sourceType === "ocr"
          ? "智能识别"
          : "手动录入",
      category: form.category.trim(),
      remark: form.remark.trim(),
      verifyStatus: sourceType === "ocr" ? "verified" : "unverified",
      reimburseStatus: "unreimbursed",
      printStatus: "unprinted",
      exportStatus: "none",
      tags:
        sourceType === "ocr"
          ? ["已核验", "可导出", "未报销", "未打印"]
          : ["待核验", "可导出", "未报销", "未打印"],
      timeline: [
        {
          title:
            sourceType === "ocr"
              ? "智能OCR识别"
              : sourceType === "chat"
              ? "从聊天记录导入"
              : "保存到本地",
          meta: sourceInfo.meta || "云端超时，已暂存到本地",
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
  findDuplicateLocalDraft(form) {
    const invoiceCode = String(form.invoiceCode || "").trim();
    const invoiceNumber = String(form.invoiceNumber || "").trim();
    const totalAmount = Math.round(Number(form.amount) * 100);
    const existingDrafts = wx.getStorageSync(LOCAL_INVOICES_STORAGE_KEY) || [];
    return existingDrafts.find((item) => {
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
  handleSubmit() {
    if (this.data.submitting) {
      return;
    }
    if (this.data.isChatMode && !this.data.selectedFile) {
      wx.showToast({
        title: "请先选择聊天文件",
        icon: "none",
      });
      return;
    }
    if (this.data.isOcrMode && !this.data.ocrImage) {
      wx.showToast({
        title: "请先拍照或选择图片",
        icon: "none",
      });
      return;
    }
    const errors = this.validateForm();
    const validationMessage =
      errors.title || errors.amount || errors.issueDate || "";
    if (validationMessage) {
      this.setData({
        errors,
      });
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
    let requestPayload;
    let sourceInfo;
    if (this.data.isChatMode) {
      const selectedFile = this.data.selectedFile;
      const ocrResult = this.data.ocrResult || {};
      const hasOcrResult =
        Object.keys(ocrResult).length > 0 && ocrResult.title;
      requestPayload = {
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
        sourceType: "chat",
        sourceMeta: {
          channel: "wechat_chat",
          fileType: selectedFile.fileType || "unknown",
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          ocrConfidence: hasOcrResult
            ? ocrResult.confidence || 0
            : undefined,
        },
        ocrStatus: hasOcrResult ? "success" : "skipped",
        verifyStatus: hasOcrResult ? "verified" : "unverified",
      };
      sourceInfo = {
        sourceType: "chat",
        meta: hasOcrResult
          ? `${selectedFile.name} · OCR识别完成`
          : `${selectedFile.name} · ${selectedFile.time}`,
      };
    } else if (this.data.isOcrMode) {
      const ocrResult = this.data.ocrResult || {};
      requestPayload = {
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
        sourceType: "ocr",
        sourceMeta: {
          channel: "ocr_recognition",
          ocrConfidence: ocrResult.confidence || 0,
          recognizedFields: ocrResult.fields || {},
        },
        ocrStatus: "success",
        verifyStatus: "verified",
      };
      sourceInfo = {
        sourceType: "ocr",
        meta: this.data.ocrResult
          ? `置信度 ${Math.round(this.data.ocrResult.confidence || 0)}%`
          : "OCR识别完成",
      };
    } else {
      requestPayload = {
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
        sourceType: "manual",
        ocrStatus: "skipped",
      };
      sourceInfo = {
        sourceType: "manual",
        meta: "手动录入",
      };
    }
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
        if (
          result &&
          result.success === false &&
          result.errCode === "DUPLICATE_INVOICE"
        ) {
          this.finishSubmit({
            message: "检测到重复发票",
            icon: "none",
            invoiceId: result.data && result.data._id,
            delay: 900,
          });
          return;
        }
        if (
          !result ||
          result.success === false ||
          !(result.data && result.data._id)
        ) {
          throw new Error((result && result.errMsg) || "save invoice failed");
        }
        this.finishSubmit({
          message: "已保存到票夹",
          icon: "success",
          invoiceId: result.data && result.data._id,
        });
      })
      .catch((error) => {
        const errorMessage = String(
          error && (error.errMsg || error.message || error)
        );
        const localDraft = this.saveLocalDraftInvoice(form, sourceInfo);
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
