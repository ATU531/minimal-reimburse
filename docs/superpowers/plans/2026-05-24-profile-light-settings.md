# 票易理“我的”页轻量配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved lightweight “我的” configuration center with local invoice-title CRUD, static support content, customer-service entry, and local PDF template selection.

**Architecture:** Reuse the existing `profile`, `settings`, and `export-center` pages. Keep configuration local with `wx.getStorageSync` / `wx.setStorageSync`, avoid new routes and cloud-function changes, and add Node VM behavior tests around page methods before production changes.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, local storage APIs, Node.js static/behavior tests with `assert` and `vm`.

---

## File Structure

Modify these existing files:

- `miniprogram/pages/profile/index.js`: derive profile statistics and menu values from local configuration; route support entries.
- `miniprogram/pages/profile/index.wxml`: render online customer service with `button open-type="contact"` and keep normal menu taps for other entries.
- `miniprogram/pages/profile/index.wxss`: add reset styles for the customer service button so it matches existing menu rows.
- `miniprogram/pages/settings/index.js`: turn the settings page into a local configuration page with invoice-title CRUD and static `guide` / `faq` / `contact` sections.
- `miniprogram/pages/settings/index.wxml`: add section-specific layouts for title list/form and static content.
- `miniprogram/pages/settings/index.wxss`: style title cards, form fields, switches, static content cards, and action buttons.
- `miniprogram/pages/export-center/index.js`: add `mode=settings`, local PDF template options, and template persistence.
- `miniprogram/pages/export-center/index.wxml`: render template selection in settings mode and keep existing export flow in normal mode.
- `miniprogram/pages/export-center/index.wxss`: style template cards and selected state.
- `tests/ui-redesign-readiness.test.js`: add static assertions for support and settings-template surfaces.
- `tests/v1-readiness.test.js`: keep unsupported v1 surfaces out after new entries are added.

Create this file:

- `tests/profile-light-settings-behavior.test.js`: behavior tests for local title helpers, profile stats, default-title rules, and PDF template persistence.

Do not modify:

- `cloudfunctions/quickstartFunctions/index.js`
- `miniprogram/pages/index/*`
- `miniprogram/pages/folder/*`
- `miniprogram/pages/invoice-detail/*`
- `miniprogram/pages/manual-entry/*`

---

### Task 1: Add Failing Behavior and Readiness Tests

**Files:**
- Create: `tests/profile-light-settings-behavior.test.js`
- Modify: `tests/ui-redesign-readiness.test.js`
- Modify: `tests/v1-readiness.test.js`
- Test: `tests/profile-light-settings-behavior.test.js`
- Test: `tests/ui-redesign-readiness.test.js`
- Test: `tests/v1-readiness.test.js`

- [ ] **Step 1: Create the failing behavior test**

Create `tests/profile-light-settings-behavior.test.js`:

```js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

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
    pageConfig.data = Object.assign({}, pageConfig.data, nextData);
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

settingsPage.showNewTitleForm();
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "name" } }, detail: { value: "杭州云行信息技术有限公司" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "taxNumber" } }, detail: { value: "91330000MA1K000001" } });
settingsPage.handleTitleInput({ currentTarget: { dataset: { field: "commonSubject" } }, detail: { value: "信息服务" } });
settingsPage.handleDefaultChange({ detail: { value: true } });
settingsPage.saveTitleForm();

assert.strictEqual(settingsPage.data.invoiceTitles.length, 2, "second title should be saved");
assert.strictEqual(settingsPage.data.invoiceTitles.filter((item) => item.isDefault).length, 1, "only one title can be default");
assert.strictEqual(settingsPage.data.invoiceTitles[1].isDefault, true, "new default should be active");

settingsPage.deleteTitle({ currentTarget: { dataset: { id: settingsPage.data.invoiceTitles[1].id } } });
assert.strictEqual(settingsPage.data.invoiceTitles.length, 1, "delete should remove selected title");
assert.strictEqual(settingsPage.data.invoiceTitles[0].isDefault, true, "remaining title should become default");

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

assert.deepStrictEqual(
  profilePage.data.profileStats,
  [
    { label: "常用抬头", value: "4" },
    { label: "导出模板", value: "3" },
    { label: "常用科目", value: "2" },
  ],
  "profile stats should be derived from local settings"
);
assert(
  JSON.stringify(profilePage.data.menuGroups).includes("按月份归档"),
  "profile menu should show current PDF template label"
);
assert(
  JSON.stringify(profilePage.data.menuGroups).includes("/pages/settings/index?section=guide"),
  "profile guide entry should use the guide section"
);
assert(
  JSON.stringify(profilePage.data.menuGroups).includes("/pages/settings/index?section=faq"),
  "profile FAQ entry should navigate to settings FAQ"
);

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
```

- [ ] **Step 2: Run the behavior test to verify it fails**

Run:

```powershell
node tests/profile-light-settings-behavior.test.js
```

Expected: FAIL with `settingsPage.showNewTitleForm is not a function`.

