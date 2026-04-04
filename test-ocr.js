const fs = require("fs");
const path = require("path");
const tcloud = require("tencentcloud-sdk-nodejs");

const OcrClient = tcloud.ocr.v20181119.Client;

const localConfig = require("./cloudfunctions/quickstartFunctions/config.local.json");
const SECRET_ID = localConfig.tencent.secretId;
const SECRET_KEY = localConfig.tencent.secretKey;
const REGION = localConfig.tencent.region || "ap-beijing";

async function testOcr() {
  console.log("=" .repeat(60));
  console.log("腾讯云发票OCR 本地测试");
  console.log("=" .repeat(60));

  const imagePath = path.join(__dirname, "发票.png");
  console.log("\n[1] 读取图片:", imagePath);

  if (!fs.existsSync(imagePath)) {
    console.error("❌ 图片文件不存在:", imagePath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  console.log("[2] 图片大小:", imageBuffer.length, "bytes");
  console.log("[3] Base64长度:", base64Image.length);

  console.log("\n[4] 初始化腾讯云OCR客户端...");
  const clientConfig = {
    credential: {
      secretId: SECRET_ID,
      secretKey: SECRET_KEY,
    },
    region: REGION,
    profile: {
      httpProfile: {
        endpoint: "ocr.tencentcloudapi.com",
      },
    },
  };
  let client = new OcrClient(clientConfig);
  console.log("[5] 客户端初始化完成");

  console.log("\n[6] 调用 VatInvoiceOCR API...");
  const req = { ImageBase64: base64Image };

  try {
    const startTime = Date.now();
    const response = await client.VatInvoiceOCR(req);
    const elapsed = Date.now() - startTime;
    console.log("[7] ✓ API调用成功! 耗时:", elapsed, "ms");
    console.log("[8] RequestId:", response.RequestId);

    if (!response.VatInvoiceInfos || response.VatInvoiceInfos.length === 0) {
      console.error("\n❌ 未识别到发票信息!");
      console.log("原始响应:", JSON.stringify(response).substring(0, 500));
      return;
    }

    console.log("\n" + "=" .repeat(60));
    console.log("✅ 识别成功！共", response.VatInvoiceInfos.length, "个字段:");
    console.log("=" .repeat(60));

    const vatInfos = response.VatInvoiceInfos;
    console.log("\n📋 所有字段列表:");
    console.log("-".repeat(60));

    for (const item of vatInfos) {
      if (item && item.Name && item.Value) {
        console.log(`   ${item.Name.padEnd(20)}: ${item.Value}`);
      }
    }

    console.log("\n" + "=" .repeat(60));
    console.log("💰 关键信息提取:");
    console.log("=" .repeat(60));

    const getField = (name) => {
      const field = vatInfos.find(
        (item) =>
          item &&
          item.Name &&
          (item.Name === name || item.Name.indexOf(name) !== -1)
      );
      return field && field.Value ? String(field.Value).trim() : "";
    };

    const parseAmount = (amountStr) => {
      if (!amountStr) return 0;
      const cleaned = String(amountStr)
        .replace(/[^\d.-]/g, "")
        .replace(/-/g, "")
        .trim();
      if (!cleaned || cleaned === "-" || cleaned === "") return 0;
      const amount = parseFloat(cleaned);
      if (isNaN(amount)) return 0;
      return Math.round(Math.abs(amount) * 100);
    };

    const totalAmountStr =
      getField("价税合计(小写)") ||
      getField("价税合计（小写）") ||
      getField("(小写)") ||
      getField("小写") ||
      getField("价税合计") ||
      getField("合计金额") ||
      getField("金额") ||
      "";

    console.log("\n   发票名称:", getField("发票名称") || "(空)");
    console.log(
      "   价税合计(原始):",
      totalAmountStr || "(未找到)"
    );
    console.log(
      "   价税合计(解析):",
      parseAmount(totalAmountStr),
      "分 =",
      (parseAmount(totalAmountStr) / 100).toFixed(2),
      "元"
    );
    console.log("   合计金额:", getField("合计金额") || "(空)");
    console.log("   开票日期:", getField("开票日期") || "(空)");
    console.log("   购买方名称:", getField("购买方名称") || "(空)");
    console.log("   销售方名称:", getField("销售方名称") || "(空)");
    console.log("   发票号码:", getField("发票号码") || "(空)");
    console.log("   发票代码:", getField("发票代码") || "(空)");

    if (response.Items && response.Items.length > 0) {
      console.log("\n   📦 明细项目数:", response.Items.length);
      response.Items.forEach((item, idx) => {
        console.log(
          `      [${idx + 1}] ${item.Name} | 单价:${item.UnitPrice} | 金额:${item.AmountWithoutTax} | 税额:${item.TaxAmount}`
        );
      });
    }

    console.log("\n" + "=" .repeat(60));
    console.log("✅ 测试完成！");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("\n❌ API调用失败!");
    console.error("错误代码:", error.code);
    console.error("错误消息:", error.message);
    if (error.stack) {
      console.error("\n堆栈跟踪:");
      console.error(error.stack.split("\n").slice(0, 5).join("\n"));
    }
  }
}

testOcr().catch(console.error);
