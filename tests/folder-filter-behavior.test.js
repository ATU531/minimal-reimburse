const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const read = (...parts) =>
  fs.readFileSync(path.join(root, ...parts), "utf8").replace(/\r\n/g, "\n");

const assertIncludes = (content, expected, label) => {
  assert(content.includes(expected), `${label} must include "${expected}"`);
};

const assertNotIncludes = (content, forbidden, label) => {
  assert(!content.includes(forbidden), `${label} must not include "${forbidden}"`);
};

const folderJs = read("miniprogram", "pages", "folder", "index.js");
const folderWxml = read("miniprogram", "pages", "folder", "index.wxml");
const cloudIndex = read("cloudfunctions", "quickstartFunctions", "index.js");

[
  "showFilterPanel",
  "toggleFilterPanel",
  "closeFilterPanel",
  "applyPanelFilter",
  "resetAllFilters",
  "filter-panel-mask",
  "filter-panel",
].forEach((token) => {
  assertNotIncludes(folderWxml, token, "folder wxml");
});

[
  "showFilterPanel",
  "toggleFilterPanel",
  "closeFilterPanel",
  "applyPanelFilter",
  "resetAllFilters",
].forEach((token) => {
  assertNotIncludes(folderJs, token, "folder js");
});

assertIncludes(folderWxml, 'bindtap="refreshCurrentFilter"', "folder wxml");
assertIncludes(folderJs, '{ id: "ready", label: "未导出" }', "folder js");
assertNotIncludes(folderJs, '{ id: "ready", label: "可导出" }', "folder js");
const invoiceCardTagMatch = folderWxml.match(/<view\n      wx:if="{{invoices.length}}"[\s\S]*?\n    >/);
assert(invoiceCardTagMatch, "folder wxml should include invoice card item");
assertNotIncludes(
  invoiceCardTagMatch[0],
  'bindtap="openInvoiceDetail"',
  "folder invoice card root"
);
assertIncludes(
  folderWxml,
  '<view class="detail-link" data-id="{{item.id}}" catchtap="openInvoiceDetail">查看详情</view>',
  "folder wxml"
);
assertIncludes(folderJs, "refreshCurrentFilter()", "folder js");
assertIncludes(folderJs, "const invoiceCount = invoices.length", "folder js");
assertIncludes(folderJs, '{ label: "票据数", value: String(invoiceCount) }', "folder js");
assertIncludes(folderJs, '{ label: "合计金额", value: this.formatAmount(amountTotal) }', "folder js");
assertIncludes(folderJs, "summaryCards: this.buildSummaryCards(invoices, selectedCount)", "folder js");
assertNotIncludes(folderJs, "待整理", "folder js");
assertNotIncludes(folderJs, "本月金额", "folder js");
assertNotIncludes(folderJs, "pendingCount", "folder js");
assertNotIncludes(
  folderJs,
  "summaryCards: this.buildSummaryCards(allInvoices",
  "folder js"
);
assertNotIncludes(folderJs, 'item.verifyStatus !== "verified"', "folder js");
assertNotIncludes(
  folderJs,
  'item.hasOriginalAttachment && item.exportStatus !== "exported"',
  "folder js"
);
assertNotIncludes(folderJs, 'item.exportStatus !== "exported"', "folder js");
assertIncludes(folderJs, 'item.exportStatus === "none"', "folder js");
assertIncludes(folderJs, "fetchInvoices(activeFilter", "folder js");
assertIncludes(folderJs, "activeFilter: activeFilter", "folder js");
assertIncludes(folderJs, "monthPrefix: this.getCurrentMonthPrefix()", "folder js");
assertIncludes(folderJs, "this.fetchInvoices(activeFilter)", "folder js");
assertNotIncludes(
  folderJs,
  'type: "listInvoices",\n          activeFilter: "all"',
  "folder js"
);

assertIncludes(cloudIndex, "getCurrentMonthPrefix", "cloud function");
assertIncludes(cloudIndex, "monthPrefix", "cloud function");
assertIncludes(
  cloudIndex,
  "monthPrefix || getCurrentMonthPrefix()",
  "cloud function"
);
assertNotIncludes(cloudIndex, 'startsWith("2026-03")', "cloud function");
assertNotIncludes(cloudIndex, 'invoice.exportStatus !== "exported"', "cloud function");
assertIncludes(cloudIndex, 'invoice.exportStatus === "none"', "cloud function");

console.log("folder filter behavior checks passed");