- [ ] **Step 3: Update UI readiness assertions**

Append these checks near the existing profile/settings/export assertions in `tests/ui-redesign-readiness.test.js`:

```js
const profileJs = read("miniprogram", "pages", "profile", "index.js");
assertIncludes(profileJs, "profileInvoiceTitles", "profile js");
assertIncludes(profileJs, "profilePdfTemplate", "profile js");
assertIncludes(profileWxml, 'open-type="contact"', "profile wxml");
assertIncludes(profileWxml, "isContact", "profile wxml");

const settingsJs = read("miniprogram", "pages", "settings", "index.js");
const settingsWxml = read("miniprogram", "pages", "settings", "index.wxml");
assertIncludes(settingsJs, "profileInvoiceTitles", "settings js");
assertIncludes(settingsJs, "showNewTitleForm", "settings js");
assertIncludes(settingsJs, "saveTitleForm", "settings js");
assertIncludes(settingsWxml, "纳税人识别号", "settings wxml");
assertIncludes(settingsWxml, "开户行及账号", "settings wxml");
assertIncludes(settingsWxml, "常用科目", "settings wxml");
assertIncludes(settingsWxml, "收票说明与指引", "settings wxml");
assertIncludes(settingsWxml, "常见问题", "settings wxml");
assertIncludes(settingsWxml, "联系我们", "settings wxml");

assertIncludes(exportCenterJs, "profilePdfTemplate", "export center js");
assertIncludes(exportCenterJs, "selectTemplate", "export center js");
assertIncludes(exportCenterWxml, "template-card", "export center wxml");
assertIncludes(exportCenterWxml, "PDF 导出模板", "export center wxml");
```

- [ ] **Step 4: Run UI readiness to verify it fails on missing implementation**

Run:

```powershell
node tests/ui-redesign-readiness.test.js
```

Expected: FAIL with `profile js must include "profileInvoiceTitles"`.

- [ ] **Step 5: Update v1 readiness guard**

In `tests/v1-readiness.test.js`, keep the existing profile unsupported-token check and add `会员` to the guarded tokens:

```js
const profileJs = read("miniprogram", "pages", "profile", "index.js");
["企业", "报销", "打印", "协作", "会员"].forEach((token) => {
  assertNotIncludes(profileJs, token, "profile js");
});
```

- [ ] **Step 6: Run v1 readiness**

Run:

```powershell
node tests/v1-readiness.test.js
```

Expected: PASS. The new guard should not fail current code.

- [ ] **Step 7: Commit the failing tests**

Run:

```powershell
git add tests/profile-light-settings-behavior.test.js tests/ui-redesign-readiness.test.js tests/v1-readiness.test.js
git commit -m "test: add profile light settings checks"
```

Expected: commit succeeds with only the three test files staged.

---

### Task 2: Implement Dynamic Profile Stats and Support Entrypoints

**Files:**
- Modify: `miniprogram/pages/profile/index.js`
- Modify: `miniprogram/pages/profile/index.wxml`
- Modify: `miniprogram/pages/profile/index.wxss`
- Test: `tests/profile-light-settings-behavior.test.js`
- Test: `tests/ui-redesign-readiness.test.js`

- [ ] **Step 1: Replace profile page JS with local-stat helpers**

Replace `miniprogram/pages/profile/index.js` with:

```js
const INVOICE_TITLES_STORAGE_KEY = "profileInvoiceTitles";
const PDF_TEMPLATE_STORAGE_KEY = "profilePdfTemplate";

const PDF_TEMPLATE_OPTIONS = [
  { id: "original-archive", label: "原票归档" },
  { id: "month-archive", label: "按月份归档" },
  { id: "simple-list", label: "简洁清单" },
];

Page({
  data: {
    profileStats: [
      { label: "常用抬头", value: "0" },
      { label: "导出模板", value: String(PDF_TEMPLATE_OPTIONS.length) },
      { label: "常用科目", value: "0" },
    ],
    menuGroups: [],
  },
  onLoad() {
    this.refreshProfileData();
  },
  onShow() {
    this.refreshProfileData();
  },
  getInvoiceTitles() {
    return wx.getStorageSync(INVOICE_TITLES_STORAGE_KEY) || [];
  },
  getPdfTemplate() {
    return (
      wx.getStorageSync(PDF_TEMPLATE_STORAGE_KEY) || {
        selectedTemplateId: "original-archive",
      }
    );
  },
  getPdfTemplateLabel(templateId = this.getPdfTemplate().selectedTemplateId) {
    const matched = PDF_TEMPLATE_OPTIONS.find((item) => item.id === templateId);
    return matched ? matched.label : PDF_TEMPLATE_OPTIONS[0].label;
  },
  countCommonSubjects(invoiceTitles) {
    const subjectMap = {};
    (invoiceTitles || []).forEach((item) => {
      const subject = String(item.commonSubject || "").trim();
      if (subject) {
        subjectMap[subject] = true;
      }
    });
    return Object.keys(subjectMap).length;
  },
  buildProfileStats(invoiceTitles) {
    return [
      { label: "常用抬头", value: String(invoiceTitles.length) },
      { label: "导出模板", value: String(PDF_TEMPLATE_OPTIONS.length) },
      { label: "常用科目", value: String(this.countCommonSubjects(invoiceTitles)) },
    ];
  },
  buildMenuGroups(invoiceTitles, templateLabel) {
    return [
      {
        id: "invoice",
        title: "发票资料",
        items: [
          {
            label: "发票抬头",
            value: `已设${invoiceTitles.length}个`,
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
            value: templateLabel,
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
            label: "在线客服",
            value: "",
            icon: "/images/icons/ui-service.svg",
            isContact: true,
          },
          {
            label: "常见问题",
            value: "",
            icon: "/images/icons/ui-question.svg",
            page: "/pages/settings/index?section=faq",
          },
          {
            label: "联系我们",
            value: "",
            icon: "/images/icons/ui-phone.svg",
            page: "/pages/settings/index?section=contact",
          },
        ],
      },
    ];
  },
  refreshProfileData() {
    const invoiceTitles = this.getInvoiceTitles();
    const templateLabel = this.getPdfTemplateLabel();
    this.setData({
      profileStats: this.buildProfileStats(invoiceTitles),
      menuGroups: this.buildMenuGroups(invoiceTitles, templateLabel),
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
    wx.showToast({
      title: label,
      icon: "none",
    });
  },
});
```

