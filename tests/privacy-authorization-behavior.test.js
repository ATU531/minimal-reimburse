const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));
const appJson = JSON.parse(read("miniprogram", "app.json"));

assert.strictEqual(
  appJson.__usePrivacyCheck__,
  true,
  "app.json should enable WeChat privacy checks"
);
assert.strictEqual(
  appJson.usingComponents && appJson.usingComponents["privacy-guard"],
  "/components/privacy-guard/index",
  "privacy guard should be registered globally"
);

assert(
  exists("miniprogram", "components", "privacy-guard", "index.json"),
  "privacy guard component json should exist"
);
assert(
  exists("miniprogram", "components", "privacy-guard", "index.js"),
  "privacy guard component logic should exist"
);
assert(
  exists("miniprogram", "components", "privacy-guard", "index.wxml"),
  "privacy guard component template should exist"
);
assert(
  exists("miniprogram", "components", "privacy-guard", "index.wxss"),
  "privacy guard component styles should exist"
);

const privacyJs = read("miniprogram", "components", "privacy-guard", "index.js");
const privacyWxml = read("miniprogram", "components", "privacy-guard", "index.wxml");

assert(privacyJs.includes("wx.getPrivacySetting"), "privacy guard should check privacy authorization status");
assert(privacyJs.includes("wx.openPrivacyContract"), "privacy guard should open the configured privacy contract");
assert(privacyJs.includes("needAuthorization"), "privacy guard should follow platform authorization state");
assert(
  privacyWxml.includes('open-type="agreePrivacyAuthorization"'),
  "privacy guard should use WeChat privacy authorization button"
);
assert(
  privacyWxml.includes("bindagreeprivacyauthorization"),
  "privacy guard should handle privacy authorization confirmation"
);
assert(
  privacyWxml.includes("用户隐私保护指引"),
  "privacy guard should show privacy guidance copy"
);

appJson.pages.forEach((pagePath) => {
  const pageWxml = read("miniprogram", `${pagePath}.wxml`);
  assert(
    pageWxml.includes("<privacy-guard />"),
    `${pagePath}.wxml should mount privacy guard`
  );
});

console.log("privacy authorization behavior checks passed");
