# 票易理 UI/UE 重塑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the v1 visible mini program pages so their content areas closely match `票易理UI设计.html`, while keeping native WeChat navigation/TabBar and removing unsupported product claims.

**Architecture:** Keep business logic and cloud function protocols intact. Make the redesign mostly in WXML/WXSS, add small JS data helpers where the UI needs new display data or existing behavior must be made explicit, and protect the scope with static readiness tests.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, local SVG assets, Node.js static tests with `assert`, existing Tencent Cloud function calls.

---

## File Structure

Modify these existing files:

- `miniprogram/app.wxss`: global page background, font stack, button reset, shared utility tokens.
- `miniprogram/app.json`: keep native navigation and TabBar; verify title/tab labels remain `票易理` / `首页` / `票夹` / `我的`.
- `miniprogram/pages/index/index.js`: add homepage stats fields, icon file references, and a deterministic exportable service jump.
- `miniprogram/pages/index/index.wxml`: replace the basic section layout with the design-source content-area structure: hero, entry cards, core services, info tip.
- `miniprogram/pages/index/index.wxss`: high-fidelity homepage content styling from the design source.
- `miniprogram/pages/folder/index.js`: add current-month filter calculation, URL option support for defaulting to exportable filter, disabled export state, and richer card display fields.
- `miniprogram/pages/folder/index.wxml`: redesign search/filter, stats, invoice cards, and bottom export bar.
- `miniprogram/pages/folder/index.wxss`: match design-source spacing, icons, card hierarchy, selected state, and fixed bottom bar.
- `miniprogram/pages/profile/index.js`: enrich menu item metadata with icon paths and secondary values; remove unsupported PRO-style data.
- `miniprogram/pages/profile/index.wxml`: redesign profile card, stats, grouped menus.
- `miniprogram/pages/profile/index.wxss`: match design-source profile card, menu groups, icon chips.
- `miniprogram/pages/manual-entry/index.wxml`: keep standalone page but restyle the form as the design-source modal content.
- `miniprogram/pages/manual-entry/index.wxss`: compact form, gray fields, primary bottom button.
- `miniprogram/pages/invoice-detail/index.wxml`: redesign hero, info rows, timeline, actions, PDF button.
- `miniprogram/pages/invoice-detail/index.wxss`: detail-page card and status styling.
- `miniprogram/pages/export-center/index.js`: adjust copy to the approved v1 language and keep only PDF format.
- `miniprogram/pages/export-center/index.wxml`: redesign export format, records, presets, bottom actions.
- `miniprogram/pages/export-center/index.wxss`: export-center visual system.

Create these files:

- `miniprogram/images/icons/ui-camera.svg`
- `miniprogram/images/icons/ui-chat.svg`
- `miniprogram/images/icons/ui-gallery.svg`
- `miniprogram/images/icons/ui-edit.svg`
- `miniprogram/images/icons/ui-archive.svg`
- `miniprogram/images/icons/ui-pdf.svg`
- `miniprogram/images/icons/ui-search.svg`
- `miniprogram/images/icons/ui-building.svg`
- `miniprogram/images/icons/ui-guide.svg`
- `miniprogram/images/icons/ui-service.svg`
- `miniprogram/images/icons/ui-question.svg`
- `miniprogram/images/icons/ui-phone.svg`
- `tests/ui-redesign-readiness.test.js`

Do not modify these files unless verification shows a direct need:

- `cloudfunctions/quickstartFunctions/index.js`
- `miniprogram/pages/reimburse/*`
- `miniprogram/pages/reimburse-detail/*`
- `miniprogram/pages/intake-detail/*`

Current worktree note: `test-ocr.js`, `.gitignore`, `.superpowers/`, and `tests/` already have uncommitted or untracked changes. Preserve unrelated content and only stage files touched by this implementation.

---

### Task 1: Add Static UI Redesign Readiness Test

**Files:**
- Create: `tests/ui-redesign-readiness.test.js`
- Test: `tests/ui-redesign-readiness.test.js`

- [ ] **Step 1: Create the failing static test**

Create `tests/ui-redesign-readiness.test.js` with this exact content:

```js
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));

const assertIncludes = (content, expected, label) => {
  assert(content.includes(expected), `${label} must include "${expected}"`);
};

const assertNotIncludes = (content, forbidden, label) => {
  assert(!content.includes(forbidden), `${label} must not include "${forbidden}"`);
};

const requiredIcons = [
  "ui-camera.svg",
  "ui-chat.svg",
  "ui-gallery.svg",
  "ui-edit.svg",
  "ui-archive.svg",
  "ui-pdf.svg",
  "ui-search.svg",
  "ui-building.svg",
  "ui-guide.svg",
  "ui-service.svg",
  "ui-question.svg",
  "ui-phone.svg",
];

requiredIcons.forEach((fileName) => {
  assert(
    exists("miniprogram", "images", "icons", fileName),
    `required icon asset is missing: ${fileName}`
  );
});

const appWxss = read("miniprogram", "app.wxss");
assertIncludes(appWxss, "Inter", "global wxss");
assertIncludes(appWxss, "Noto Sans SC", "global wxss");
assertIncludes(appWxss, "#F4F7FB", "global wxss");

const homeWxml = read("miniprogram", "pages", "index", "index.wxml");
const homeWxss = read("miniprogram", "pages", "index", "index.wxss");
assertIncludes(homeWxml, "home-hero", "home wxml");
assertIncludes(homeWxml, "核心服务", "home wxml");
assertIncludes(homeWxml, "ui-camera.svg", "home wxml");
assertIncludes(homeWxml, "ui-chat.svg", "home wxml");
assertIncludes(homeWxml, "ui-gallery.svg", "home wxml");
assertIncludes(homeWxml, "ui-edit.svg", "home wxml");
assertIncludes(homeWxss, "linear-gradient(135deg, #1e1b4b", "home wxss");
assertIncludes(homeWxss, "section-marker", "home wxss");

const folderJs = read("miniprogram", "pages", "folder", "index.js");
const folderWxml = read("miniprogram", "pages", "folder", "index.wxml");
assertIncludes(folderJs, "getCurrentMonthPrefix", "folder js");
assertNotIncludes(folderJs, 'startsWith("2026-03")', "folder js");
assertIncludes(folderWxml, "ui-search.svg", "folder wxml");
assertIncludes(folderWxml, "export-btn-disabled", "folder wxml");

const profileWxml = read("miniprogram", "pages", "profile", "index.wxml");
assertIncludes(profileWxml, "profile-hero", "profile wxml");
assertIncludes(profileWxml, "menu-icon", "profile wxml");
assertNotIncludes(profileWxml, "PRO", "profile wxml");

const exportCenterJs = read("miniprogram", "pages", "export-center", "index.js");
const exportCenterWxml = read("miniprogram", "pages", "export-center", "index.wxml");
assertIncludes(exportCenterJs, "正在合并原票附件", "export center js");
assertIncludes(exportCenterWxml, "export-preview-card", "export center wxml");
assertNotIncludes(exportCenterJs, "电子签名 L3", "export center js");
assertNotIncludes(exportCenterWxml, "数字证书", "export center wxml");

const allUiContent = [
  read("miniprogram", "pages", "index", "index.wxml"),
  read("miniprogram", "pages", "folder", "index.wxml"),
  read("miniprogram", "pages", "profile", "index.wxml"),
  read("miniprogram", "pages", "manual-entry", "index.wxml"),
  read("miniprogram", "pages", "invoice-detail", "index.wxml"),
  read("miniprogram", "pages", "export-center", "index.wxml"),
  read("miniprogram", "pages", "export-center", "index.js"),
].join("\n");

["PRO 会员", "电子签名 L3", "数字证书安全等级", "导出 Excel", "企业协作"].forEach(
  (token) => assertNotIncludes(allUiContent, token, "redesigned v1 UI")
);

console.log("ui redesign readiness checks passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests/ui-redesign-readiness.test.js
```