- [ ] **Step 2: Update profile WXML for customer service rows**

Replace the menu item block in `miniprogram/pages/profile/index.wxml` with:

```xml
    <button
      wx:if="{{entry.isContact}}"
      class="menu-item menu-button"
      open-type="contact"
      data-label="{{entry.label}}"
    >
      <image class="menu-icon" src="{{entry.icon}}" mode="aspectFit"></image>
      <view class="menu-main">
        <view class="menu-label">{{entry.label}}</view>
      </view>
      <view class="menu-arrow">›</view>
    </button>
    <view
      wx:else
      class="menu-item"
      data-label="{{entry.label}}"
      data-page="{{entry.page}}"
      bindtap="handleTap"
    >
      <image class="menu-icon" src="{{entry.icon}}" mode="aspectFit"></image>
      <view class="menu-main">
        <view class="menu-label">{{entry.label}}</view>
      </view>
      <view class="menu-value" wx:if="{{entry.value}}">{{entry.value}}</view>
      <view class="menu-arrow">›</view>
    </view>
```

The surrounding `wx:for` group stays unchanged.

- [ ] **Step 3: Add button reset styling**

Append to `miniprogram/pages/profile/index.wxss`:

```css
.menu-button {
  width: 100%;
  margin: 0;
  background: #FFFFFF;
  border-radius: 0;
  text-align: left;
}

.menu-button::after {
  border: none;
}
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
node tests/profile-light-settings-behavior.test.js
node tests/ui-redesign-readiness.test.js
```

Expected: `profile-light-settings` still FAILS with `settingsPage.showNewTitleForm is not a function`; UI readiness advances past profile assertions and fails on settings assertions.

- [ ] **Step 5: Commit profile implementation**

Run:

```powershell
git add miniprogram/pages/profile/index.js miniprogram/pages/profile/index.wxml miniprogram/pages/profile/index.wxss
git commit -m "feat: derive profile settings summary"
```

Expected: commit succeeds with only profile files staged.

---

### Task 3: Implement Settings Page Title CRUD and Static Sections

**Files:**
- Modify: `miniprogram/pages/settings/index.js`
- Modify: `miniprogram/pages/settings/index.wxml`
- Modify: `miniprogram/pages/settings/index.wxss`
- Test: `tests/profile-light-settings-behavior.test.js`
- Test: `tests/ui-redesign-readiness.test.js`

- [ ] **Step 1: Replace settings page JS**

Replace `miniprogram/pages/settings/index.js` with:

