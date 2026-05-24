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
        const confirm =
          typeof storage.__nextModalConfirm === "boolean" ? storage.__nextModalConfirm : true;
        delete storage.__nextModalConfirm;
        options.success({ confirm });
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
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "unitAddress" } }, detail: { value: "上海市浦东新区示例路 88 号" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "phoneNumber" } }, detail: { value: "021-00000000" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "bankName" } }, detail: { value: "招商银行上海分行" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "bankAccount" } }, detail: { value: "6222000000000000" } });
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
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(settingsPage.__storage.profileInvoiceTitles[0], "commonSubject"),
  false,
  "stored title should not include common subject"
);
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles[0].unitAddress, "上海市浦东新区示例路 88 号");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles[0].phoneNumber, "021-00000000");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles[0].bankName, "招商银行上海分行");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles[0].bankAccount, "6222000000000000");
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(settingsPage.__storage.profileInvoiceTitles[0], "addressPhone"),
  false,
  "stored title should split address and phone into separate fields"
);

settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "杭州云行信息技术有限公司" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "taxNumber" } }, detail: { value: "91330000MA1K000001" } });
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

const titleToDeleteId = settingsPage.data.invoiceTitles[1].id;
settingsPage.__storage.__nextModalConfirm = false;
settingsPage.deleteTitle({ currentTarget: { dataset: { id: titleToDeleteId } } });
assert.strictEqual(settingsPage.data.invoiceTitles.length, 2, "cancel delete should keep selected title");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles.length, 2, "cancel delete should keep storage");
assert.strictEqual(settingsPage.__storage.__lastModal.title, "删除抬头", "delete should show confirmation title");
assert.strictEqual(
  settingsPage.__storage.__lastModal.content,
  "删除后不会影响已保存的发票记录。",
  "delete should explain saved invoices are unaffected"
);
assert.strictEqual(settingsPage.__storage.__lastModal.confirmText, "删除", "delete confirm text should be explicit");
assert.strictEqual(
  settingsPage.__storage.__lastModal.confirmColor,
  "#D92D20",
  "delete confirm color should be destructive"
);

settingsPage.deleteTitle({ currentTarget: { dataset: { id: titleToDeleteId } } });
assert.strictEqual(settingsPage.data.invoiceTitles.length, 1, "delete should remove selected title");
assert.strictEqual(settingsPage.data.invoiceTitles[0].isDefault, true, "remaining title should become default");
assert.strictEqual(settingsPage.__storage.profileInvoiceTitles.length, 1, "delete should remove selected title from storage");
assert.strictEqual(
  settingsPage.__storage.profileInvoiceTitles[0].isDefault,
  true,
  "remaining stored title should become default"
);

settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "缺税号公司" } });
settingsPage.saveTitleForm();
assert.strictEqual(settingsPage.data.titleErrors.taxNumber, "请填写纳税人识别号");
assert.strictEqual(
  settingsPage.__storage.profileInvoiceTitles.length,
  1,
  "missing tax number should not save a new title"
);

settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "错误税号公司" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "taxNumber" } }, detail: { value: "bad-tax-number" } });
settingsPage.saveTitleForm();
assert.strictEqual(settingsPage.data.titleErrors.taxNumber, "纳税人识别号格式不正确");

const pollutedSettingsPage = loadPage("miniprogram", "pages", "settings", "index.js");
pollutedSettingsPage.__storage.profileInvoiceTitles = "bad";
assert.doesNotThrow(() => {
  pollutedSettingsPage.onLoad({ section: "title" });
}, "settings should tolerate polluted invoice title storage");
assert(
  Array.isArray(pollutedSettingsPage.data.invoiceTitles),
  "polluted invoice title storage should load as an array"
);
assert.strictEqual(
  pollutedSettingsPage.data.invoiceTitles.length,
  0,
  "polluted invoice title storage should load as an empty list"
);

