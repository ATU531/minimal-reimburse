Page({
  data: {
    loading: false,
    creating: false,
    selectedFormat: "pdf",
    scopeType: "filtered_result",
    scopeId: "",
    currentView: {
      title: "发票原票 PDF 导出清单",
      subtitle: "正在合并原票附件，生成可转发 PDF 文件",
    },
    viewMap: {
      pdf: {
        title: "发票原票 PDF 导出清单",
        subtitle: "导出记录将展示在导出中心",
      },
    },
    formatOptions: [{ label: "PDF", value: "pdf" }],
    exportTasks: [],
    presets: [
      "按月份命名文件",
      "图片发票每页排放两张",
      "原始 PDF 发票保留原页内容",
    ],
  },
  onLoad(options) {
    const type = options.type || "pdf";
    const scopeType = options.scope || "filtered_result";
    const scopeId = options.scopeId || "";
    const currentView = this.data.viewMap[type] || this.data.viewMap.pdf;
    this.setData({
      currentView,
      selectedFormat: "pdf",
      scopeType,
      scopeId,
    });
    this.fetchExportJobs();
  },
  onShow() {
    this.fetchExportJobs();
  },
  buildTaskList(items) {
    return items.map((item) => ({
      title: `${item.formatLabel || "PDF"} · ${item.jobTitle || item.fileName || "原票导出"}`,
      status: item.statusLabel || item.status || "已生成",
      desc: item.fileName || (item.scopeId ? `范围：${item.scopeId}` : "范围：当前发票"),
      createdAt: item.createdAt,
    }));
  },
  fetchExportJobs() {
    this.setData({
      loading: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listExportJobs",
          scopeType: this.data.scopeType,
          scopeId: this.data.scopeId,
        },
      })
      .then((response) => {
        const result = response.result;
        if (!result || result.success !== true || !Array.isArray(result.data)) {
          throw new Error("cloud function returned empty result");
        }
        const pdfTasks = result.data.filter(
          (item) => (item.format || "pdf") === "pdf"
        );
        this.setData({
          loading: false,
          exportTasks: this.buildTaskList(pdfTasks),
        });
      })
      .catch(() => {
        this.setData({
          loading: false,
          exportTasks: [],
        });
        wx.showToast({
          title: "导出记录加载失败",
          icon: "none",
        });
      });
  },
  selectFormat(e) {
    const selectedFormat = e.currentTarget.dataset.value;
    this.setData({
      selectedFormat,
    });
  },
  formatExportError(result) {
    if (
      result &&
      result.errCode === "EXPORT_UNSUPPORTED_ATTACHMENT" &&
      result.data &&
      result.data.unsupportedInvoices
    ) {
      const names = result.data.unsupportedInvoices
        .map((item) => item.title)
        .filter(Boolean)
        .slice(0, 5)
        .join("、");
      return names
        ? `以下发票缺少原始图片或PDF：${names}`
        : result.errMsg || "所选发票缺少可导出的原始图片或PDF";
    }
    return (result && result.errMsg) || "生成PDF失败";
  },
  openGeneratedPdf(exportData) {
    const { tempFileURL, fileName } = exportData;
    wx.downloadFile({
      url: tempFileURL,
      filePath: `${wx.env.USER_DATA_PATH}/${fileName}`,
      success: (downloadRes) => {
        if (downloadRes.statusCode !== 200) {
          wx.showToast({ title: "下载PDF失败", icon: "none" });
          return;
        }
        wx.showActionSheet({
          itemList: ["打开PDF", "转发到聊天"],
          success: (actionRes) => {
            if (actionRes.tapIndex === 0) {
              wx.openDocument({
                filePath: downloadRes.filePath,
                showMenu: true,
                fileType: "pdf",
                fail: () => {
                  wx.showToast({ title: "打开PDF失败", icon: "none" });
                },
              });
              return;
            }
            wx.shareFileMessage({
              filePath: downloadRes.filePath,
              fileName,
              fail: () => {
                wx.showToast({ title: "转发失败", icon: "none" });
              },
            });
          },
        });
      },
      fail: () => {
        wx.showToast({ title: "下载PDF失败", icon: "none" });
      },
    });
  },
  createExportFile() {
    if (this.data.creating) {
      return;
    }
    if (this.data.scopeType !== "invoice" || !this.data.scopeId) {
      wx.showModal({
        title: "请选择发票",
        content: "请先在票夹中勾选发票后导出 PDF。",
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: "/pages/folder/index",
          });
        },
      });
      return;
    }
    this.setData({
      creating: true,
    });
    wx.showLoading({ title: "正在生成PDF...", mask: true });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "generateExportPdf",
          invoiceIds: [this.data.scopeId],
        },
        timeout: 30000,
      })
      .then((response) => {
        wx.hideLoading();
        const result = response.result;
        if (!result || !result.success || !result.data) {
          throw new Error(this.formatExportError(result));
        }
        this.setData({
          creating: false,
        });
        this.openGeneratedPdf(result.data);
        this.fetchExportJobs();
      })
      .catch((err) => {
        wx.hideLoading();
        this.setData({
          creating: false,
        });
        wx.showModal({
          title: "导出失败",
          content: err.message || "导出失败",
          showCancel: false,
        });
      });
  },
  handleTap(e) {
    const label = e.currentTarget.dataset.label;
    if (label === "生成 PDF") {
      this.createExportFile();
      return;
    }
    this.fetchExportJobs();
  },
});