```js
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

Page({
  data: {
    currentSectionKey: "title",
    currentSection: {
      title: "发票抬头",
      subtitle: "维护常用购买方信息，减少重复填写",
      type: "title",
    },
    sectionMap: {
      title: {
        title: "发票抬头",
        subtitle: "维护常用购买方信息，减少重复填写",
        type: "title",
      },
      guide: {
        title: "收票说明与指引",
        subtitle: "整理微信文件、相册上传和原票 PDF 归档说明",
        type: "guide",
      },
      faq: {
        title: "常见问题",
        subtitle: "查看发票收集和原票 PDF 导出的常见说明",
        type: "faq",
      },
      contact: {
        title: "联系我们",
        subtitle: "反馈使用问题或查看服务支持方式",
        type: "contact",
      },
    },
    invoiceTitles: [],
    editingTitleId: "",
    showTitleForm: false,
    titleForm: Object.assign({}, EMPTY_TITLE_FORM),
    titleErrors: {},
    guideGroups: [
      {
        title: "聊天文件",
        desc: "在微信聊天中收到电子发票 PDF 或图片后，可从首页选择聊天文件导入。",
      },
      {
        title: "相册/拍照",
        desc: "纸质票据或截图可通过拍照、相册上传识别，识别后请检查金额和日期。",
      },
      {
        title: "手动录入",
        desc: "无原票或识别失败时，可手动补录核心字段并保存到票夹。",
      },
      {
        title: "原票附件保留",
        desc: "电子发票归档建议同步保留原始图片或 PDF，便于后续合并导出。",
      },
    ],
    faqItems: [
      {
        question: "支持哪些发票？",
        answer: "当前优先支持电子发票 PDF、发票图片和手动录入的常见票据字段。",
      },
      {
        question: "为什么要保留原票？",
        answer: "原票图片或 PDF 是导出归档包的来源，缺少原票时无法生成完整原票 PDF。",
      },
      {
        question: "PDF 导出失败怎么办？",
        answer: "请确认所选发票已有原始图片或 PDF 附件，并等待本地草稿同步完成。",
      },
      {
        question: "本地配置会同步吗？",
        answer: "这一版发票抬头和模板偏好保存在当前微信本地，不做云端同步。",
      },
    ],
    contactItems: [
      {
        title: "在线客服",
        desc: "回到“我的”页点击在线客服，可使用微信原生客服入口。",
      },
      {
        title: "产品反馈",
        desc: "可通过客服入口反馈 OCR、票夹管理和 PDF 导出相关问题。",
      },
    ],
  },
  onLoad(options) {
    const section = options.section || "title";
    this.switchSection(section);
    this.loadInvoiceTitles();
  },
  switchSection(section) {
    const currentSection = this.data.sectionMap[section] || this.data.sectionMap.title;
    this.setData({
      currentSectionKey: currentSection.type,
      currentSection,
      showTitleForm: false,
      editingTitleId: "",
      titleErrors: {},
    });
  },
  loadInvoiceTitles() {
    this.setData({
      invoiceTitles: wx.getStorageSync(INVOICE_TITLES_STORAGE_KEY) || [],
    });
  },
  persistInvoiceTitles(invoiceTitles) {
    wx.setStorageSync(INVOICE_TITLES_STORAGE_KEY, invoiceTitles);
    this.setData({
      invoiceTitles,
    });
  },
  createEmptyTitleForm() {
    return Object.assign({}, EMPTY_TITLE_FORM);
  },
  showNewTitleForm() {
    this.setData({
      showTitleForm: true,
      editingTitleId: "",
      titleForm: this.createEmptyTitleForm(),
      titleErrors: {},
    });
  },
  editTitle(e) {
    const id = e.currentTarget.dataset.id;
    const title = this.data.invoiceTitles.find((item) => item.id === id);
    if (!title) {
      return;
    }
    this.setData({
      showTitleForm: true,
      editingTitleId: id,
      titleForm: Object.assign(this.createEmptyTitleForm(), title),
      titleErrors: {},
    });
  },
  cancelTitleForm() {
    this.setData({
      showTitleForm: false,
      editingTitleId: "",
      titleForm: this.createEmptyTitleForm(),
      titleErrors: {},
    });
  },
  handleTitleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      titleForm: Object.assign({}, this.data.titleForm, {
        [field]: e.detail.value,
      }),
    });
  },
  handleDefaultChange(e) {
    this.setData({
      titleForm: Object.assign({}, this.data.titleForm, {
        isDefault: Boolean(e.detail.value),
      }),
    });
  },
  validateTitleForm(form) {
    const errors = {};
    const name = String(form.name || "").trim();
    const taxNumber = String(form.taxNumber || "").trim();
    if (!name) {
      errors.name = "请填写抬头名称";
    }
    if (taxNumber && !/^[0-9A-Z]{15,20}$/.test(taxNumber)) {
      errors.taxNumber = "纳税人识别号格式不正确";
    }
    return errors;
  },
  normalizeTitleForm(form) {
    return {
      name: String(form.name || "").trim(),
      taxNumber: String(form.taxNumber || "").trim().toUpperCase(),
      addressPhone: String(form.addressPhone || "").trim(),
      bankAccount: String(form.bankAccount || "").trim(),
      commonSubject: String(form.commonSubject || "").trim(),
      remark: String(form.remark || "").trim(),
      isDefault: Boolean(form.isDefault),
    };
  },
  buildSavedTitle(form, previousTitle) {
    const now = Date.now();
    return Object.assign({}, previousTitle || {}, form, {
      id: previousTitle ? previousTitle.id : `title-${now}-${Math.floor(Math.random() * 1000)}`,
      createdAt: previousTitle ? previousTitle.createdAt : now,
      updatedAt: now,
    });
  },
  applyDefaultRule(invoiceTitles, preferredDefaultId) {
    if (!invoiceTitles.length) {
      return [];
    }
    const defaultId =
      preferredDefaultId ||
      (invoiceTitles.find((item) => item.isDefault) || invoiceTitles[0]).id;
    return invoiceTitles.map((item) =>
      Object.assign({}, item, {
        isDefault: item.id === defaultId,
      })
    );
  },
  saveTitleForm() {
    const normalizedForm = this.normalizeTitleForm(this.data.titleForm);
    const titleErrors = this.validateTitleForm(normalizedForm);
    if (Object.keys(titleErrors).length) {
      this.setData({ titleErrors });
      return;
    }
    const editingTitleId = this.data.editingTitleId;
    const previousTitle = this.data.invoiceTitles.find((item) => item.id === editingTitleId);
    const savedTitle = this.buildSavedTitle(normalizedForm, previousTitle);
    const nextTitles = editingTitleId
      ? this.data.invoiceTitles.map((item) => (item.id === editingTitleId ? savedTitle : item))
      : this.data.invoiceTitles.concat(savedTitle);
    const preferredDefaultId =
      savedTitle.isDefault || nextTitles.length === 1
        ? savedTitle.id
        : (nextTitles.find((item) => item.isDefault) || nextTitles[0]).id;
    this.persistInvoiceTitles(this.applyDefaultRule(nextTitles, preferredDefaultId));
    this.setData({
      showTitleForm: false,
      editingTitleId: "",
      titleForm: this.createEmptyTitleForm(),
      titleErrors: {},
    });
    wx.showToast({
      title: "已保存抬头",
      icon: "success",
    });
  },
  setDefaultTitle(e) {
    const id = e.currentTarget.dataset.id;
    this.persistInvoiceTitles(this.applyDefaultRule(this.data.invoiceTitles, id));
    wx.showToast({
      title: "已设为默认",
      icon: "success",
    });
  },
  deleteTitle(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除抬头",
      content: "删除后不会影响已保存的发票记录。",
      confirmText: "删除",
      confirmColor: "#D92D20",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const remainingTitles = this.data.invoiceTitles.filter((item) => item.id !== id);
        this.persistInvoiceTitles(this.applyDefaultRule(remainingTitles));
      },
    });
  },
  handleTap(e) {
    wx.showToast({
      title: e.currentTarget.dataset.label,
      icon: "none",
    });
  },
});
```

