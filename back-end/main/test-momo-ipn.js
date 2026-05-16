// Chạy: node test-momo-ipn.js <orderId> [success|fail]
// Ví dụ: node test-momo-ipn.js 6a08173b7794e5f7c0... success

const crypto = require("crypto");
const http   = require("http");
require("dotenv").config();

const orderId     = process.argv[2];
const scenario    = process.argv[3] || "success";

if (!orderId) {
  console.error("Usage: node test-momo-ipn.js <orderId> [success|fail]");
  process.exit(1);
}

const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
const accessKey   = process.env.MOMO_ACCESS_KEY   || "F8BBA842ECF85";
const secretKey   = process.env.MOMO_SECRET_KEY   || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

const resultCode  = scenario === "success" ? 0 : 1006; // 1006 = user cancelled
const requestId   = `${partnerCode}_${Date.now()}`;
const transId     = Date.now();
const amount      = 100000;
const orderInfo   = `Thanh toan don hang ${orderId}`;
const orderType   = "momo_wallet";
const payType     = "qr";
const responseTime = Date.now();
const message     = scenario === "success" ? "Thành công." : "Giao dịch thất bại.";
const extraData   = "";

const rawSignature =
  `accessKey=${accessKey}` +
  `&amount=${amount}` +
  `&extraData=${extraData}` +
  `&message=${message}` +
  `&orderId=${orderId}` +
  `&orderInfo=${orderInfo}` +
  `&orderType=${orderType}` +
  `&partnerCode=${partnerCode}` +
  `&payType=${payType}` +
  `&requestId=${requestId}` +
  `&responseTime=${responseTime}` +
  `&resultCode=${resultCode}` +
  `&transId=${transId}`;

const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

const body = JSON.stringify({
  partnerCode, orderId, requestId, amount,
  orderInfo, orderType, transId, resultCode,
  message, payType, responseTime, extraData, signature,
});

const options = {
  hostname: "localhost",
  port: process.env.PORT || 3000,
  path: "/api/payments/momo/ipn",
  method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
};

console.log(`\nGửi MoMo IPN giả lập — ${scenario.toUpperCase()}`);
console.log(`orderId: ${orderId}`);
console.log(`resultCode: ${resultCode}`);

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log(`\nResponse [${res.statusCode}]:`, data);
    if (res.statusCode === 200) {
      console.log(scenario === "success"
        ? "\nOrder đã được cập nhật thành Confirmed!"
        : "\nOrder đã bị Cancelled và hoàn kho.");
    }
  });
});

req.on("error", (e) => console.error("Lỗi:", e.message));
req.write(body);
req.end();
