// ─── Pricing helper (single source of truth) ─────────────────────────────────
// Semantic:
//   - product.basePrice    = giá nhập (cost), KHÔNG hiển thị cho khách
//   - product.salePrice    = giá bán niêm yết (LIST price, trước khi giảm)
//   - product.saleDiscount = % giảm áp lên salePrice
//   - variant.price        = giá niêm yết riêng cho variant (nếu có)
//   - flashSalePrice       = giá flash sale tuyệt đối (đã chốt, không % nữa)
//
// Giá khách trả thực tế:
//   1. Nếu flash sale còn hiệu lực → flashSalePrice
//   2. Ngược lại → (variant.price ?? salePrice) * (1 - saleDiscount/100)

function getEffectivePrice(product, variant = null) {
  if (!product) return 0;

  const now = new Date();
  const flashActive =
    product.isFlashSale &&
    product.flashSaleEndsAt &&
    new Date(product.flashSaleEndsAt) > now &&
    Number.isFinite(product.flashSalePrice) &&
    product.flashSalePrice > 0;

  if (flashActive) return product.flashSalePrice;

  const listPrice = Number(
    variant?.price ?? product.salePrice ?? product.basePrice ?? 0
  );
  const pct = Number(product.saleDiscount || 0);

  if (pct > 0 && pct < 100) {
    return Math.round(listPrice * (1 - pct / 100));
  }
  return listPrice;
}

module.exports = { getEffectivePrice };