- [ ] **Step 2: Replace settings WXML**

Replace `miniprogram/pages/settings/index.wxml` with:

```xml
<view class="page">
  <view class="hero-card">
    <view class="hero-title">{{currentSection.title}}</view>
    <view class="hero-desc">{{currentSection.subtitle}}</view>
  </view>

  <view wx:if="{{currentSection.type === 'title'}}">
    <view class="title-toolbar" wx:if="{{!showTitleForm}}">
      <view class="toolbar-copy">本地保存常用发票抬头，方便后续录入时参考。</view>
      <view class="primary-action" bindtap="showNewTitleForm">新增抬头</view>
    </view>

    <view class="empty-card" wx:if="{{!showTitleForm && !invoiceTitles.length}}">
      <view class="empty-title">还没有常用抬头</view>
      <view class="empty-desc">新增后会在“我的”页统计中展示。</view>
    </view>

    <view class="title-list" wx:if="{{!showTitleForm && invoiceTitles.length}}">
      <view class="title-card" wx:for="{{invoiceTitles}}" wx:key="id" wx:for-item="item">
        <view class="title-card-head">
          <view class="title-name">{{item.name}}</view>
          <view class="default-badge" wx:if="{{item.isDefault}}">默认</view>
        </view>
        <view class="title-meta" wx:if="{{item.taxNumber}}">税号：{{item.taxNumber}}</view>
        <view class="title-meta" wx:if="{{item.commonSubject}}">常用科目：{{item.commonSubject}}</view>
        <view class="title-actions">
          <view class="text-action" data-id="{{item.id}}" bindtap="editTitle">编辑</view>
          <view class="text-action" wx:if="{{!item.isDefault}}" data-id="{{item.id}}" bindtap="setDefaultTitle">设为默认</view>
          <view class="text-action danger-action" data-id="{{item.id}}" bindtap="deleteTitle">删除</view>
        </view>
      </view>
    </view>

    <view class="form-card" wx:if="{{showTitleForm}}">
      <view class="form-title">{{editingTitleId ? '编辑抬头' : '新增抬头'}}</view>
      <view class="field">
        <view class="field-label">抬头名称</view>
        <input class="field-input {{titleErrors.name ? 'field-input-error' : ''}}" placeholder="请输入公司或个人抬头" data-field="name" value="{{titleForm.name}}" bindinput="handleTitleInput" />
        <view class="field-error" wx:if="{{titleErrors.name}}">{{titleErrors.name}}</view>
      </view>
      <view class="field">
        <view class="field-label">纳税人识别号</view>
        <input class="field-input {{titleErrors.taxNumber ? 'field-input-error' : ''}}" placeholder="15-20 位大写字母或数字" data-field="taxNumber" value="{{titleForm.taxNumber}}" bindinput="handleTitleInput" />
        <view class="field-error" wx:if="{{titleErrors.taxNumber}}">{{titleErrors.taxNumber}}</view>
      </view>
      <view class="field">
        <view class="field-label">地址电话</view>
        <input class="field-input" placeholder="例如：地址 + 电话" data-field="addressPhone" value="{{titleForm.addressPhone}}" bindinput="handleTitleInput" />
      </view>
      <view class="field">
        <view class="field-label">开户行及账号</view>
        <input class="field-input" placeholder="例如：银行名称 + 账号" data-field="bankAccount" value="{{titleForm.bankAccount}}" bindinput="handleTitleInput" />
      </view>
      <view class="field">
        <view class="field-label">常用科目</view>
        <input class="field-input" placeholder="例如：信息服务、差旅、餐饮" data-field="commonSubject" value="{{titleForm.commonSubject}}" bindinput="handleTitleInput" />
      </view>
      <view class="field">
        <view class="field-label">备注</view>
        <textarea class="field-textarea" placeholder="填写使用场景或归档说明" data-field="remark" bindinput="handleTitleInput">{{titleForm.remark}}</textarea>
      </view>
      <view class="switch-row">
        <view>
          <view class="switch-title">设为默认抬头</view>
          <view class="switch-desc">默认抬头会优先展示在列表中。</view>
        </view>
        <switch checked="{{titleForm.isDefault}}" bindchange="handleDefaultChange" color="#4F46E5" />
      </view>
      <view class="form-actions">
        <view class="secondary-action" bindtap="cancelTitleForm">取消</view>
        <view class="primary-action" bindtap="saveTitleForm">保存抬头</view>
      </view>
    </view>
  </view>

  <view class="content-list" wx:if="{{currentSection.type === 'guide'}}">
    <view class="content-card" wx:for="{{guideGroups}}" wx:key="title" wx:for-item="item">
      <view class="content-title">{{item.title}}</view>
      <view class="content-desc">{{item.desc}}</view>
    </view>
  </view>

  <view class="content-list" wx:if="{{currentSection.type === 'faq'}}">
    <view class="content-card" wx:for="{{faqItems}}" wx:key="question" wx:for-item="item">
      <view class="content-title">{{item.question}}</view>
      <view class="content-desc">{{item.answer}}</view>
    </view>
  </view>

  <view class="content-list" wx:if="{{currentSection.type === 'contact'}}">
    <view class="content-card" wx:for="{{contactItems}}" wx:key="title" wx:for-item="item">
      <view class="content-title">{{item.title}}</view>
      <view class="content-desc">{{item.desc}}</view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Replace settings WXSS**

Replace `miniprogram/pages/settings/index.wxss` with:

```css
page {
  background: #F4F7FB;
}

