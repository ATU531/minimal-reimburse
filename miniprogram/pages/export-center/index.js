const LOCAL_EXPORT_JOBS_STORAGE_KEY = "localExportJobs";

Page({
  data: {
    loading: false,
    creating: false,
    selectedFormat: "pdf",
    scopeType: "filtered_result",
    scopeId: "",
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
    formatOptions: [
      { label: "PDF", value: "pdf" },
      { label: "Excel", value: "excel" },
    ],
    exportTasks: [],
    fallbackTasks: [
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
    const scopeType = options.scope || "filtered_result";
    const scopeId = options.scopeId || "";
    const currentView = this.data.viewMap[type] || this.data.viewMap.pdf;
    this.setData({
      currentView,
      selectedFormat: type === "excel" ? "excel" : "pdf",
      scopeType,
      scopeId,
    });
    this.fetchExportJobs();
  },
  onShow() {
    this.fetchExportJobs();
  },
  getLocalJobs() {
    return wx.getStorageSync(LOCAL_EXPORT_JOBS_STORAGE_KEY) || [];
  },
  setLocalJobs(jobs) {
    wx.setStorageSync(LOCAL_EXPORT_JOBS_STORAGE_KEY, jobs);
  },
  progressLocalJobs(jobs) {
    const now = Date.now();
    return jobs.map((job) => {
      const elapsed = now - Number(job.createdAt || 0);
      if (elapsed >= 3200) {
        return Object.assign({}, job, {
          status: "已完成",
          desc: `${job.fileName}（本地模拟）`,
        });
      }
      if (elapsed >= 1200) {
        return Object.assign({}, job, {
          status: "处理中",
        });
      }
      return job;
    });
  },
  buildTaskList(items) {
    return items.map((item) => ({
      title: item.title,
      status: item.status,
      desc: item.desc,
      createdAt: item.createdAt,
    }));
  },
  appendLocalJob() {
    const now = Date.now();
    const formatLabel = this.data.selectedFormat === "excel" ? "Excel" : "PDF";
    const localJob = {
      id: `local-export-${now}`,
      title: `${formatLabel} · 本地导出任务`,
      status: "排队中",
      desc: "云函数未返回任务结果，已使用本地模拟任务",
      fileName: `export-${now}.${this.data.selectedFormat === "excel" ? "xlsx" : "pdf"}`,
      createdAt: now,
      scopeType: this.data.scopeType,
      scopeId: this.data.scopeId,
      format: this.data.selectedFormat,
    };
    const nextJobs = [localJob, ...this.getLocalJobs()];
    this.setLocalJobs(nextJobs);
    return localJob;
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
        const cloudTasks = result.data.map((item) => ({
          title: `${item.formatLabel} · ${item.jobTitle}`,
          status: item.statusLabel,
          desc: item.fileName || (item.scopeId ? `范围：${item.scopeId}` : "范围：当前筛选结果"),
          createdAt: item.createdAt,
        }));
        const localJobs = this.progressLocalJobs(this.getLocalJobs()).filter((item) => {
          if (this.data.scopeType && item.scopeType !== this.data.scopeType) {
            return false;
          }
          if (this.data.scopeId && item.scopeId !== this.data.scopeId) {
            return false;
          }
          return true;
        });
        this.setLocalJobs(this.progressLocalJobs(this.getLocalJobs()));
        this.setData({
          loading: false,
          exportTasks: [...this.buildTaskList(localJobs), ...cloudTasks],
        });
      })
      .catch(() => {
        const localJobs = this.progressLocalJobs(this.getLocalJobs()).filter((item) => {
          if (this.data.scopeType && item.scopeType !== this.data.scopeType) {
            return false;
          }
          if (this.data.scopeId && item.scopeId !== this.data.scopeId) {
            return false;
          }
          return true;
        });
        this.setLocalJobs(this.progressLocalJobs(this.getLocalJobs()));
        this.setData({
          loading: false,
          exportTasks: localJobs.length
            ? this.buildTaskList(localJobs)
            : this.data.fallbackTasks,
        });
        wx.showToast({
          title: "云函数未返回结果，已展示本地任务",
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
  createExportJob() {
    if (this.data.creating) {
      return;
    }
    this.setData({
      creating: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "createExportJob",
          data: {
            format: this.data.selectedFormat,
            scopeType: this.data.scopeType,
            scopeId: this.data.scopeId,
          },
        },
      })
      .then((response) => {
        const result = response.result;
        if (!result || result.success !== true || !(result.data && result.data._id)) {
          throw new Error("create export job result is empty");
        }
        this.setData({
          creating: false,
        });
        wx.showToast({
          title: "已创建导出任务",
          icon: "success",
        });
        this.fetchExportJobs();
      })
      .catch(() => {
        this.appendLocalJob();
        this.setData({
          creating: false,
        });
        wx.showToast({
          title: "云端不可用，已创建本地任务",
          icon: "none",
        });
        this.fetchExportJobs();
      });
  },
  handleTap(e) {
    const label = e.currentTarget.dataset.label;
    if (label === "生成导出文件") {
      this.createExportJob();
      return;
    }
    this.fetchExportJobs();
  },
});
