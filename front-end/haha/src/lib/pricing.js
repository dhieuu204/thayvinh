// Single source of truth cho display price (mirror back-end/main/lib/pricing.js).
//
// Semantic:
//   - product.basePrice    = giá nhập (cost) — KHÔNG hiển thị
//   - product.salePrice    = giá bán niêm yết (LIST price, trước giảm)
//   - product.saleDiscount = % giảm áp lên salePrice
//   - variant.price        = giá list của variant (nếu có)
//   - flashSalePrice       = giá flash sale tuyệt đối (đã chốt)
//
// Giá khách trả:
//   1. Flash sale còn hiệu lực  → flashSalePrice
//   2. Còn lại                  → (variant.price ?? salePrice) * (1 - saleDiscount/100)

export function getDisplayPrice(product, variant = null) {
  if (!product) return { price: 0, oldPrice: null, discount: null };

  const now = Date.now();
  const flashEnds = product.flashSaleEndsAt ? new Date(product.flashSaleEndsAt).getTime() : 0;
  const flashActive =
    product.isFlashSale &&
    flashEnds > now &&
    Number(product.flashSalePrice) > 0;

  const listPrice = Number(
    variant?.price ?? product.salePrice ?? product.basePrice ?? 0
  );

  if (flashActive) {
    const flash = Number(product.flashSalePrice);
    const oldPrice = listPrice > flash ? listPrice : null;
    const discount = oldPrice ? Math.round((1 - flash / oldPrice) * 100) : null;
    return { price: flash, oldPrice, discount };
  }

  const pct = Number(product.saleDiscount || 0);
  if (pct > 0 && pct < 100) {
    return {
      price: Math.round(listPrice * (1 - pct / 100)),
      oldPrice: listPrice,
      discount: pct,
    };
  }
  return { price: listPrice, oldPrice: null, discount: null };
}
