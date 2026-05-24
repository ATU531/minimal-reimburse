const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

const read = (...parts) =>
  fs.readFileSync(path.join(root, ...parts), "utf8");

const parseJson = (...parts) => JSON.parse(read(...parts));

const assertNotIncludes = (content, forbidden, label) => {
  assert(
    !content.includes(forbidden),
    `${label} must not include "${forbidden}"`
  );
};

const assertIncludes = (content, expected, label) => {
  assert(
    content.includes(expected),
    `${label} must include "${expected}"`
  );
};

const appJson = parseJson("miniprogram", "app.json");
const tabLabels = appJson.tabBar.list.map((item) => item.text);
assert.deepStrictEqual(tabLabels, ["首页", "票夹", "我的"]);
assert(appJson.pages.includes("pages/reimburse/index"));
assert(appJson.pages.includes("pages/reimburse-detail/index"));

const homeJs = read("miniprogram", "pages", "index", "index.js");
const homeWxml = read("miniprogram", "pages", "index", "index.wxml");
["scan", "reimburse", "print"].forEach((token) => {
  assertNotIncludes(homeJs, token, "home js");
});
["desc:", "helper:", "待核验发票"].forEach((token) => {
  assertNotIncludes(homeJs, token, "home js");
});
["Beta", "静态", "设计假设", "报销助手", "报销"].forEach((token) => {
  assertNotIncludes(homeWxml, token, "home wxml");
});
["hero-desc", "section-desc", "feature-desc", "reminder-helper"].forEach((token) => {
  assertNotIncludes(homeWxml, token, "home wxml");
});

const folderWxml = read("miniprogram", "pages", "folder", "index.wxml");
assertNotIncludes(folderWxml, "导出 Excel", "folder wxml");
assertNotIncludes(folderWxml, "加入报销单", "folder wxml");

const invoiceDetailWxml = read(
  "miniprogram",
  "pages",
  "invoice-detail",
  "index.wxml"
);
assertNotIncludes(invoiceDetailWxml, "导出 Excel", "invoice detail wxml");
assertNotIncludes(invoiceDetailWxml, "加入报销单", "invoice detail wxml");

const profileJs = read("miniprogram", "pages", "profile", "index.js");
["企业", "报销", "打印", "协作", "会员"].forEach((token) => {
  assertNotIncludes(profileJs, token, "profile js");
});

const exportCenterJs = read(
  "miniprogram",
  "pages",
  "export-center",
  "index.js"
);
assertNotIncludes(exportCenterJs, "excel", "export center js");
assertNotIncludes(exportCenterJs, "本地模拟", "export center js");
assertNotIncludes(exportCenterJs, "createExportJob", "export center js");

const intakeJs = read("miniprogram", "pages", "intake-detail", "index.js");
assertIncludes(intakeJs, "supportedSources", "intake js");
assertNotIncludes(intakeJs, "chooseInvoiceFromCard", "intake js");
assertNotIncludes(intakeJs, "ocrProvider === \"mock\"", "intake js");
["微信卡包", "扫码", "报销"].forEach((token) => {
  assertNotIncludes(intakeJs, token, "intake js");
});

const manualEntryJs = read("miniprogram", "pages", "manual-entry", "index.js");
const manualEntryWxml = read(
  "miniprogram",
  "pages",
  "manual-entry",
  "index.wxml"
);
["微信卡包", "未报销", "未打印"].forEach((token) => {
  assertNotIncludes(manualEntryJs, token, "manual entry js");
});
["报销人", "微信卡包"].forEach((token) => {
  assertNotIncludes(manualEntryWxml, token, "manual entry wxml");
});

const cloudIndex = read("cloudfunctions", "quickstartFunctions", "index.js");
assertNotIncludes(cloudIndex, "config.local.json", "cloud function");
assertNotIncludes(cloudIndex, "recognizeWithMock", "cloud function");
assertNotIncludes(cloudIndex, 'case "mock"', "cloud function");
assertIncludes(cloudIndex, "EXPORT_UNSUPPORTED_ATTACHMENT", "cloud function");
assertIncludes(cloudIndex, "PDFDocument.create", "cloud function");

const cloudPackage = parseJson(
  "cloudfunctions",
  "quickstartFunctions",
  "package.json"
);
assert(cloudPackage.dependencies["pdf-lib"]);
assert(!cloudPackage.dependencies.pdfkit);

const testOcr = read("test-ocr.js");
assertNotIncludes(testOcr, "config.local.json", "test-ocr");
assertIncludes(testOcr, "process.env.TENCENT_SECRET_ID", "test-ocr");

console.log("v1 readiness checks passed");