Expected: FAIL with `required icon asset is missing: ui-camera.svg`.

- [ ] **Step 3: Commit the failing test**

Run:

```powershell
git add tests/ui-redesign-readiness.test.js
git commit -m "test: add ui redesign readiness checks"
```

Expected: commit succeeds with only `tests/ui-redesign-readiness.test.js` staged.

---

### Task 2: Add Shared Visual Foundation and Icons

**Files:**
- Modify: `miniprogram/app.wxss`
- Create: `miniprogram/images/icons/ui-camera.svg`
- Create: `miniprogram/images/icons/ui-chat.svg`
- Create: `miniprogram/images/icons/ui-gallery.svg`
- Create: `miniprogram/images/icons/ui-edit.svg`
- Create: `miniprogram/images/icons/ui-archive.svg`
- Create: `miniprogram/images/icons/ui-pdf.svg`
- Create: `miniprogram/images/icons/ui-search.svg`
- Create: `miniprogram/images/icons/ui-building.svg`
- Create: `miniprogram/images/icons/ui-guide.svg`
- Create: `miniprogram/images/icons/ui-service.svg`
- Create: `miniprogram/images/icons/ui-question.svg`
- Create: `miniprogram/images/icons/ui-phone.svg`
- Test: `tests/ui-redesign-readiness.test.js`

- [ ] **Step 1: Replace global styles**

Replace `miniprogram/app.wxss` with:

```css
/**app.wxss**/
page {
  background: #F4F7FB;
  color: #1F2937;
  font-family: Inter, "Noto Sans SC", "PingFang SC", system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.container {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

view,
text,
input,
textarea,
picker {
  box-sizing: border-box;
  font-family: Inter, "Noto Sans SC", "PingFang SC", system-ui, sans-serif;
}

button {
  background: initial;
  padding: 0;
  margin: 0;
  border-radius: 0;
  font-family: Inter, "Noto Sans SC", "PingFang SC", system-ui, sans-serif;
}

button:focus {
  outline: 0;
}

button::after {
  border: none;
}
```

- [ ] **Step 2: Create the local SVG icons**

Create each icon file with the following exact content pattern. Use the listed stroke color inside each file.

`miniprogram/images/icons/ui-camera.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="#EDEAFF"/><path d="M17 27c0-4.4 3.6-8 8-8h3.4l2.2-3.2A4 4 0 0 1 33.9 14h4.2a4 4 0 0 1 3.3 1.8L43.6 19H47c4.4 0 8 3.6 8 8v17c0 4.4-3.6 8-8 8H25c-4.4 0-8-3.6-8-8V27Z" stroke="#6D5DFC" stroke-width="4" stroke-linejoin="round"/><circle cx="36" cy="36" r="8" stroke="#6D5DFC" stroke-width="4"/></svg>
```

`miniprogram/images/icons/ui-chat.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="#E8FFF5"/><path d="M14 31c0-10 8.6-18 19.2-18S52 21 52 31s-8.6 18-19.2 18c-3 0-5.8-.6-8.3-1.8L15 50l3-7.4A17 17 0 0 1 14 31Z" stroke="#059669" stroke-width="4" stroke-linejoin="round"/><path d="M25 32h.1M33 32h.1M41 32h.1" stroke="#059669" stroke-width="6" stroke-linecap="round"/></svg>
```

`miniprogram/images/icons/ui-gallery.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="#F3E8FF"/><rect x="14" y="16" width="36" height="32" rx="7" stroke="#7C3AED" stroke-width="4"/><path d="m18 43 10-10 9 9 5-5 8 8" stroke="#7C3AED" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="25" r="3" fill="#7C3AED"/></svg>
```

`miniprogram/images/icons/ui-edit.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="#FFF7ED"/><path d="M18 46h9l22-22a6 6 0 0 0-9-9L18 37v9Z" stroke="#EA580C" stroke-width="4" stroke-linejoin="round"/><path d="m36 19 9 9" stroke="#EA580C" stroke-width="4" stroke-linecap="round"/></svg>
```

`miniprogram/images/icons/ui-archive.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="#EEF2FF"/><path d="M17 25h30v24a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V25Z" stroke="#4F46E5" stroke-width="4" stroke-linejoin="round"/><path d="M22 25v-5a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v5M15 31h34" stroke="#4F46E5" stroke-width="4" stroke-linecap="round"/></svg>
```

`miniprogram/images/icons/ui-pdf.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="#FFF1F2"/><path d="M20 12h18l10 10v30H20a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5Z" stroke="#F43F5E" stroke-width="4" stroke-linejoin="round"/><path d="M38 12v12h10M22 37h20M22 45h14" stroke="#F43F5E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

`miniprogram/images/icons/ui-search.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="18" cy="18" r="10" stroke="#94A3B8" stroke-width="4"/><path d="m26 26 7 7" stroke="#94A3B8" stroke-width="4" stroke-linecap="round"/></svg>
```

`miniprogram/images/icons/ui-building.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#EEF2FF"/><path d="M14 39V12h20v27M10 39h28M19 18h2M27 18h2M19 25h2M27 25h2M20 39v-7h8v7" stroke="#4F46E5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

`miniprogram/images/icons/ui-guide.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#EEF2FF"/><path d="M14 13c4 0 7 .9 10 3 3-2.1 6-3 10-3v24c-4 0-7 .9-10 3-3-2.1-6-3-10-3V13Z" stroke="#4F46E5" stroke-width="3" stroke-linejoin="round"/><path d="M24 16v24" stroke="#4F46E5" stroke-width="3" stroke-linecap="round"/></svg>
```

`miniprogram/images/icons/ui-service.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#EEF2FF"/><circle cx="24" cy="24" r="14" stroke="#4F46E5" stroke-width="3"/><circle cx="24" cy="24" r="6" stroke="#4F46E5" stroke-width="3"/><path d="m14 14 6 6M34 14l-6 6M14 34l6-6M34 34l-6-6" stroke="#4F46E5" stroke-width="3" stroke-linecap="round"/></svg>
```

`miniprogram/images/icons/ui-question.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#EEF2FF"/><circle cx="24" cy="24" r="14" stroke="#4F46E5" stroke-width="3"/><path d="M20 20a4.4 4.4 0 0 1 4.5-4c2.7 0 4.8 1.7 4.8 4 0 2-1.2 3.2-3.2 4.2-1.5.8-2.1 1.6-2.1 3.3" stroke="#4F46E5" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="33" r="1.8" fill="#4F46E5"/></svg>
```

`miniprogram/images/icons/ui-phone.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#EEF2FF"/><path d="M17 13h6l2 7-4 2c2 4 5 7 9 9l2-4 7 2v6c0 2-2 4-4 4-14 0-26-12-26-26 0-2 2-4 4-4Z" stroke="#4F46E5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

- [ ] **Step 3: Run the readiness test**

Run:

```powershell
node tests/ui-redesign-readiness.test.js
```

Expected: FAIL with `home wxml must include "home-hero"`.

- [ ] **Step 4: Commit shared foundations**

Run:

```powershell
git add miniprogram/app.wxss miniprogram/images/icons/ui-*.svg
git commit -m "style: add redesign visual foundations"
```

Expected: commit succeeds with global styles and icon assets only.

---

### Task 3: Redesign Home Page Content Area

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`
- Test: `tests/ui-redesign-readiness.test.js`

- [ ] **Step 1: Update homepage data and service routing**

In `miniprogram/pages/index/index.js`, replace `data` with this shape while preserving `handleEntryTap` and `handleFeatureTap` method names:

