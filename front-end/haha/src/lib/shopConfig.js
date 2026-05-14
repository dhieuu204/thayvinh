// Thông tin tài khoản ngân hàng nhận thanh toán của shop
// Cập nhật các giá trị này cho đúng với tài khoản thật
export const SHOP_BANK = {
  bankName:      "MB Bank",
  accountNumber: "1421012004",
  accountHolder: "HA DUY HIEU",
  bankCode:      "MB",
};

export function buildVietQRUrl(amount, orderRef) {
  return (
    `https://img.vietqr.io/image/${SHOP_BANK.bankCode}-${SHOP_BANK.accountNumber}-compact2.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(orderRef)}` +
    `&accountName=${encodeURIComponent(SHOP_BANK.accountHolder)}`
  );
}