.page {
  padding: 32rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  font-family: Inter, "Noto Sans SC", "PingFang SC", sans-serif;
}

.hero-card,
.title-toolbar,
.empty-card,
.title-card,
.form-card,
.content-card {
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.04);
}

.hero-card {
  padding: 34rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%);
}

.hero-title {
  font-size: 36rpx;
  font-weight: 900;
  color: #1F2937;
}

.hero-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #64748B;
}

.title-toolbar,
.empty-card,
.form-card,
.content-card {
  margin-top: 24rpx;
  padding: 30rpx;
  border-radius: 34rpx;
}

.title-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.toolbar-copy,
.empty-desc,
.content-desc,
.switch-desc {
  font-size: 23rpx;
  line-height: 1.6;
  color: #64748B;
}

.toolbar-copy {
  flex: 1;
  min-width: 0;
}

.primary-action,
.secondary-action {
  min-height: 72rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 900;
}

.primary-action {
  background: #4F46E5;
  color: #FFFFFF;
}

.secondary-action {
  background: #F8FAFC;
  color: #475569;
}

.empty-title,
.form-title,
.content-title,
.title-name {
  font-size: 28rpx;
  font-weight: 900;
  color: #1F2937;
  line-height: 1.4;
}

.empty-desc,
.content-desc {
  margin-top: 10rpx;
}

.title-list,
.content-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 24rpx;
}

.title-card {
  padding: 28rpx;
  border-radius: 32rpx;
}

.title-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.title-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.default-badge {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 20rpx;
  font-weight: 900;
}

.title-meta {
  margin-top: 12rpx;
  font-size: 23rpx;
  line-height: 1.5;
  color: #64748B;
  overflow-wrap: anywhere;
}

.title-actions,
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-top: 22rpx;
}

.text-action {
  font-size: 24rpx;
  font-weight: 900;
  color: #4F46E5;
}

.danger-action {
  color: #D92D20;
}

.field {
  margin-top: 24rpx;
}

.field-label {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  color: #64748B;
  font-weight: 900;
}