```js
data: {
  heroStats: [
    { label: "本月未整理发票", value: "2", unit: "张" },
    { label: "本月录入金额", value: "¥868.69", unit: "" },
  ],
  intakeMethods: [
    {
      id: "ocr",
      title: "智能识别",
      desc: "拍照或相册AI提取",
      icon: "/images/icons/ui-camera.svg",
      badge: "推荐",
      page: "/pages/intake-detail/index?source=ocr",
    },
    {
      id: "chat",
      title: "聊天文件",
      desc: "直接导入微信文件",
      icon: "/images/icons/ui-chat.svg",
      page: "/pages/intake-detail/index?source=chat",
    },
    {
      id: "album",
      title: "手机相册",
      desc: "上传已有发票照片",
      icon: "/images/icons/ui-gallery.svg",
      page: "/pages/intake-detail/index?source=album",
    },
    {
      id: "manual",
      title: "手动录入",
      desc: "无原票或手工记账",
      icon: "/images/icons/ui-edit.svg",
      page: "/pages/manual-entry/index",
    },
  ],
  featureCards: [
    {
      id: "folder",
      title: "票夹归集",
      desc: "发票统一归集，快速检索筛选",
      tag: "智能聚合",
      icon: "/images/icons/ui-archive.svg",
      action: "switchTab",
      page: "/pages/folder/index",
    },
    {
      id: "export",
      title: "原票 PDF",
      desc: "原票附件合并导出，便于归档",
      tag: "极速归档",
      icon: "/images/icons/ui-pdf.svg",
      action: "switchTab",
      page: "/pages/folder/index?filter=ready",
    },
  ],
},
```

Then change `handleFeatureTap` so `wx.switchTab` receives `/pages/folder/index` and stores the desired filter before switching:

```js
handleFeatureTap(e) {
  const { action, page, label } = e.currentTarget.dataset;
  if (action === "switchTab" && page) {
    const [tabPath, query = ""] = page.split("?");
    const params = new URLSearchParams(query);
    const filter = params.get("filter");
    if (filter) {
      wx.setStorageSync("folderDefaultFilter", filter);
    }
    wx.switchTab({
      url: tabPath,
    });
    return;
  }
  if (action === "navigate" && page) {
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
```

- [ ] **Step 2: Replace homepage WXML**

Replace `miniprogram/pages/index/index.wxml` with:

```xml
<view class="home-page">
  <view class="home-hero">
    <view class="hero-glow hero-glow-large"></view>
    <view class="hero-glow hero-glow-small"></view>
    <view class="hero-content">
      <view class="hero-pill">
        <text>智能识别</text>
        <view class="hero-pulse"></view>
      </view>
      <view class="hero-title">让发票整理更从容</view>
      <view class="hero-desc">OCR 录入 · 原票归档 · PDF 合并导出</view>
      <view class="hero-stats">
        <view class="hero-stat" wx:for="{{heroStats}}" wx:key="label" wx:for-item="item">
          <view class="hero-stat-label">{{item.label}}</view>
          <view class="hero-stat-value">
            <text>{{item.value}}</text>
            <text class="hero-stat-unit" wx:if="{{item.unit}}">{{item.unit}}</text>
          </view>
        </view>
      </view>
    </view>
  </view>

  <view class="section-block">
    <view class="section-header">
      <view class="section-title-row">
        <view class="section-marker"></view>
        <view class="section-title">便捷发票录入</view>
      </view>
      <view class="section-side">支持批量上传</view>
    </view>
    <view class="entry-grid">
      <view
        class="entry-card {{item.badge ? 'entry-card-recommended' : ''}}"
        wx:for="{{intakeMethods}}"
        wx:key="id"
        wx:for-item="item"
        bindtap="handleEntryTap"
        data-label="{{item.title}}"
        data-page="{{item.page}}"
      >
        <view class="entry-badge" wx:if="{{item.badge}}">⚡ {{item.badge}}</view>
        <image class="entry-icon" src="{{item.icon}}" mode="aspectFit"></image>
        <view class="entry-title">{{item.title}}</view>
        <view class="entry-desc">{{item.desc}}</view>
      </view>
    </view>
  </view>

  <view class="section-block">
    <view class="section-header">
      <view class="section-title-row">
        <view class="section-marker"></view>
        <view class="section-title">核心服务</view>
      </view>
    </view>
    <view class="service-list">
      <view
        class="service-card"
        wx:for="{{featureCards}}"
        wx:key="id"
        wx:for-item="item"
        bindtap="handleFeatureTap"
        data-action="{{item.action}}"
        data-page="{{item.page}}"
        data-label="{{item.title}}"
      >
        <image class="service-icon" src="{{item.icon}}" mode="aspectFit"></image>
        <view class="service-main">
          <view class="service-title-row">
            <view class="service-title">{{item.title}}</view>
            <view class="service-tag">{{item.tag}}</view>
          </view>
          <view class="service-desc">{{item.desc}}</view>
        </view>
        <view class="service-arrow">›</view>
      </view>
    </view>
  </view>

  <view class="info-card">
    <view class="info-icon">i</view>
    <view class="info-main">
      <view class="info-title">原票 PDF 有什么用？</view>
      <view class="info-desc">电子发票报销时建议同步保留原票附件，票易理可帮助整理并导出原票 PDF 包。</view>
    </view>
  </view>

  <view class="page-spacer"></view>
</view>
```

- [ ] **Step 3: Replace homepage WXSS**

Replace `miniprogram/pages/index/index.wxss` with the homepage styles from the design source translated to rpx. Include the exact selectors asserted by the test:

