export const FREE_SHIPPING_THRESHOLD = 500_000; // >= 500k → miễn phí
export const SHIPPING_FEE = 30_000;

export function calcShippingFee(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