.field-input,
.field-textarea {
  width: 100%;
  border-radius: 24rpx;
  background: #F8FAFC;
  border: 2rpx solid #E2E8F0;
  color: #1F2937;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 20rpx 22rpx;
}

.field-input {
  min-height: 82rpx;
}

.field-textarea {
  min-height: 150rpx;
}

.field-input-error {
  border-color: #D92D20;
  color: #D92D20;
}

.field-error {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #D92D20;
}

.switch-row {
  margin-top: 26rpx;
  padding: 24rpx;
  border-radius: 26rpx;
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.switch-title {
  font-size: 25rpx;
  font-weight: 900;
  color: #1F2937;
}

.form-actions {
  justify-content: flex-end;
}
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
node tests/profile-light-settings-behavior.test.js
node tests/ui-redesign-readiness.test.js
node --check miniprogram/pages/settings/index.js
```

Expected: behavior test still FAILS with `export center should support settings mode`; UI readiness advances past settings assertions and fails on export-center assertions; syntax check passes.

- [ ] **Step 5: Commit settings implementation**

Run:

```powershell
git add miniprogram/pages/settings/index.js miniprogram/pages/settings/index.wxml miniprogram/pages/settings/index.wxss
git commit -m "feat: add local invoice title settings"
```

Expected: commit succeeds with only settings files staged.

---

### Task 4: Implement PDF Template Settings Mode

**Files:**
- Modify: `miniprogram/pages/export-center/index.js`
- Modify: `miniprogram/pages/export-center/index.wxml`
- Modify: `miniprogram/pages/export-center/index.wxss`
- Test: `tests/profile-light-settings-behavior.test.js`
- Test: `tests/ui-redesign-readiness.test.js`

- [ ] **Step 1: Add template constants and settings mode to export JS**

In `miniprogram/pages/export-center/index.js`, add these constants above `Page({`:

```js
const PDF_TEMPLATE_STORAGE_KEY = "profilePdfTemplate";

const PDF_TEMPLATE_OPTIONS = [
  {
    id: "original-archive",
    label: "原票归档",
    desc: "默认模板，适合保留原始图片或 PDF。",
  },
  {
    id: "month-archive",
    label: "按月份归档",
    desc: "导出文件名优先按月份组织。",
  },
  {
    id: "simple-list",
    label: "简洁清单",
    desc: "弱化说明，适合快速转发。",
  },
];
```

Add these fields to `data`:

```js
    mode: "normal",
    selectedTemplateId: "original-archive",
    templateOptions: PDF_TEMPLATE_OPTIONS,
```

Replace `onLoad(options)` with:

```js
  onLoad(options) {
    const type = options.type || "pdf";
    const mode = options.mode === "settings" ? "settings" : "normal";
    const scopeType = options.scope || "filtered_result";
    const scopeId = options.scopeId || "";
    const currentView = mode === "settings"
      ? {
          title: "PDF 导出模板",
          subtitle: "选择本地导出偏好，当前版本不改变云端 PDF 生成内容",
        }
      : this.data.viewMap[type] || this.data.viewMap.pdf;
    this.setData({
      currentView,
      selectedFormat: "pdf",
      mode,
      scopeType,
      scopeId,
      selectedTemplateId: this.getSavedTemplateId(),
    });
    if (mode !== "settings") {
      this.fetchExportJobs();
    }
  },
```

Add these methods before `selectFormat(e)`:

```js
  getSavedTemplateId() {
    const savedTemplate = wx.getStorageSync(PDF_TEMPLATE_STORAGE_KEY) || {};
    const matched = PDF_TEMPLATE_OPTIONS.find(
      (item) => item.id === savedTemplate.selectedTemplateId
    );
    return matched ? matched.id : PDF_TEMPLATE_OPTIONS[0].id;
  },
  selectTemplate(e) {
    const selectedTemplateId = e.currentTarget.dataset.id;
    const matched = PDF_TEMPLATE_OPTIONS.find((item) => item.id === selectedTemplateId);
    if (!matched) {
      return;
    }
    wx.setStorageSync(PDF_TEMPLATE_STORAGE_KEY, {
      selectedTemplateId,
      updatedAt: Date.now(),
    });
    this.setData({
      selectedTemplateId,
    });
    wx.showToast({
      title: "已保存模板",
      icon: "success",
    });
  },
```

Replace `onShow()` with:

```js
  onShow() {
    if (this.data.mode === "settings") {
      this.setData({
        selectedTemplateId: this.getSavedTemplateId(),
      });
      return;
    }
    this.fetchExportJobs();
  },
```

- [ ] **Step 2: Update export WXML for settings mode**

In `miniprogram/pages/export-center/index.wxml`, insert this block after the preview card:

```xml
  <view class="section-card" wx:if="{{mode === 'settings'}}">
    <view class="section-title">PDF 导出模板</view>
    <view class="template-list">
      <view
        class="template-card {{selectedTemplateId === item.id ? 'template-card-active' : ''}}"
        wx:for="{{templateOptions}}"
        wx:key="id"
        wx:for-item="item"
        data-id="{{item.id}}"
        bindtap="selectTemplate"
      >
        <view class="template-main">
          <view class="template-title">{{item.label}}</view>
          <view class="template-desc">{{item.desc}}</view>
        </view>
        <view class="template-check" wx:if="{{selectedTemplateId === item.id}}">✓</view>
      </view>
    </view>
  </view>
```

Then add `wx:if="{{mode !== 'settings'}}"` to the existing 导出格式, 导出记录, 导出预设, and bottom action blocks:

```xml
  <view class="section-card" wx:if="{{mode !== 'settings'}}">
```

and:

```xml
  <view class="bottom-actions" wx:if="{{mode !== 'settings'}}">
```

- [ ] **Step 3: Add template styles**

Append to `miniprogram/pages/export-center/index.wxss`:

```css
.template-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 22rpx;
}

.template-card {
  padding: 26rpx;
  border-radius: 28rpx;
  background: #F8FAFC;
  border: 2rpx solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.template-card-active {
  background: #EEF2FF;
  border-color: rgba(79, 70, 229, 0.35);
}

.template-main {
  flex: 1;
  min-width: 0;
}

.template-title {
  font-size: 26rpx;
  color: #1F2937;
  font-weight: 900;
}

.template-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #64748B;
}

.template-check {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: #4F46E5;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 900;
}
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
node tests/profile-light-settings-behavior.test.js
node tests/ui-redesign-readiness.test.js
node --check miniprogram/pages/export-center/index.js
```

Expected: all three commands pass.

- [ ] **Step 5: Commit export template settings**

Run:

```powershell
git add miniprogram/pages/export-center/index.js miniprogram/pages/export-center/index.wxml miniprogram/pages/export-center/index.wxss
git commit -m "feat: add pdf template preference"
```

Expected: commit succeeds with only export-center files staged.

---

### Task 5: Full Verification

**Files:**
- Test only; no intended code changes.

- [ ] **Step 1: Run all syntax checks**

Run:

```powershell
node --check miniprogram/pages/profile/index.js
node --check miniprogram/pages/settings/index.js
node --check miniprogram/pages/export-center/index.js
node --check miniprogram/pages/index/index.js
node --check miniprogram/pages/folder/index.js
node --check miniprogram/pages/manual-entry/index.js
node --check miniprogram/pages/invoice-detail/index.js
```

Expected: every command exits with code `0`.

- [ ] **Step 2: Run all behavior and readiness tests**

Run:

```powershell
node tests/profile-light-settings-behavior.test.js
node tests/ui-redesign-readiness.test.js
node tests/v1-readiness.test.js
node tests/home-stats-behavior.test.js
node tests/folder-filter-behavior.test.js
node tests/invoice-verification-copy.test.js
```

Expected output includes:

```text
profile light settings behavior checks passed
ui redesign readiness checks passed
v1 readiness checks passed
home stats behavior checks passed
folder filter behavior checks passed
invoice verification copy checks passed
```

- [ ] **Step 3: Inspect git status**

Run:

```powershell
git status --short
```

Expected: no unstaged files from this implementation. If unrelated user-owned files appear, leave them unstaged.

- [ ] **Step 4: Manual WeChat Developer Tools QA**

Verify in the mini program:

```text
我的：统计卡显示本地抬头数量、模板数、常用科目数
我的：发票抬头 -> settings?section=title
我的：收票说明与指引 -> settings?section=guide
我的：PDF 导出模板 -> export-center?type=pdf&mode=settings
我的：在线客服打开微信客服入口
我的：常见问题 -> settings?section=faq
我的：联系我们 -> settings?section=contact
发票抬头：新增、编辑、删除、设为默认都能操作
发票抬头：税号格式错误会显示中文错误
PDF 导出模板：三个模板可选，返回我的页后菜单显示当前模板
票夹导出 PDF：原有生成、下载、打开或转发流程不受影响
```

Expected: all flows match the approved spec, with no new unsupported v1 entries.

---

## Plan Self-Review

Spec coverage:

- Profile dynamic stats and support entries are covered by Task 2.
- Local invoice-title CRUD, default rules, validation, guide, FAQ, and contact static sections are covered by Task 3.
- PDF template settings mode and local persistence are covered by Task 4.
- Behavior tests and readiness guards are covered by Task 1 and Task 5.
- Cloud functions and existing invoice flows are intentionally untouched.

Placeholder scan:

- This plan contains no placeholder markers, open-ended implementation steps, or unspecified tests.
- Each code-changing step includes the concrete code block or exact replacement instruction needed.

Type and name consistency:

- Storage keys are consistently `profileInvoiceTitles` and `profilePdfTemplate`.
- Template ids are consistently `original-archive`, `month-archive`, and `simple-list`.
- Page method names used by tests match implementation tasks: `showNewTitleForm`, `handleTitleInput`, `handleDefaultChange`, `saveTitleForm`, `deleteTitle`, `selectTemplate`, and `refreshProfileData`.