```css
page {
  background: #F4F7FB;
}

.home-page {
  padding: 32rpx 32rpx 56rpx;
  color: #1F2937;
}

.home-hero {
  position: relative;
  overflow: hidden;
  min-height: 396rpx;
  padding: 40rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 52%, #5548f0 100%);
  box-shadow: 0 30rpx 64rpx rgba(79, 70, 229, 0.18);
}

.hero-glow {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(20rpx);
}

.hero-glow-large {
  right: -70rpx;
  bottom: -80rpx;
  width: 260rpx;
  height: 260rpx;
}

.hero-glow-small {
  right: 180rpx;
  top: 52rpx;
  width: 60rpx;
  height: 60rpx;
  background: rgba(99, 102, 241, 0.28);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  font-size: 26rpx;
  font-weight: 800;
}

.hero-pulse {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.45);
}

.hero-title {
  margin-top: 22rpx;
  font-size: 50rpx;
  line-height: 1.18;
  font-weight: 900;
  color: #FFFFFF;
}

.hero-desc {
  margin-top: 18rpx;
  font-size: 28rpx;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 700;
}

.hero-stats {
  display: flex;
  margin-top: 48rpx;
  padding: 30rpx 0;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
}

.hero-stat {
  flex: 1;
  padding: 0 28rpx;
}

.hero-stat + .hero-stat {
  border-left: 2rpx solid rgba(255, 255, 255, 0.16);
}

.hero-stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

.hero-stat-value {
  margin-top: 14rpx;
  color: #FFFFFF;
  font-size: 46rpx;
  line-height: 1;
  font-weight: 900;
}

.hero-stat-unit {
  margin-left: 10rpx;
  font-size: 28rpx;
}

.section-block {
  margin-top: 42rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.section-marker {
  width: 8rpx;
  height: 40rpx;
  border-radius: 999rpx;
  background: #635BFF;
  box-shadow: 0 0 0 8rpx rgba(99, 91, 255, 0.08);
}

.section-title {
  font-size: 34rpx;
  line-height: 1.2;
  font-weight: 900;
  color: #1F2937;
}

.section-side {
  font-size: 24rpx;
  color: #94A3B8;
  font-weight: 700;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28rpx;
}

.entry-card {
  position: relative;
  min-height: 214rpx;
  padding: 34rpx 32rpx 28rpx;
  border-radius: 42rpx;
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.035);
}

.entry-card-recommended {
  border-color: #C7D2FE;
  box-shadow: 0 22rpx 46rpx rgba(79, 70, 229, 0.08);
}

.entry-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 8rpx 18rpx;
  border-radius: 0 42rpx 0 22rpx;
  background: linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%);
  color: #FFFFFF;
  font-size: 20rpx;
  font-weight: 900;
}

.entry-icon {
  width: 104rpx;
  height: 104rpx;
  display: block;
  margin-bottom: 18rpx;
}

.entry-title {
  font-size: 32rpx;
  line-height: 1.2;
  font-weight: 900;
  color: #1F2937;
}

.entry-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.35;
  color: #8DA0BB;
  font-weight: 700;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.service-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 32rpx;
  border-radius: 42rpx;
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.035);
}

.service-icon {
  width: 104rpx;
  height: 104rpx;
  flex-shrink: 0;
}

.service-main {
  flex: 1;
  min-width: 0;
}

.service-title-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.service-title {
  font-size: 32rpx;
  line-height: 1.2;
  font-weight: 900;
  color: #1F2937;
}

.service-tag {
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 22rpx;
  font-weight: 800;
}

.service-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8DA0BB;
  line-height: 1.4;
  font-weight: 700;
}

.service-arrow {
  color: #94A3B8;
  font-size: 54rpx;
  font-weight: 300;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  margin-top: 42rpx;
  padding: 26rpx;
  border-radius: 32rpx;
  background: rgba(238, 242, 255, 0.68);
  border: 2rpx solid #E0E7FF;
}

.info-icon {
  width: 38rpx;
  height: 38rpx;
  border-radius: 12rpx;
  background: #FFFFFF;
  color: #4F46E5;
  font-size: 24rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 18rpx rgba(79, 70, 229, 0.08);
}

.info-main {
  flex: 1;
}

.info-title {
  font-size: 24rpx;
  font-weight: 900;
  color: #1E1B4B;
}

.info-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: rgba(67, 56, 202, 0.72);
}

.page-spacer {
  height: 40rpx;
}
```

- [ ] **Step 4: Run homepage checks**

Run:

```powershell
node --check miniprogram/pages/index/index.js
node tests/ui-redesign-readiness.test.js
```

Expected: `node --check` passes; UI readiness now fails on folder assertions.

- [ ] **Step 5: Commit homepage redesign**

Run:

```powershell
git add miniprogram/pages/index/index.js miniprogram/pages/index/index.wxml miniprogram/pages/index/index.wxss
git commit -m "feat: redesign home content area"
```

Expected: commit succeeds with homepage files only.

---

### Task 4: Redesign Folder Page and Preserve Export Behavior

**Files:**
- Modify: `miniprogram/pages/folder/index.js`
- Modify: `miniprogram/pages/folder/index.wxml`
- Modify: `miniprogram/pages/folder/index.wxss`
- Test: `tests/ui-redesign-readiness.test.js`
- Test: `tests/v1-readiness.test.js`

- [ ] **Step 1: Add current-month filtering and default filter support**

In `miniprogram/pages/folder/index.js`, add these methods inside `Page({ ... })` before `onShow`:

```js
onLoad() {
  const defaultFilter = wx.getStorageSync("folderDefaultFilter");
  if (defaultFilter) {
    wx.removeStorageSync("folderDefaultFilter");
    this.setData({
      activeFilter: defaultFilter,
    });
  }
},
getCurrentMonthPrefix() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
},
```

Then replace the month branch in `applyFilter` with:

```js
if (filterId === "month") {
  const currentMonthPrefix = this.getCurrentMonthPrefix();
  invoices = allInvoices.filter((item) =>
    String(item.date || "").startsWith(currentMonthPrefix)
  );
}
```

Then change the ready branch to require original attachments:

```js
if (filterId === "ready") {
  invoices = allInvoices.filter(
    (item) => item.hasOriginalAttachment && item.exportStatus !== "exported"
  );
}
```

- [ ] **Step 2: Add richer invoice fields**

In `normalizeInvoice` and `normalizeLocalInvoice`, add:

```js
typeIcon: invoice.hasOriginalAttachment ? "/images/icons/ui-pdf.svg" : "/images/icons/ui-archive.svg",
```

For local drafts use:

```js
typeIcon: "/images/icons/ui-archive.svg",
```

In `buildSummaryCards`, return labels exactly:

```js
return [
  { label: "待整理", value: String(pendingCount) },
  { label: "本月金额", value: this.formatAmount(amountTotal) },
  { label: "已选待导", value: String(this.data.selectedCount || 0) },
];
```

After `toggleInvoice` calculates `selectedCount`, call:

```js
this.setData({
  invoices,
  selectedCount,
  summaryCards: this.buildSummaryCards(this.data.allInvoices),
});
```

- [ ] **Step 3: Replace folder WXML**

Replace `miniprogram/pages/folder/index.wxml` with:

```xml
<view class="folder-page">
  <view class="filter-card">
    <view class="search-row">
      <view class="search-shell">
        <image class="search-icon" src="/images/icons/ui-search.svg" mode="aspectFit"></image>
        <input class="search-input" placeholder="搜索发票名称、抬头、金额..." value="{{searchKeyword}}" bindinput="handleSearchInput" />
      </view>
      <view class="filter-trigger" bindtap="toggleFilterPanel">筛选</view>
    </view>
    <view class="filter-tabs">
      <view
        class="filter-tab {{activeFilter === item.id ? 'filter-tab-active' : ''}}"
        wx:for="{{filters}}"
        wx:key="id"
        wx:for-item="item"
        data-id="{{item.id}}"
        bindtap="selectFilter"
      >
        {{item.label}}
      </view>
    </view>
  </view>

  <view class="filter-panel-mask" wx:if="{{showFilterPanel}}" bindtap="closeFilterPanel"></view>
  <view class="filter-panel" wx:if="{{showFilterPanel}}">
    <view class="filter-panel-header">
      <view class="filter-panel-title">票夹筛选</view>
      <view class="filter-panel-close" bindtap="closeFilterPanel">关闭</view>
    </view>
    <view class="filter-panel-options">
      <view
        class="filter-panel-option {{activeFilter === item.id ? 'filter-panel-option-active' : ''}}"
        wx:for="{{filters}}"
        wx:key="id"
        wx:for-item="item"
        data-id="{{item.id}}"
        bindtap="applyPanelFilter"
      >
        {{item.label}}
      </view>
    </view>
    <view class="filter-panel-actions">
      <view class="filter-panel-reset" bindtap="resetAllFilters">重置条件</view>
      <view class="filter-panel-confirm" bindtap="closeFilterPanel">完成</view>
    </view>
  </view>

  <view class="summary-grid">
    <view class="summary-card" wx:for="{{summaryCards}}" wx:key="label" wx:for-item="item">
      <view class="summary-label">{{item.label}}</view>
      <view class="summary-value">{{item.value}}</view>
    </view>
  </view>

  <view class="invoice-list">
    <view class="empty-card" wx:if="{{!invoices.length}}">
      <view class="empty-title">没有匹配的发票</view>
      <view class="empty-desc">试试调整搜索关键词或筛选条件。</view>
    </view>
    <view
      wx:if="{{invoices.length}}"
      class="invoice-card {{item.selected ? 'invoice-card-selected' : ''}}"
      wx:for="{{invoices}}"
      wx:key="id"
      wx:for-item="item"
      data-id="{{item.id}}"
      bindtap="openInvoiceDetail"
    >
      <view class="invoice-top">
        <view class="invoice-type-group">
          <view class="selection-mark {{item.selected ? 'selection-mark-active' : ''}}" data-id="{{item.id}}" catchtap="toggleInvoice">✓</view>
          <view class="invoice-chip">{{item.type}}</view>
          <view class="invoice-chip invoice-chip-light">{{item.source}}</view>
        </view>
        <view class="invoice-amount">{{item.amount}}</view>
      </view>
      <view class="invoice-title">{{item.title}}</view>
      <view class="invoice-meta">{{item.date}} · {{item.owner}}</view>
      <view class="tag-row">
        <view class="status-tag" wx:for="{{item.tags}}" wx:key="*this" wx:for-item="tag">{{tag}}</view>
      </view>
      <view class="detail-link">查看详情</view>
    </view>
  </view>

  <view class="bottom-bar">
    <view class="selection-summary">已选 <text>{{selectedCount}}</text> 张</view>
    <view class="export-btn {{selectedCount === 0 ? 'export-btn-disabled' : ''}}" data-label="导出 PDF" bindtap="handleAction">导出 PDF</view>
  </view>
</view>
```

