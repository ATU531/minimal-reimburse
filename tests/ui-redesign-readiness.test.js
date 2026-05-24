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
  "ui-question.svg",
  "ui-phone.svg",
];

requiredIcons.forEach((fileName) => {
  assert(
    exists("miniprogram", "images", "icons", fileName),
    `required icon asset is missing: ${fileName}`
  );
});
assert(
  exists("miniprogram", "images", "票易理头像.png"),
  "profile avatar asset is missing"
);

const appWxss = read("miniprogram", "app.wxss");
assertIncludes(appWxss, "Inter", "global wxss");
assertIncludes(appWxss, "Noto Sans SC", "global wxss");
assertIncludes(appWxss, "#F4F7FB", "global wxss");

const homeWxml = read("miniprogram", "pages", "index", "index.wxml");
const homeJs = read("miniprogram", "pages", "index", "index.js");
const homeWxss = read("miniprogram", "pages", "index", "index.wxss");
assertIncludes(homeWxml, "home-hero", "home wxml");
assertIncludes(homeWxml, "核心服务", "home wxml");
assertNotIncludes(homeWxml, "支持批量上传", "home wxml");
assertIncludes(homeJs, "本月票据数", "home js");
assertIncludes(homeJs, "本月合计金额", "home js");
assertIncludes(homeJs, "fetchHomeStats", "home js");
assertIncludes(homeJs, 'type: "listInvoices"', "home js");
assertIncludes(homeJs, 'activeFilter: "month"', "home js");
assertIncludes(
  homeJs,
  "const remoteMonthInvoices = this.filterCurrentMonthInvoices(",
  "home js"
);
assertIncludes(
  homeJs,
  "this.updateHeroStats(this.mergeInvoices(remoteMonthInvoices, localMonthInvoices));",
  "home js"
);
assertNotIncludes(homeJs, "本月未整理发票", "home js");
assertNotIncludes(homeJs, "本月录入金额", "home js");
assertNotIncludes(homeJs, 'value: "2"', "home js");
assertNotIncludes(homeJs, "¥868.69", "home js");
assertIncludes(homeJs, "ui-camera.svg", "home js");
assertIncludes(homeJs, "ui-chat.svg", "home js");
assertIncludes(homeJs, "ui-gallery.svg", "home js");
assertIncludes(homeJs, "ui-edit.svg", "home js");
assertIncludes(homeWxss, "linear-gradient(135deg, #1e1b4b", "home wxss");
assertIncludes(homeWxss, "section-marker", "home wxss");

const folderJs = read("miniprogram", "pages", "folder", "index.js");
const folderWxml = read("miniprogram", "pages", "folder", "index.wxml");
assertIncludes(folderJs, "getCurrentMonthPrefix", "folder js");
assertNotIncludes(folderJs, 'startsWith("2026-03")', "folder js");
assertIncludes(folderWxml, "ui-search.svg", "folder wxml");
assertIncludes(folderWxml, "export-btn-disabled", "folder wxml");
assertIncludes(
  folderWxml,
  '<view class="detail-link" data-id="{{item.id}}" catchtap="openInvoiceDetail">查看详情</view>',
  "folder wxml"
);

const profileWxml = read("miniprogram", "pages", "profile", "index.wxml");
assertIncludes(profileWxml, "profile-hero", "profile wxml");
assertIncludes(profileWxml, "/images/票易理头像.png", "profile wxml");
assertIncludes(profileWxml, "menu-icon", "profile wxml");
assertNotIncludes(profileWxml, "PRO", "profile wxml");
const profileJs = read("miniprogram", "pages", "profile", "index.js");
assertIncludes(profileJs, "profileInvoiceTitles", "profile js");
assertIncludes(profileJs, "profilePdfTemplate", "profile js");
assertIncludes(profileJs, "原票模板", "profile js");
assertIncludes(profileJs, "piaoyili2026@126.com", "profile js");
assertIncludes(profileJs, "ATU-531", "profile js");
assertIncludes(profileJs, "showContactModal", "profile js");
assertNotIncludes(profileJs, 'title: "联系我们"', "profile js");
assertNotIncludes(profileJs, "在线客服", "profile js");
assertNotIncludes(profileJs, "/pages/settings/index?section=contact", "profile js");
assertIncludes(profileWxml, 'class="menu-arrow" wx:if="{{entry.page}}"', "profile wxml");
assertIncludes(profileWxml, "contact-modal-mask", "profile wxml");
assertIncludes(profileWxml, "contact-modal-line", "profile wxml");
assertIncludes(profileWxml, "{{item.label}}：{{item.value}}", "profile wxml");
assertNotIncludes(profileWxml, "contact-modal-label", "profile wxml");
assertNotIncludes(profileWxml, "contact-modal-value", "profile wxml");
assertNotIncludes(profileWxml, 'open-type="contact"', "profile wxml");
assertNotIncludes(profileWxml, "isContact", "profile wxml");

const settingsJs = read("miniprogram", "pages", "settings", "index.js");
const settingsWxml = read("miniprogram", "pages", "settings", "index.wxml");
assertIncludes(settingsJs, "发票资料设置", "settings js");
assertIncludes(settingsJs, "原票附件保留说明", "settings js");
assertIncludes(settingsJs, "profileInvoiceTitles", "settings js");
assertIncludes(settingsJs, "showNewTitleForm", "settings js");
assertIncludes(settingsJs, "saveTitleForm", "settings js");
assertIncludes(settingsWxml, "纳税人识别号", "settings wxml");
assertIncludes(settingsWxml, "单位地址", "settings wxml");
assertIncludes(settingsWxml, "电话号码", "settings wxml");
assertIncludes(settingsWxml, "开户银行", "settings wxml");
assertIncludes(settingsWxml, "银行账户", "settings wxml");
assertIncludes(settingsWxml, "备注", "settings wxml");
assertNotIncludes(settingsWxml, "常用科目", "settings wxml");
assertIncludes(settingsWxml, "收票说明与指引", "settings wxml");
assertIncludes(settingsWxml, "常见问题", "settings wxml");
assertIncludes(settingsWxml, "联系我们", "settings wxml");
assertNotIncludes(settingsJs, "默认导出 Excel", "settings js");
assertNotIncludes(settingsJs, "打印设置", "settings js");
assertNotIncludes(settingsWxml, "企业配置", "settings wxml");

const exportCenterJs = read("miniprogram", "pages", "export-center", "index.js");
const exportCenterWxml = read("miniprogram", "pages", "export-center", "index.wxml");
assertIncludes(exportCenterJs, "正在合并原票附件", "export center js");
assertIncludes(exportCenterWxml, "export-preview-card", "export center wxml");
assertIncludes(exportCenterJs, "profilePdfTemplate", "export center js");
assertIncludes(exportCenterJs, "selectTemplate", "export center js");
assertIncludes(exportCenterWxml, "template-card", "export center wxml");
assertIncludes(exportCenterWxml, "PDF 导出模板", "export center wxml");
assertIncludes(exportCenterJs, "原票模板", "export center js");
assertNotIncludes(exportCenterJs, "按月份归档", "export center js");
assertNotIncludes(exportCenterJs, "简洁清单", "export center js");
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
  settingsJs,
  settingsWxml,
].join("\n");

["PRO 会员", "电子签名 L3", "数字证书安全等级", "导出 Excel", "企业协作", "打印设置"].forEach(
  (token) => assertNotIncludes(allUiContent, token, "redesigned v1 UI")
);

console.log("ui redesign readiness checks passed");
