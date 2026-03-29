Page({
  data: {
    reimbursementId: "",
    loading: false,
    editMode: false,
    currentView: {
      title: "报销单详情",
      subtitle: "查看发票归集、审批状态与导出动作",
      status: "待提交",
      amount: "¥5,640.00",
    },
    viewMap: {
      create: {
        title: "新建报销单",
        subtitle: "先选择发票，再补齐报销人与费用归属信息",
        status: "新建中",
        amount: "¥0.00",
      },
      draft: {
        title: "草稿箱",
        subtitle: "继续补全未提交的报销单并检查缺失字段",
        status: "草稿",
        amount: "¥2,860.00",
      },
      history: {
        title: "报销记录",
        subtitle: "按时间查看历史报销单、导出结果与审批状态",
        status: "历史",
        amount: "¥18,760.00",
      },
    },
    sections: [
      { label: "报销人", value: "王芳" },
      { label: "报销部门", value: "市场与运营中心" },
      { label: "关联项目", value: "Q2 差旅与客户接待" },
      { label: "发票数量", value: "12 张" },
      { label: "导出模板", value: "标准报销单 + 明细 Excel" },
    ],
    invoices: [
      { title: "餐饮服务 · 午餐接待", amount: "¥268.00", status: "未报销" },
      { title: "酒店住宿 · 差旅报销", amount: "¥1,860.00", status: "可打印" },
      { title: "信息服务 · 软件订阅", amount: "¥3,980.00", status: "待核验" },
    ],
    timeline: [
      { title: "创建报销单", meta: "今天 09:40 · 静态页面示意" },
      { title: "加入 12 张发票", meta: "今天 10:10 · 来自票夹批量选择" },
      { title: "等待提交审批", meta: "当前状态" },
    ],
    editForm: {
      title: "",
      applicant: "",
      department: "",
      projectName: "",
      expenseCategory: "",
      remark: "",
    },
  },
  formatAmount(amountInCents) {
    return `¥${(Number(amountInCents || 0) / 100).toFixed(2)}`;
  },
  onLoad(options) {
    if (options.id) {
      this.setData({
        reimbursementId: options.id,
      });
      this.fetchReimbursementDetail(options.id);
      return;
    }
    const mode = options.mode;
    const currentView = this.data.viewMap[mode] || this.data.currentView;
    this.setData({
      currentView,
    });
  },
  fetchReimbursementDetail(reimbursementId) {
    this.setData({
      loading: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "getReimbursementDetail",
          id: reimbursementId,
        },
      })
      .then((response) => {
        const detail = response.result && response.result.data;
        if (!detail) {
          throw new Error("reimbursement detail is empty");
        }
        this.setData({
          loading: false,
          currentView: {
            title: detail.title,
            subtitle: detail.subtitle,
            status: detail.statusLabel,
            amount: this.formatAmount(detail.totalAmount),
          },
          sections: [
            { label: "报销单号", value: detail.reimbursementNo },
            { label: "报销人", value: detail.applicant },
            { label: "报销部门", value: detail.department },
            { label: "关联项目", value: detail.projectName },
            { label: "发票数量", value: `${detail.invoiceCount} 张` },
          ],
          invoices: (detail.invoices || []).map((item) => ({
            title: item.title,
            amount: this.formatAmount(item.amount),
            status: "报销中",
          })),
          timeline: detail.timeline || this.data.timeline,
          editForm: {
            title: detail.title || "",
            applicant: detail.applicant || "",
            department: detail.department || "",
            projectName: detail.projectName || "",
            expenseCategory: detail.expenseCategory || "",
            remark: detail.remark || "",
          },
        });
      })
      .catch(() => {
        this.setData({
          loading: false,
        });
      });
  },
  handleEditInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      editForm: Object.assign({}, this.data.editForm, {
        [field]: e.detail.value,
      }),
    });
  },
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode,
    });
  },
  saveReimbursement() {
    if (!this.data.reimbursementId) {
      return;
    }
    wx.showLoading({
      title: "保存中",
      mask: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "updateReimbursement",
          id: this.data.reimbursementId,
          data: this.data.editForm,
        },
      })
      .then(() => {
        wx.hideLoading();
        this.setData({
          editMode: false,
        });
        wx.showToast({
          title: "已保存报销单",
          icon: "success",
        });
        this.fetchReimbursementDetail(this.data.reimbursementId);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({
          title: "保存失败",
          icon: "none",
        });
      });
  },
  submitReimbursement() {
    if (!this.data.reimbursementId) {
      wx.showToast({
        title: "当前仅支持已创建草稿",
        icon: "none",
      });
      return;
    }
    wx.showLoading({
      title: "提交中",
      mask: true,
    });
    wx.cloud
      .callFunction({
        name: "quickstartFunctions",
        data: {
          type: "submitReimbursement",
          id: this.data.reimbursementId,
        },
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: "已提交报销单",
          icon: "success",
        });
        this.fetchReimbursementDetail(this.data.reimbursementId);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({
          title: "提交失败",
          icon: "none",
        });
      });
  },
  deleteDraft() {
    if (!this.data.reimbursementId) {
      return;
    }
    wx.showModal({
      title: "删除草稿",
      content: "删除后会释放关联发票，是否继续？",
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        wx.showLoading({
          title: "删除中",
          mask: true,
        });
        wx.cloud
          .callFunction({
            name: "quickstartFunctions",
            data: {
              type: "deleteReimbursementDraft",
              id: this.data.reimbursementId,
            },
          })
          .then(() => {
            wx.hideLoading();
            wx.showToast({
              title: "已删除草稿",
              icon: "success",
            });
            setTimeout(() => {
              wx.switchTab({
                url: "/pages/reimburse/index",
              });
            }, 500);
          })
          .catch(() => {
            wx.hideLoading();
            wx.showToast({
              title: "删除失败",
              icon: "none",
            });
          });
      },
    });
  },
  handleTap(e) {
    const { page, label } = e.currentTarget.dataset;
    if (page) {
      wx.navigateTo({
        url: page,
      });
      return;
    }
    if (label === "提交报销单") {
      if (this.data.currentView.status === "已提交") {
        wx.showToast({
          title: "该报销单已提交",
          icon: "none",
        });
        return;
      }
      this.submitReimbursement();
      return;
    }
    wx.showToast({
      title: label,
      icon: "none",
    });
  },
});