- [ ] **Step 4: Replace folder WXSS**

Replace `miniprogram/pages/folder/index.wxss` with styling that includes these exact key selectors:

```css
page {
  background: #F4F7FB;
}

.folder-page {
  padding: 24rpx 32rpx 190rpx;
}

.filter-card,
.summary-card,
.invoice-card,
.empty-card,
.filter-panel {
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.04);
}

.filter-card {
  padding: 28rpx;
  border-radius: 36rpx;
}

.search-row {
  display: flex;
  gap: 18rpx;
}

.search-shell {
  flex: 1;
  height: 76rpx;
  border-radius: 24rpx;
  background: #F8FAFC;
  border: 2rpx solid #EDF2F7;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 20rpx;
}

.search-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 76rpx;
  font-size: 24rpx;
  color: #1F2937;
}

.filter-trigger {
  width: 108rpx;
  height: 76rpx;
  border-radius: 24rpx;
  color: #4F46E5;
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 22rpx;
}

.filter-tab {
  height: 58rpx;
  border-radius: 18rpx;
  background: #F8FAFC;
  color: #64748B;
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-tab-active {
  background: #4F46E5;
  color: #FFFFFF;
  box-shadow: 0 12rpx 28rpx rgba(79, 70, 229, 0.16);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 24rpx;
}

.summary-card {
  padding: 24rpx 16rpx;
  border-radius: 30rpx;
  text-align: center;
}

.summary-label {
  font-size: 22rpx;
  color: #94A3B8;
  font-weight: 800;
}

.summary-value {
  margin-top: 10rpx;
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 900;
}

.invoice-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 24rpx;
}

.invoice-card {
  padding: 30rpx;
  border-radius: 36rpx;
}

.invoice-card-selected {
  border-color: rgba(79, 70, 229, 0.3);
  box-shadow: 0 24rpx 48rpx rgba(79, 70, 229, 0.08);
}

.invoice-top {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
}

.invoice-type-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}

.selection-mark {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: #E2E8F0;
  color: transparent;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.selection-mark-active {
  background: linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%);
  color: #FFFFFF;
}

.invoice-chip,
.status-tag {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 20rpx;
  font-weight: 800;
}

.invoice-chip-light,
.status-tag {
  background: #F8FAFC;
  color: #64748B;
}

.invoice-amount {
  color: #4F46E5;
  font-size: 32rpx;
  line-height: 1.2;
  font-weight: 900;
}

.invoice-title {
  margin-top: 20rpx;
  font-size: 30rpx;
  line-height: 1.4;
  font-weight: 900;
  color: #1F2937;
}

.invoice-meta {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #8DA0BB;
  font-weight: 700;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.detail-link {
  margin-top: 18rpx;
  font-size: 22rpx;
  color: #4F46E5;
  font-weight: 800;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 22rpx 32rpx calc(env(safe-area-inset-bottom) + 22rpx);
  background: rgba(255, 255, 255, 0.96);
  border-top: 2rpx solid #EEF2F7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  box-shadow: 0 -16rpx 34rpx rgba(15, 23, 42, 0.08);
}

.selection-summary {
  color: #64748B;
  font-size: 24rpx;
  font-weight: 800;
}

.selection-summary text {
  color: #4F46E5;
}

.export-btn {
  width: 220rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: #4F46E5;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 900;
  box-shadow: 0 16rpx 30rpx rgba(79, 70, 229, 0.22);
}

.export-btn-disabled {
  background: #CBD5E1;
  box-shadow: none;
}

.empty-card,
.filter-panel {
  border-radius: 36rpx;
  padding: 40rpx;
}

.empty-title,
.filter-panel-title {
  font-size: 30rpx;
  font-weight: 900;
  color: #1F2937;
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8DA0BB;
}

.filter-panel-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.28);
  z-index: 20;
}

.filter-panel {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  top: 180rpx;
  z-index: 21;
}

.filter-panel-header,
.filter-panel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
}

.filter-panel-close {
  color: #64748B;
  font-size: 24rpx;
}

.filter-panel-options {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 24rpx;
}

.filter-panel-option {
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: #F8FAFC;
  color: #64748B;
  font-size: 24rpx;
}

.filter-panel-option-active {
  background: #4F46E5;
  color: #FFFFFF;
}

.filter-panel-actions {
  margin-top: 30rpx;
}

.filter-panel-reset,
.filter-panel-confirm {
  flex: 1;
  height: 76rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 800;
}

.filter-panel-reset {
  background: #F1F5F9;
  color: #475569;
}

.filter-panel-confirm {
  background: #4F46E5;
  color: #FFFFFF;
}
```

- [ ] **Step 5: Guard disabled export behavior**

In `exportSelectedPdf`, keep the existing no-selection toast. The visual disabled state does not replace the existing guard:

```js
if (!selectedInvoices.length) {
  wx.showToast({ title: "请先勾选要导出的发票", icon: "none" });
  return;
}
```

- [ ] **Step 6: Run folder checks**

Run:

```powershell
node --check miniprogram/pages/folder/index.js
node tests/ui-redesign-readiness.test.js
node tests/v1-readiness.test.js
```

Expected: folder syntax passes; UI readiness now fails on profile or export-center assertions; v1 readiness passes.

- [ ] **Step 7: Commit folder redesign**

Run:

```powershell
git add miniprogram/pages/folder/index.js miniprogram/pages/folder/index.wxml miniprogram/pages/folder/index.wxss
git commit -m "feat: redesign invoice folder workspace"
```

Expected: commit succeeds with folder files only.

---

### Task 5: Redesign Profile Page

**Files:**
- Modify: `miniprogram/pages/profile/index.js`
- Modify: `miniprogram/pages/profile/index.wxml`
- Modify: `miniprogram/pages/profile/index.wxss`
- Test: `tests/ui-redesign-readiness.test.js`
- Test: `tests/v1-readiness.test.js`

- [ ] **Step 1: Replace profile data**

In `miniprogram/pages/profile/index.js`, replace `data` with:

