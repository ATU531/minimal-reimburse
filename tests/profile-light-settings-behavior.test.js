const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

const setByPath = (target, pathKey, value) => {
  if (!pathKey.includes(".")) {
    target[pathKey] = value;
    return;
  }

  const parts = pathKey.split(".");
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!cursor[part] || typeof cursor[part] !== "object") {
      cursor[part] = {};
    }
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
};

const loadPage = (...parts) => {
  const pagePath = path.join(root, ...parts);
  const pageSource = fs.readFileSync(pagePath, "utf8");
  let pageConfig;
  const storage = {};
  const wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    showToast(options) {
      storage.__lastToast = options;
    },
    showModal(options) {
      storage.__lastModal = options;
      if (options && typeof options.success === "function") {
        options.success({ confirm: true });
      }
    },
    navigateTo(options) {
      storage.__lastNavigate = options;
    },
    cloud: {
      callFunction(options) {
        storage.__lastCloudCall = options;
        return Promise.resolve({
          result: {
            success: true,
            data: [],
          },
        });
      },
    },
  };
  vm.runInNewContext(pageSource, {
    Page(config) {
      pageConfig = config;
    },
    wx,
    Date,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    console,
  });
  pageConfig.data = JSON.parse(JSON.stringify(pageConfig.data || {}));
  pageConfig.setData = (nextData, callback) => {
    pageConfig.data = Object.assign({}, pageConfig.data);
    Object.keys(nextData).forEach((key) => {
      setByPath(pageConfig.data, key, nextData[key]);
    });
    if (typeof callback === "function") {
      callback();
    }
  };
  pageConfig.__storage = storage;
  pageConfig.__wx = wx;
  return pageConfig;
};

const settingsPage = loadPage("miniprogram", "pages", "settings", "index.js");

settingsPage.onLoad({ section: "title" });
settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "上海知行科技有限公司" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "taxNumber" } }, detail: { value: "91310000MA1K000000" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "addressPhone" } }, detail: { value: "上海市浦东新区示例路 88 号 021-00000000" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "bankAccount" } }, detail: { value: "招商银行上海分行 6222000000000000" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "commonSubject" } }, detail: { value: "信息服务" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "remark" } }, detail: { value: "默认软件订阅抬头" } });
settingsPage.saveTitleForm();

assert.strictEqual(settingsPage.data.invoiceTitles.length, 1, "first title should be saved");
assert.strictEqual(settingsPage.data.invoiceTitles[0].isDefault, true, "first title should become default");
assert.strictEqual(settingsPage.data.showTitleForm, false, "save should return to title list");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles.length, 1, "first title should persist to storage");
assert.strictEqual(
  settingsPage.__storage.profileInvoiceTitles[0].isDefault,
  true,
  "first stored title should become default"
);

settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "杭州云行信息技术有限公司" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "taxNumber" } }, detail: { value: "91330000MA1K000001" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "commonSubject" } }, detail: { value: "信息服务" } });
settingsPage.handleDefaultChange({ detail: { value: true } });
settingsPage.saveTitleForm();

assert.strictEqual(settingsPage.data.invoiceTitles.length, 2, "second title should be saved");
assert.strictEqual(settingsPage.data.invoiceTitles.filter((item) => item.isDefault).length, 1, "only one title can be default");
assert.strictEqual(settingsPage.data.invoiceTitles[1].isDefault, true, "new default should be active");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles.length, 2, "second title should persist to storage");
assert.strictEqual(
  settingsPage.__storage.profileInvoiceTitles.filter((item) => item.isDefault).length,
  1,
  "only one stored title can be default"
);
assert.strictEqual(
  settingsPage.__storage.profileInvoiceTitles[1].isDefault,
  true,
  "new stored default should be active"
);

settingsPage.deleteTitle({ currentTarget: { dataset: { id: settingsPage.data.invoiceTitles[1].id } } });
assert.strictEqual(settingsPage.data.invoiceTitles.length, 1, "delete should remove selected title");
assert.strictEqual(settingsPage.data.invoiceTitles[0].isDefault, true, "remaining title should become default");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles.length, 1, "delete should remove selected title from storage");
assert.strictEqual(
  settingsPage.__storage.profileInvoiceTitles[0].isDefault,
  true,
  "remaining stored title should become default"
);

settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "错误税号公司" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "taxNumber" } }, detail: { value: "bad-tax-number" } });
settingsPage.saveTitleForm();
assert.strictEqual(settingsPage.data.titleErrors.taxNumber, "纳税人识别号格式不正确");

const profilePage = loadPage("miniprogram", "pages", "profile", "index.js");
profilePage.__storage.profileInvoiceTitles = [
  { id: "title-1", name: "A 公司", commonSubject: "信息服务", isDefault: true },
  { id: "title-2", name: "B 公司", commonSubject: "信息服务", isDefault: false },
  { id: "title-3", name: "C 公司", commonSubject: "差旅", isDefault: false },
  { id: "title-4", name: "D 公司", commonSubject: "", isDefault: false },
];
profilePage.__storage.profilePdfTemplate = {
  selectedTemplateId: "month-archive",
  updatedAt: 1716537600000,
};
profilePage.onShow();

const statValue = (label) => {
  const item = profilePage.data.profileStats.find((stat) => stat.label === label);
  assert(item, `profile stats should include ${label}`);
  return item.value;
};

assert.strictEqual(statValue("常用抬头"), "4", "profile title count should be derived from local settings");
assert.strictEqual(statValue("导出模板"), "3", "profile template count should be derived from local settings");
assert.strictEqual(statValue("常用科目"), "2", "profile subject count should be derived from local settings");
assert(
  JSON.stringify(profilePage.data.menuGroups).includes("按月份归档"),
  "profile menu should show current PDF template label"
);

const menuItems = profilePage.data.menuGroups.flatMap((group) => group.items || []);
const assertMenuPage = (label, page) => {
  const item = menuItems.find((menuItem) => menuItem.label === label);
  assert(item, `profile menu should include ${label}`);
  assert.strictEqual(item.page, page, `${label} should navigate to ${page}`);
  profilePage.handleTap({
    currentTarget: { dataset: { page: item.page, label: item.label } },
  });
  assert.strictEqual(
    profilePage.__storage.__lastNavigate.url,
    page,
    `${label} tap should navigate to ${page}`
  );
};

assertMenuPage("发票抬头", "/pages/settings/index?section=title");
assertMenuPage("收票说明与指引", "/pages/settings/index?section=guide");
assertMenuPage("PDF 导出模板", "/pages/export-center/index?type=pdf&mode=settings");
assertMenuPage("常见问题", "/pages/settings/index?section=faq");
assertMenuPage("联系我们", "/pages/settings/index?section=contact");

const exportPage = loadPage("miniprogram", "pages", "export-center", "index.js");
exportPage.onLoad({ type: "pdf", mode: "settings" });
assert.strictEqual(exportPage.data.mode, "settings", "export center should support settings mode");
exportPage.selectTemplate({ currentTarget: { dataset: { id: "simple-list" } } });
assert.strictEqual(exportPage.data.selectedTemplateId, "simple-list", "selected template should update page state");
assert.strictEqual(
  exportPage.__storage.profilePdfTemplate.selectedTemplateId,
  "simple-list",
  "selected template should persist to local storage"
);

console.log("profile light settings behavior checks passed");
