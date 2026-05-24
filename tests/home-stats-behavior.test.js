const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "miniprogram", "pages", "index", "index.js");
const pageSource = fs.readFileSync(pagePath, "utf8");

let pageConfig;
vm.runInNewContext(pageSource, {
  Page(config) {
    pageConfig = config;
  },
});

pageConfig.setData = (nextData) => {
  pageConfig.data = Object.assign({}, pageConfig.data, nextData);
};

const currentMonthInvoices = pageConfig.filterCurrentMonthInvoices(
  [
    { issueDate: "2026-05-01", totalAmount: 10000 },
    { issueDate: "2026/5/02", totalAmount: 20000 },
    { issueDate: "2026年05月03日", totalAmount: 30000 },
    { issueDate: "2026-04-30", totalAmount: 40000 },
  ],
  "2026-05"
);

assert.strictEqual(
  currentMonthInvoices.length,
  3,
  "home stats should filter by invoice issue month"
);

const mergedInvoices = pageConfig.mergeInvoices(
  [
    {
      invoiceCode: "033002400111",
      invoiceNumber: "12458097",
      issueDate: "2026-05-01",
      totalAmount: 10000,
      title: "cloud duplicate",
    },
    { _id: "cloud-2", issueDate: "2026-05-02", totalAmount: 20000 },
  ],
  [
    { id: "local-1", issueDate: "2026-05-03", totalAmount: 30000 },
    {
      invoiceCode: "033002400111",
      invoiceNumber: "12458097",
      issueDate: "2026-05-01",
      totalAmount: 10000,
      title: "local duplicate",
    },
    { title: "local without id", issueDate: "2026-05-04", totalAmount: 40000 },
  ]
);

assert.strictEqual(
  mergedInvoices.length,
  4,
  "home stats should dedupe matching invoices and keep local invoices without ids"
);

pageConfig.updateHeroStats(currentMonthInvoices);
assert.strictEqual(pageConfig.data.heroStats[0].label, "本月票据数");
assert.strictEqual(pageConfig.data.heroStats[0].value, "3");
assert.strictEqual(pageConfig.data.heroStats[0].unit, "张");
assert.strictEqual(pageConfig.data.heroStats[1].label, "本月合计金额");
assert.strictEqual(pageConfig.data.heroStats[1].value, "¥600.00");
assert.strictEqual(pageConfig.data.heroStats[1].unit, "");

console.log("home stats behavior checks passed");