```js
data: {
  profileStats: [
    { label: "常用抬头", value: "2" },
    { label: "导出模板", value: "5" },
    { label: "常用科目", value: "9" },
  ],
  menuGroups: [
    {
      id: "invoice",
      title: "发票资料",
      items: [
        {
          label: "发票抬头",
          value: "已设2个",
          icon: "/images/icons/ui-building.svg",
          page: "/pages/settings/index?section=title",
        },
        {
          label: "收票说明与指引",
          value: "",
          icon: "/images/icons/ui-guide.svg",
          page: "/pages/settings/index?section=email",
        },
      ],
    },
    {
      id: "export",
      title: "导出设置",
      items: [
        {
          label: "PDF 导出模板",
          value: "默认单栏",
          icon: "/images/icons/ui-pdf.svg",
          page: "/pages/export-center/index?type=pdf",
        },
      ],
    },
    {
      id: "support",
      title: "服务支持",
      items: [
        { label: "在线客服", value: "", icon: "/images/icons/ui-service.svg" },
        { label: "常见问题", value: "", icon: "/images/icons/ui-question.svg" },
        { label: "联系我们", value: "", icon: "/images/icons/ui-phone.svg" },
      ],
    },
  ],
},
```

- [ ] **Step 2: Replace profile WXML**

Replace `miniprogram/pages/profile/index.wxml` with:

```xml
<view class="profile-page">
  <view class="profile-hero">
    <view class="profile-glow"></view>
    <view class="profile-main-row">
      <view class="profile-avatar">票</view>
      <view class="profile-main">
        <view class="profile-name">票易理</view>
        <view class="profile-subtitle">发票收集与原票 PDF 归档</view>
      </view>
    </view>
    <view class="profile-stat-grid">
      <view class="profile-stat" wx:for="{{profileStats}}" wx:key="label" wx:for-item="item">
        <view class="profile-stat-value">{{item.value}}</view>
        <view class="profile-stat-label">{{item.label}}</view>
      </view>
    </view>
  </view>

  <view class="menu-group" wx:for="{{menuGroups}}" wx:key="id" wx:for-item="group">
    <view class="menu-group-title">{{group.title}}</view>
    <view
      class="menu-item"
      wx:for="{{group.items}}"
      wx:key="label"
      wx:for-item="entry"
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
  </view>
</view>
```

- [ ] **Step 3: Replace profile WXSS**

Replace `miniprogram/pages/profile/index.wxss` with a deep card and grouped menu implementation containing these selectors:

```css
page {
  background: #F4F7FB;
}

.profile-page {
  padding: 32rpx;
}

.profile-hero {
  position: relative;
  overflow: hidden;
  padding: 40rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #4338CA 0%, #1E1B4B 100%);
  color: #FFFFFF;
  box-shadow: 0 30rpx 64rpx rgba(79, 70, 229, 0.18);
}

.profile-glow {
  position: absolute;
  right: -70rpx;
  top: -70rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(18rpx);
}

.profile-main-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.profile-avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42rpx;
  font-weight: 900;
}

.profile-main {
  flex: 1;
}

.profile-name {
  font-size: 36rpx;
  font-weight: 900;
}

.profile-subtitle {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
}

.profile-stat-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 38rpx;
  padding-top: 30rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.profile-stat {
  padding: 16rpx 6rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
  text-align: center;
}

.profile-stat-value {
  font-size: 34rpx;
  font-weight: 900;
}

.profile-stat-label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.72);
}

.menu-group {
  margin-top: 32rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.04);
}

.menu-group-title {
  padding: 22rpx 32rpx;
  border-bottom: 2rpx solid #F1F5F9;
  color: #94A3B8;
  font-size: 22rpx;
  font-weight: 900;
}

.menu-item {
  min-height: 106rpx;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 22rpx;
  border-bottom: 2rpx solid #F1F5F9;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}

.menu-main {
  flex: 1;
}

.menu-label {
  font-size: 26rpx;
  color: #334155;
  font-weight: 900;
}

.menu-value {
  padding: 6rpx 14rpx;
  border-radius: 10rpx;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 20rpx;
  font-weight: 800;
}

.menu-arrow {
  color: #CBD5E1;
  font-size: 44rpx;
}
```

- [ ] **Step 4: Run profile checks**

Run:

```powershell
node --check miniprogram/pages/profile/index.js
node tests/ui-redesign-readiness.test.js
node tests/v1-readiness.test.js
```

Expected: profile syntax passes; UI readiness now fails on export-center assertions; v1 readiness passes.

- [ ] **Step 5: Commit profile redesign**

Run:

```powershell
git add miniprogram/pages/profile/index.js miniprogram/pages/profile/index.wxml miniprogram/pages/profile/index.wxss
git commit -m "feat: redesign profile content area"
```

Expected: commit succeeds with profile files only.

---

### Task 6: Redesign Manual Entry, Invoice Detail, and Export Center

**Files:**
- Modify: `miniprogram/pages/manual-entry/index.wxml`
- Modify: `miniprogram/pages/manual-entry/index.wxss`
- Modify: `miniprogram/pages/invoice-detail/index.wxml`
- Modify: `miniprogram/pages/invoice-detail/index.wxss`
- Modify: `miniprogram/pages/export-center/index.js`
- Modify: `miniprogram/pages/export-center/index.wxml`
- Modify: `miniprogram/pages/export-center/index.wxss`
- Test: `tests/ui-redesign-readiness.test.js`
- Test: `tests/v1-readiness.test.js`

- [ ] **Step 1: Restyle manual-entry WXML**

Replace only the structure in `miniprogram/pages/manual-entry/index.wxml`, keeping all existing `bindinput`, `bindchange`, `data-field`, picker ranges, and submit binding:

```xml
<view class="manual-page">
  <view class="manual-sheet">
    <view class="sheet-handle"></view>
    <view class="sheet-header">
      <view>
        <view class="sheet-title">{{pageTitle}}</view>
        <view class="sheet-subtitle">{{pageDesc}}</view>
      </view>
    </view>

    <view class="form-section">
      <view class="section-title">核心字段</view>
      <view class="field">
        <view class="field-label">发票标题</view>
        <input class="field-input {{errors.title ? 'field-input-error' : ''}}" placeholder="例如：信息服务 · 软件订阅" data-field="title" bindinput="handleInput" value="{{form.title}}" />
        <view class="field-error" wx:if="{{errors.title}}">{{errors.title}}</view>
      </view>
      <view class="field field-grid">
        <view class="field-half">
          <view class="field-label">开票日期</view>
          <picker mode="date" value="{{form.issueDate}}" bindchange="handleDateChange">
            <view class="picker-value {{errors.issueDate ? 'field-input-error' : ''}}">{{form.issueDate}}</view>
          </picker>
          <view class="field-error" wx:if="{{errors.issueDate}}">{{errors.issueDate}}</view>
        </view>
        <view class="field-half">
          <view class="field-label">发票金额</view>
          <input class="field-input {{errors.amount ? 'field-input-error' : ''}}" type="digit" placeholder="0.00" data-field="amount" bindinput="handleInput" value="{{form.amount}}" />
          <view class="field-error" wx:if="{{errors.amount}}">{{errors.amount}}</view>
        </view>
      </view>
      <view class="field">
        <view class="field-label">发票类型</view>
        <picker range="{{invoiceTypeOptions}}" range-key="label" value="{{invoiceTypeIndex}}" bindchange="handleInvoiceTypeChange">
          <view class="picker-value">{{invoiceTypeOptions[invoiceTypeIndex].label}}</view>
        </picker>
      </view>
      <view class="field">
        <view class="field-label">录入来源</view>
        <picker range="{{sourceOptions}}" range-key="label" value="{{sourceIndex}}" bindchange="handleSourceChange">
          <view class="picker-value">{{sourceOptions[sourceIndex].label}}</view>
        </picker>
      </view>
    </view>

    <view class="form-section">
      <view class="section-title">补充信息</view>
      <view class="field">
        <view class="field-label">购买方</view>
        <input class="field-input" placeholder="抬头名称或个人姓名" data-field="buyerName" bindinput="handleInput" value="{{form.buyerName}}" />
      </view>
      <view class="field">
        <view class="field-label">销售方</view>
        <input class="field-input" placeholder="开票方名称" data-field="sellerName" bindinput="handleInput" value="{{form.sellerName}}" />
      </view>
      <view class="field field-grid">
        <view class="field-half">
          <view class="field-label">发票代码</view>
          <input class="field-input" placeholder="可选" data-field="invoiceCode" bindinput="handleInput" value="{{form.invoiceCode}}" />
        </view>
        <view class="field-half">
          <view class="field-label">发票号码</view>
          <input class="field-input" placeholder="可选" data-field="invoiceNumber" bindinput="handleInput" value="{{form.invoiceNumber}}" />
        </view>
      </view>
      <view class="field">
        <view class="field-label">费用分类</view>
        <input class="field-input" placeholder="例如：信息服务、差旅、餐饮" data-field="category" bindinput="handleInput" value="{{form.category}}" />
      </view>
      <view class="field">
        <view class="field-label">备注</view>
        <textarea class="field-textarea" placeholder="填写用途、归档说明或特殊备注" data-field="remark" bindinput="handleInput">{{form.remark}}</textarea>
      </view>
    </view>
  </view>

  <view class="submit-bar">
    <view class="submit-btn {{submitting ? 'submit-btn-disabled' : ''}}" bindtap="handleSubmit">
      {{submitting ? '保存中...' : (mode === 'edit' ? '更新发票' : '保存到票夹')}}
    </view>
  </view>
</view>
```

