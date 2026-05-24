Component({
  data: {
    privacyContractName: "用户隐私保护指引",
    showPrivacyDialog: false,
  },

  lifetimes: {
    attached() {
      this.checkPrivacyAuthorization();
    },
  },

  methods: {
    checkPrivacyAuthorization() {
      if (!wx.getPrivacySetting) {
        return;
      }

      wx.getPrivacySetting({
        success: (res) => {
          this.setData({
            privacyContractName: res.privacyContractName || "用户隐私保护指引",
            showPrivacyDialog: !!res.needAuthorization,
          });
        },
      });
    },

    openPrivacyContract() {
      if (!wx.openPrivacyContract) {
        return;
      }

      wx.openPrivacyContract({
        fail: () => {
          wx.showToast({
            title: "暂无法打开隐私协议",
            icon: "none",
          });
        },
      });
    },

    handleAgreePrivacyAuthorization() {
      this.setData({
        showPrivacyDialog: false,
      });
    },

    keepPrivacyDialog() {
      wx.showToast({
        title: "同意后才能继续使用",
        icon: "none",
      });
    },

    noop() {},
  },
});
