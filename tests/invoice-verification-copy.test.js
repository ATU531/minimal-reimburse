const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const read = (...parts) =>
  fs.readFileSync(path.join(root, ...parts), "utf8");

const assertNotIncludes = (content, forbidden, label) => {
  assert(
    !content.includes(forbidden),
    `${label} must not include "${forbidden}"`
  );
};

const assertNoVisibleVerificationTags = (content, label) => {
  [
    'tags.push("已核验")',
    'tags.push("待核验")',
    'tags.push("核验失败")',
    '["已核验", "可导出"]',
    '["待核验", "可导出"]',
    'statusTags: ["已核验", "可导出"]',
    'statusTags: ["待核验", "可导出"]',
  ].forEach((copy) => {
    assertNotIncludes(content, copy, label);
  });
};

[
  ["cloud function", "cloudfunctions", "quickstartFunctions", "index.js"],
  ["folder page", "miniprogram", "pages", "folder", "index.js"],
  ["invoice detail page", "miniprogram", "pages", "invoice-detail", "index.js"],
  ["intake detail page", "miniprogram", "pages", "intake-detail", "index.js"],
  ["manual entry page", "miniprogram", "pages", "manual-entry", "index.js"],
].forEach(([label, ...parts]) => {
  assertNoVisibleVerificationTags(read(...parts), label);
});

const cloudIndex = read("cloudfunctions", "quickstartFunctions", "index.js");
assertNotIncludes(cloudIndex, "完成 OCR 校验", "cloud function");
assertNotIncludes(cloudIndex, "待 OCR 校验", "cloud function");
assertNotIncludes(cloudIndex, "可继续核验", "cloud function");
assertNotIncludes(cloudIndex, "payload.verifyStatus ||", "cloud function");

const intakeDetail = read("miniprogram", "pages", "intake-detail", "index.js");
assertNotIncludes(
  intakeDetail,
  'verifyStatus: hasOcrResult ? "verified" : "unverified"',
  "intake detail page"
);
assertNotIncludes(
  intakeDetail,
  'verifyStatus: sourceType === "ocr" ? "verified" : "unverified"',
  "intake detail page"
);
assertNotIncludes(
  intakeDetail,
  'verifyStatus: "verified"',
  "intake detail page"
);

console.log("invoice verification copy checks passed");