- [ ] **Step 2: Restyle manual-entry WXSS**

Replace `miniprogram/pages/manual-entry/index.wxss` with compact sheet/form styles matching the design-source modal:

```css
page {
  background: #F4F7FB;
}

.manual-page {
  padding: 24rpx 32rpx 170rpx;
}

.manual-sheet,
.form-section {
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.04);
}

.manual-sheet {
  border-radius: 48rpx;
  overflow: hidden;
}

.sheet-handle {
  width: 84rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: #E2E8F0;
  margin: 22rpx auto;
}

.sheet-header {
  padding: 0 36rpx 28rpx;
  border-bottom: 2rpx solid #F1F5F9;
}

.sheet-title {
  font-size: 34rpx;
  color: #1F2937;
  font-weight: 900;
}

.sheet-subtitle {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8DA0BB;
  line-height: 1.5;
}

.form-section {
  margin: 28rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  box-shadow: none;
}

.section-title {
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 900;
}

.field {
  margin-top: 24rpx;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.field-label {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  color: #64748B;
  font-weight: 900;
}

.field-input,
.picker-value,
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

.field-input,
.picker-value {
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

.submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 22rpx 32rpx calc(env(safe-area-inset-bottom) + 22rpx);
  background: rgba(255, 255, 255, 0.96);
  border-top: 2rpx solid #EEF2F7;
}

.submit-btn {
  height: 88rpx;
  border-radius: 28rpx;
  background: #4F46E5;
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18rpx 36rpx rgba(79, 70, 229, 0.22);
}

.submit-btn-disabled {
  opacity: 0.6;
}
```

- [ ] **Step 3: Restyle invoice detail**

Keep the existing data bindings in `invoice-detail/index.wxml`, but use these section classes:

```xml
<view class="detail-page">
  <view class="detail-hero">
    <view class="amount">{{invoice.amount}}</view>
    <view class="title">{{invoice.title}}</view>
    <view class="tag-row">
      <view class="tag" wx:for="{{invoice.statusTags}}" wx:key="*this">{{item}}</view>
    </view>
  </view>

  <view class="section-card">
    <view class="section-title">发票信息</view>
    <view class="info-list">
      <view class="info-row"><view class="label">发票类型</view><view class="value">{{invoice.type}}</view></view>
      <view class="info-row"><view class="label">发票代码</view><view class="value">{{invoice.code}}</view></view>
      <view class="info-row"><view class="label">发票号码</view><view class="value">{{invoice.number}}</view></view>
      <view class="info-row"><view class="label">开票日期</view><view class="value">{{invoice.date}}</view></view>
      <view class="info-row"><view class="label">购买方</view><view class="value">{{invoice.buyer}}</view></view>
      <view class="info-row"><view class="label">销售方</view><view class="value">{{invoice.seller}}</view></view>
      <view class="info-row"><view class="label">录入来源</view><view class="value">{{invoice.source}}</view></view>
    </view>
  </view>

  <view class="section-card">
    <view class="section-title">流转记录</view>
    <view class="timeline">
      <view class="timeline-item" wx:for="{{timeline}}" wx:key="title" wx:for-item="item">
        <view class="timeline-dot"></view>
        <view class="timeline-main">
          <view class="timeline-title">{{item.title}}</view>
          <view class="timeline-meta">{{item.meta}}</view>
        </view>
      </view>
    </view>
  </view>

  <view class="section-card">
    <view class="section-title">发票操作</view>
    <view class="action-list">
      <view class="action-item" bindtap="handleEdit">
        <view class="action-label">编辑发票</view>
        <view class="action-value">修改字段</view>
      </view>
      <view class="action-item action-item-danger" bindtap="handleDelete">
        <view class="action-label">删除发票</view>
        <view class="action-value">从票夹移除</view>
      </view>
    </view>
  </view>

  <view class="bottom-actions">
    <view class="secondary-btn" wx:if="{{invoice.hasOriginalAttachment && !isLocalDraft}}" data-label="导出 PDF" bindtap="handleTap">导出 PDF</view>
  </view>
</view>
```

For `invoice-detail/index.wxss`, reuse the visual tokens from the manual page and set `.detail-hero` to:

```css
.detail-hero {
  padding: 42rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%);
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.04);
}
```

Keep `.amount`, `.title`, `.tag`, `.section-card`, `.info-row`, `.timeline-dot`, `.action-item-danger`, and `.bottom-actions` styled with the same colors and rounded cards from previous tasks.

- [ ] **Step 4: Update export center copy**

In `miniprogram/pages/export-center/index.js`, set:

```js
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
presets: [
  "按月份命名文件",
  "图片发票每页排放两张",
  "原始 PDF 发票保留原页内容",
],
```

- [ ] **Step 5: Replace export center WXML**

Replace `miniprogram/pages/export-center/index.wxml` with:

```xml
<view class="export-page">
  <view class="export-preview-card">
    <view class="preview-title">{{currentView.title}}</view>
    <view class="preview-subtitle">{{currentView.subtitle}}</view>
    <view class="preview-sheet">
      <view class="sheet-line sheet-line-title"></view>
      <view class="sheet-grid">
        <view></view><view></view><view></view><view></view>
      </view>
      <view class="sheet-table">
        <view></view><view></view><view></view>
      </view>
    </view>
  </view>

  <view class="section-card">
    <view class="section-title">导出格式</view>
    <view class="format-row">
      <view
        class="format-pill {{selectedFormat === item.value ? 'format-pill-active' : ''}}"
        wx:for="{{formatOptions}}"
        wx:key="value"
        wx:for-item="item"
        data-value="{{item.value}}"
        bindtap="selectFormat"
      >
        {{item.label}}
      </view>
    </view>
  </view>

  <view class="section-card">
    <view class="section-title">导出记录</view>
    <view class="task-list">
      <view class="task-item" wx:if="{{!exportTasks.length}}">
        <view>
          <view class="task-title">暂无导出记录</view>
          <view class="task-desc">已生成的 PDF 会在这里显示。</view>
        </view>
      </view>
      <view class="task-item" wx:for="{{exportTasks}}" wx:key="title" wx:for-item="item">
        <view>
          <view class="task-title">{{item.title}}</view>
          <view class="task-desc">{{item.desc}}</view>
        </view>
        <view class="task-status">{{item.status}}</view>
      </view>
    </view>
  </view>

  <view class="section-card">
    <view class="section-title">导出预设</view>
    <view class="preset-list">
      <view class="preset-item" wx:for="{{presets}}" wx:key="*this" wx:for-item="item">{{item}}</view>
    </view>
  </view>

  <view class="bottom-actions">
    <view class="secondary-btn" data-label="刷新记录" bindtap="handleTap">{{loading ? '刷新中...' : '刷新记录'}}</view>
    <view class="primary-btn" data-label="生成 PDF" bindtap="handleTap">{{creating ? '生成中...' : '生成 PDF'}}</view>
  </view>
</view>
```

