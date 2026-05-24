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
const homeJs = read("miniprogram", "pages", "index", "index.js");
const homeWxss = read("miniprogram", "pages", "index", "index.wxss");
assertIncludes(homeWxml, "home-hero", "home wxml");
assertIncludes(homeWxml, "核心服务", "home wxml");
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