const profilePage = loadPage("miniprogram", "pages", "profile", "index.js");
profilePage.__storage.profileInvoiceTitles = [
  { id: "title-1", name: "A 公司", isDefault: true },
  { id: "title-2", name: "B 公司", isDefault: false },
  { id: "title-3", name: "C 公司", isDefault: false },
  { id: "title-4", name: "D 公司", isDefault: false },
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
assert.strictEqual(statValue("导出模板"), "1", "profile template count should only expose the current PDF template");
assert.strictEqual(statValue("默认抬头"), "1", "profile default title count should be derived from local settings");
assert(
  !profilePage.data.profileStats.some((stat) => stat.label === "常用科目"),
  "profile stats should not show common subject"
);
assert(
  JSON.stringify(profilePage.data.menuGroups).includes("原票模板"),
  "profile menu should fall back to the only visible PDF template label"
);
assert(
  !JSON.stringify(profilePage.data.menuGroups).includes("在线客服"),
  "profile menu should not show online customer service"
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

const contactMenuItem = menuItems.find((menuItem) => menuItem.label === "联系我们");
assert(contactMenuItem, "profile menu should include contact us");
assert.strictEqual(contactMenuItem.action, "contact-modal", "contact us should open a modal directly");
assert.strictEqual(contactMenuItem.page, undefined, "contact us should not navigate to another page");
profilePage.handleTap({
  currentTarget: {
    dataset: {
      action: contactMenuItem.action,
      label: contactMenuItem.label,
    },
  },
});
assert.strictEqual(
  profilePage.data.showContactModal,
  true,
  "contact us should show the custom contact modal"
);
assert.strictEqual(profilePage.__storage.__lastModal, undefined, "contact us should not use native text modal");
assert.deepStrictEqual(
  profilePage.data.contactRows,
  [
    { label: "邮箱", value: "piaoyili2026@126.com" },
    { label: "微信号", value: "ATU-531" },
  ],
  "contact modal should render email and WeChat ID as separate rows"
);
profilePage.hideContactModal();
assert.strictEqual(profilePage.data.showContactModal, false, "contact modal should close from confirm button");

const exportPage = loadPage("miniprogram", "pages", "export-center", "index.js");
exportPage.onLoad({ type: "pdf", mode: "settings" });
assert.strictEqual(exportPage.data.mode, "settings", "export center should support settings mode");
assert.strictEqual(exportPage.data.templateOptions.length, 1, "export center should only show original PDF template");
assert.strictEqual(exportPage.data.templateOptions[0].title, "原票模板", "visible PDF template should match implemented export");
exportPage.selectTemplate({ currentTarget: { dataset: { id: "simple-list" } } });
assert.strictEqual(exportPage.data.selectedTemplateId, "original-archive", "hidden template selection should be ignored");
exportPage.selectTemplate({ currentTarget: { dataset: { id: "original-archive" } } });
assert.strictEqual(
  exportPage.__storage.profilePdfTemplate.selectedTemplateId,
  "original-archive",
  "visible original template should persist to local storage"
);

const settingsWxss = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "settings", "index.wxss"),
  "utf8"
);
const settingsJs = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "settings", "index.js"),
  "utf8"
);
const settingsWxml = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "settings", "index.wxml"),
  "utf8"
);
const profileJs = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "profile", "index.js"),
  "utf8"
);
assert(!profileJs.includes("month-archive"), "profile should hide month archive template");
assert(!profileJs.includes("simple-list"), "profile should hide simple list template");
assert(!profileJs.includes("在线客服"), "profile logic should not include online customer service");
assert(!profileJs.includes("/pages/settings/index?section=contact"), "profile contact entry should not navigate to settings");
assert(!profileJs.includes("wx.showModal({\n        title: \"联系我们\""), "profile contact should not use native text modal");
assert(profileJs.includes("piaoyili2026@126.com"), "profile contact modal should include support email");
assert(profileJs.includes("ATU-531"), "profile contact modal should include WeChat ID");
assert(!settingsJs.includes("在线客服"), "settings contact content should not include online customer service");
assert(!settingsJs.includes("commonSubject"), "settings logic should not keep common subject");
assert(!settingsWxml.includes("常用科目"), "settings UI should not show common subject");
assert(!settingsJs.includes("addressPhone"), "settings logic should split address and phone fields");
assert(!settingsWxml.includes("地址电话"), "settings UI should split address and phone fields");
assert(!settingsWxml.includes("开户行及账号"), "settings UI should split bank name and account fields");
assert(settingsWxml.includes('data-field="unitAddress"'), "settings UI should include unit address field");
assert(settingsWxml.includes('data-field="phoneNumber"'), "settings UI should include phone number field");
assert(settingsWxml.includes('data-field="bankName"'), "settings UI should include bank name field");
assert(settingsWxml.includes('data-field="bankAccount"'), "settings UI should include bank account field");
assert(!profileJs.includes("常用科目"), "profile stats should not mention common subject");
assert(
  /\.title-card-head\s*\{[^}]*display:\s*block/s.test(settingsWxss),
  "title card header should stack title above action buttons"
);
assert(
  /\.title-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s.test(settingsWxss),
  "title action buttons should use two stable columns"
);

const profileWxml = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "profile", "index.wxml"),
  "utf8"
);
const profileWxss = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "profile", "index.wxss"),
  "utf8"
);
assert(profileWxml.includes("/images/票易理头像.png"), "profile hero should use the provided avatar image");
assert(!profileWxml.includes(">票</view>"), "profile hero should not use text as avatar");
assert(!profileWxml.includes('open-type="contact"'), "profile should not render online customer service button");
assert(!profileWxml.includes("isContact"), "profile should not keep contact menu branching");
assert(
  profileWxml.includes('class="menu-arrow" wx:if="{{entry.page}}"'),
  "profile should only show menu arrow for navigation rows"
);
assert(profileWxml.includes("contact-modal-mask"), "profile should render a custom contact modal overlay");
assert(profileWxml.includes("contact-modal-line"), "profile should render contact fields as clean text lines");
assert(profileWxml.includes("{{item.label}}：{{item.value}}"), "profile contact fields should keep label, colon, and value in one line");
assert(!profileWxml.includes("contact-modal-label"), "profile contact modal should not split labels into a separate grid column");
assert(!profileWxml.includes("contact-modal-value"), "profile contact modal should not split values into a separate grid column");
assert(
  /\.profile-avatar\s*\{[^}]*overflow:\s*hidden/s.test(profileWxss),
  "profile avatar should crop the image inside a circular container"
);
assert(
  /\.profile-avatar-image\s*\{[^}]*width:\s*220rpx/s.test(profileWxss),
  "profile avatar image should be enlarged for circular crop"
);
assert(
  /\.contact-modal-card\s*\{[^}]*border-radius:\s*18rpx/s.test(profileWxss),
  "contact modal should use a stable dialog card"
);
assert(
  !/\.contact-modal-row\s*\{[^}]*grid-template-columns/s.test(profileWxss),
  "contact modal should not use two-column grid layout"
);

console.log("profile light settings behavior checks passed");