- [ ] **Step 6: Replace export center WXSS**

Replace `miniprogram/pages/export-center/index.wxss` with:

```css
page {
  background: #F4F7FB;
}

.export-page {
  padding: 24rpx 32rpx 180rpx;
}

.export-preview-card,
.section-card {
  padding: 34rpx;
  border-radius: 42rpx;
  background: #FFFFFF;
  border: 2rpx solid #E8EDF5;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.04);
}

.preview-title,
.section-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #1F2937;
}

.preview-subtitle {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #8DA0BB;
}

.preview-sheet {
  margin-top: 28rpx;
  padding: 34rpx;
  border-radius: 18rpx;
  background: #FFFFFF;
  border: 2rpx solid #CBD5E1;
  box-shadow: 0 14rpx 28rpx rgba(15, 23, 42, 0.08);
}

.sheet-line-title {
  height: 24rpx;
  background: #1F2937;
  border-radius: 999rpx;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.sheet-grid view,
.sheet-table view {
  height: 20rpx;
  border-radius: 999rpx;
  background: #E2E8F0;
}

.sheet-table {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 28rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #F8FAFC;
}

.section-card {
  margin-top: 24rpx;
}

.format-row,
.task-list,
.preset-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 22rpx;
}

.format-pill {
  align-self: flex-start;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: #F8FAFC;
  color: #64748B;
  font-size: 24rpx;
  font-weight: 800;
}

.format-pill-active {
  background: #4F46E5;
  color: #FFFFFF;
}

.task-item,
.preset-item {
  padding: 24rpx;
  border-radius: 26rpx;
  background: #F8FAFC;
}

.task-item {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
}

.task-title {
  font-size: 26rpx;
  color: #1F2937;
  font-weight: 900;
}

.task-desc,
.preset-item {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #64748B;
}

.task-status {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #4F46E5;
  font-weight: 800;
}

.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 22rpx 32rpx calc(env(safe-area-inset-bottom) + 22rpx);
  background: rgba(255, 255, 255, 0.96);
  border-top: 2rpx solid #EEF2F7;
  display: flex;
  gap: 18rpx;
}

.secondary-btn,
.primary-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 900;
}

.secondary-btn {
  background: #F8FAFC;
  color: #475569;
}

.primary-btn {
  background: #4F46E5;
  color: #FFFFFF;
  box-shadow: 0 18rpx 36rpx rgba(79, 70, 229, 0.22);
}
```

- [ ] **Step 7: Run syntax and readiness checks**

Run:

```powershell
node --check miniprogram/pages/manual-entry/index.js
node --check miniprogram/pages/invoice-detail/index.js
node --check miniprogram/pages/export-center/index.js
node tests/ui-redesign-readiness.test.js
node tests/v1-readiness.test.js
```

Expected: all commands pass.

- [ ] **Step 8: Commit secondary pages**

Run:

```powershell
git add miniprogram/pages/manual-entry/index.wxml miniprogram/pages/manual-entry/index.wxss miniprogram/pages/invoice-detail/index.wxml miniprogram/pages/invoice-detail/index.wxss miniprogram/pages/export-center/index.js miniprogram/pages/export-center/index.wxml miniprogram/pages/export-center/index.wxss
git commit -m "feat: redesign form detail and export pages"
```

Expected: commit succeeds with the listed files only.

---

### Task 7: Full Verification and Visual QA

**Files:**
- Test only; no intended code changes.

- [ ] **Step 1: Run all static checks**

Run:

```powershell
node --check miniprogram/pages/index/index.js
node --check miniprogram/pages/folder/index.js
node --check miniprogram/pages/profile/index.js
node --check miniprogram/pages/manual-entry/index.js
node --check miniprogram/pages/invoice-detail/index.js
node --check miniprogram/pages/export-center/index.js
node tests/ui-redesign-readiness.test.js
node tests/v1-readiness.test.js
```

Expected: every command exits with code `0`; readiness tests print:

```text
ui redesign readiness checks passed
v1 readiness checks passed
```

- [ ] **Step 2: Inspect git status**

Run:

```powershell
git status --short
```

Expected: only pre-existing unrelated files remain unstaged, or no output if the tree is otherwise clean. Do not stage unrelated existing changes such as `test-ocr.js`, `.gitignore`, `.superpowers/`, or unrelated user-owned files.

- [ ] **Step 3: Manual WeChat DevTools visual QA**

Open the mini program in WeChat Developer Tools and inspect:

```text
首页：Hero 卡、便捷发票录入、核心服务、提示卡
票夹：搜索筛选、统计卡、发票卡、底部导出栏
我的：深色资料卡、三列统计、分组菜单
手动录入：独立页面表单视觉、错误态、底部按钮
发票详情：金额 Hero、信息卡、时间线、操作区、PDF 按钮
导出中心：PDF 清单卡、格式、记录、预设、底部按钮
```

Expected: content areas visually follow `票易理UI设计.html`; native navigation and native TabBar remain visible; there is no duplicated custom nav/tab.

- [ ] **Step 4: Manual behavior QA**

In WeChat Developer Tools, verify:

```text
首页 智能识别 -> intake-detail?source=ocr
首页 聊天文件 -> intake-detail?source=chat
首页 手机相册 -> intake-detail?source=album
首页 手动录入 -> manual-entry
首页 票夹归集 -> folder tab
首页 原票 PDF -> folder tab with 可导出 filter
票夹搜索 filters visible list
票夹全部/本月/可导出 switches list
票夹勾选 updates 已选 count
票夹未勾选导出 shows 请先勾选要导出的发票
票夹已勾选导出 calls existing PDF flow
详情编辑 jumps to manual-entry?id=...
详情删除 still confirms
导出中心刷新 and 生成 PDF retain existing prompts
```

Expected: all existing flows still work; unsupported entries such as PRO, L3, Excel, print, enterprise collaboration do not appear.

- [ ] **Step 5: Resolve QA findings through the relevant task**

If Step 3 or Step 4 reveals a defect, return to the task that owns the failing page or behavior, make the smallest fix there, rerun that task's verification commands, and use that task's commit command. Do not create a broad catch-all commit from the QA task.

Expected: either all QA passes with no extra commit, or the fix is committed under the task that owns the failure.

---

## Plan Self-Review

Spec coverage:

- Visual baseline and native shell boundary are covered by Tasks 2-7.
- Homepage Hero, entry cards, core services, and tip card are covered by Task 3.
- Folder search, filters, stats, cards, selected state, current-month filter, and export bar are covered by Task 4.
- Profile card, stats, menu groups, icons, and PRO removal are covered by Task 5.
- Manual entry, invoice detail, and export center visual updates are covered by Task 6.
- Unsupported copy removal and readiness protections are covered by Task 1 and Task 7.

Open item scan:

- This plan intentionally contains no `TBD`, `TODO`, `implement later`, or open-ended feature gaps.
- Code-changing steps include concrete snippets or exact replacement files.

Type and name consistency:

- `folderDefaultFilter`, `getCurrentMonthPrefix`, `home-hero`, `section-marker`, `profile-hero`, `menu-icon`, `export-preview-card`, and `export-btn-disabled` are used consistently between tests and implementation tasks.
