/**
 * Crawl TopZone products and seed Product/ProductVariant only.
 *
 * Usage:
 *   node scripts/seed_topzone_products.js
 *
 * Useful env:
 *   TOPZONE_DRY_RUN=true
 *   TOPZONE_LIMIT_PER_CATEGORY=10
 *   TOPZONE_CATEGORIES=iphone,mac,ipad,watch,audio,accessories
 *   TOPZONE_DEFAULT_STOCK=10
 *   TOPZONE_COST_RATIO=0.92
 */

const http = require("http");
const https = require("https");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

const Category = require("../models/Category");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

const TOPZONE_HOST = "https://www.topzone.vn";
const DEFAULT_CATEGORY_KEYS = [
  "iphone",
  "mac",
  "ipad",
  "watch",
  "audio",
  "accessories",
];

const CATEGORY_CONFIGS = {
  iphone: {
    name: "iPhone",
    slug: "iphone",
    url: `${TOPZONE_HOST}/iphone`,
    sortOrder: 10,
  },
  mac: {
    name: "Mac",
    slug: "mac",
    url: `${TOPZONE_HOST}/mac`,
    sortOrder: 20,
  },
  ipad: {
    name: "iPad",
    slug: "ipad",
    url: `${TOPZONE_HOST}/ipad`,
    sortOrder: 30,
  },
  watch: {
    name: "Watch",
    slug: "watch",
    url: `${TOPZONE_HOST}/apple-watch`,
    sortOrder: 40,
  },
  audio: {
    name: "Audio",
    slug: "audio",
    url: `${TOPZONE_HOST}/am-thanh`,
    sortOrder: 50,
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    url: `${TOPZONE_HOST}/phu-kien`,
    sortOrder: 60,
  },
};

const CONFIG = {
  dryRun: /^true$/i.test(process.env.TOPZONE_DRY_RUN || ""),
  limitPerCategory: toInt(process.env.TOPZONE_LIMIT_PER_CATEGORY, 20),
  defaultStock: toInt(process.env.TOPZONE_DEFAULT_STOCK, 10),
  costRatio: toNumber(process.env.TOPZONE_COST_RATIO, 0.92),
  delayMs: toInt(process.env.TOPZONE_DELAY_MS, 250),
  requestTimeoutMs: toInt(process.env.TOPZONE_REQUEST_TIMEOUT_MS, 20000),
  maxVariantUrlsPerProduct: toInt(
    process.env.TOPZONE_MAX_VARIANT_URLS_PER_PRODUCT,
    10
  ),
  fetchVariantDetails: !/^false$/i.test(
    process.env.TOPZONE_FETCH_VARIANT_DETAILS || ""
  ),
};

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSpace(value) {
  return decodeHtml(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAscii(value) {
  return normalizeSpace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCodePoint(Number.parseInt(num, 10))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripTags(value) {
  return normalizeSpace(String(value || "").replace(/<[^>]+>/g, " "));
}

function getAttr(tag, attr) {
  if (!tag) return "";
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(`${escaped}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return decodeHtml(match ? match[2] || match[3] || match[4] || "" : "");
}

function absoluteUrl(value, baseUrl = TOPZONE_HOST) {
  const raw = decodeHtml(value || "").trim();
  if (!raw || raw === "//") return "";
  try {
    return new URL(raw, baseUrl).toString();
  } catch (_err) {
    return "";
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseMoney(value) {
  if (value == null) return null;
  const text = decodeHtml(String(value));
  const trimmed = text.trim();

  if (/^\d+\.\d+$/.test(trimmed)) {
    const parsedDecimal = Number.parseFloat(trimmed);
    if (Number.isFinite(parsedDecimal)) return Math.round(parsedDecimal);
  }

  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return null;

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToThousand(value) {
  return Math.max(0, Math.round(value / 1000) * 1000);
}

function listFromEnv() {
  const raw = process.env.TOPZONE_CATEGORIES;
  if (!raw) return DEFAULT_CATEGORY_KEYS;
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((key) => CATEGORY_CONFIGS[key]);
}

function requestText(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "http:" ? http : https;

    const req = client.request(
      parsedUrl,
      {
        method: "GET",
        timeout: CONFIG.requestTimeoutMs,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
          Connection: "close",
        },
      },
      (res) => {
        const statusCode = res.statusCode || 0;
        const location = res.headers.location;

        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          location &&
          redirectCount < 5
        ) {
          res.resume();
          resolve(requestText(absoluteUrl(location, url), redirectCount + 1));
          return;
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (statusCode >= 400) {
            reject(new Error(`HTTP ${statusCode} for ${url}`));
            return;
          }
          resolve(body);
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error(`Timeout for ${url}`)));
    req.on("error", reject);
    req.end();
  });
}

async function fetchText(url) {
  const html = await requestText(url);
  await sleep(CONFIG.delayMs);
  return html;
}

function extractProductItems(html, categoryConfig) {
  const starts = [];
  const itemStartRegex = /<li\b(?=[^>]*\bdata-productcode=)[^>]*>/gi;
  let startMatch;

  while ((startMatch = itemStartRegex.exec(html))) {
    starts.push({ index: startMatch.index, tag: startMatch[0] });
  }

  const items = [];
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ? starts[i + 1].index : html.length;
    const block = html.slice(start.index, nextStart);
    const anchorMatch = block.match(
      /<a\b[^>]*class=(?:"[^"]*\bmain-contain\b[^"]*"|'[^']*\bmain-contain\b[^']*')[^>]*>/i
    );

    if (!anchorMatch) continue;

    const anchorTag = anchorMatch[0];
    const href = absoluteUrl(getAttr(anchorTag, "href"), categoryConfig.url);
    const dataName = normalizeSpace(getAttr(anchorTag, "data-name"));
    const h3Name = stripTags((block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1]);
    const groupName = normalizeSpace(
      getAttr(
        (block.match(
          /<div\b[^>]*class=(?:"[^"]*\bprods-group\b[^"]*"|'[^']*\bprods-group\b[^']*')[^>]*>/i
        ) || [])[0],
        "data-mergename"
      )
    );
    const imageTag =
      (block.match(
        /<img\b[^>]*class=(?:"[^"]*\bthumb\b[^"]*"|'[^']*\bthumb\b[^']*')[^>]*>/i
      ) || [])[0] || "";
    const priceText =
      stripTags((block.match(/<strong\b[^>]*class=["'][^"']*\bprice\b[^"']*["'][^>]*>([\s\S]*?)<\/strong>/i) || [])[1]) ||
      getAttr(anchorTag, "data-price");
    const oldPriceText = stripTags(
      (block.match(/<p\b[^>]*class=["'][^"']*\bprice-old\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i) || [])[1]
    );

    const sourceProductId =
      getAttr(start.tag, "data-id") || getAttr(anchorTag, "data-id");
    const sourceProductCode =
      getAttr(start.tag, "data-productcode") ||
      getAttr(anchorTag, "data-productcode");
    const sourceCategory = normalizeSpace(
      getAttr(anchorTag, "data-cate") || categoryConfig.name
    );

    items.push({
      sourceProductId,
      sourceProductCode,
      sourceCategory,
      brand: normalizeSpace(getAttr(anchorTag, "data-brand")),
      name: dataName || h3Name,
      baseName: cleanProductBaseName(groupName || h3Name || dataName),
      url: href,
      listPrice: parseMoney(priceText),
      listOldPrice: parseMoney(oldPriceText),
      listImage: absoluteUrl(
        getAttr(imageTag, "data-src") || getAttr(imageTag, "src"),
        categoryConfig.url
      ),
      listVariantLabels: parseListVariantLabels(block),
    });
  }

  return items.filter((item) => item.name && item.url);
}

function cleanProductBaseName(name) {
  const cleaned = normalizeSpace(name);
  if (!cleaned) return cleaned;
  return cleaned
    .replace(/\s+\d+\s*(?:GB|TB)\s*$/i, "")
    .replace(/\s+\d+\s*GB\s*[-/]\s*\d+\s*(?:GB|TB)\s*$/i, "")
    .trim();
}

function parseListVariantLabels(block) {
  const groupMatch = block.match(
    /<div\b[^>]*class=(?:"[^"]*\bprods-group\b[^"]*"|'[^']*\bprods-group\b[^']*')[^>]*>[\s\S]*?<\/div>/i
  );
  if (!groupMatch) return [];

  const labels = [];
  const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = liRegex.exec(groupMatch[0]))) {
    const label = stripTags(match[1]);
    if (label) labels.push(label);
  }

  return unique(labels);
}

function parseMetaDescription(html) {
  const descriptionTag =
    (html.match(
      /<meta\b[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*>/i
    ) || [])[0] ||
    (html.match(
      /<meta\b[^>]*content=["'][^"']+["'][^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*>/i
    ) || [])[0];
  return normalizeSpace(getAttr(descriptionTag, "content"));
}

function parseTitle(html) {
  return stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
}

function parsePriceInfo(html, fallbackCurrent, fallbackOld) {
  const dealTag =
    (html.match(
      /<div\b[^>]*class=(?:"[^"]*\bbs_price\b[^"]*"|'[^']*\bbs_price\b[^']*')[^>]*>/i
    ) || [])[0] || "";
  const mainPriceTag =
    (html.match(
      /<(?:strong|span)\b[^>]*class=(?:"[^"]*\bprice\b[^"]*"|'[^']*\bprice\b[^']*')[^>]*>/i
    ) || [])[0] || "";

  const dealPrice = parseMoney(getAttr(dealTag, "data-disprice"));
  const dealOldPrice = parseMoney(getAttr(dealTag, "data-price"));
  const mainPrice =
    parseMoney(getAttr(mainPriceTag, "data-disprice")) ||
    parseMoney(getAttr(mainPriceTag, "data-price"));
  const mainOldPrice = parseMoney(getAttr(mainPriceTag, "data-price"));

  const current = dealPrice || mainPrice || fallbackCurrent || 0;
  const old =
    [dealOldPrice, mainOldPrice, fallbackOld]
      .filter((price) => Number.isFinite(price) && price > current)
      .sort((a, b) => b - a)[0] || null;

  return {
    current,
    old,
    discount: old ? Math.max(0, Math.round(((old - current) / old) * 100)) : null,
  };
}

function parseCapacityOptions(html, pageUrl) {
  const block = getClassBlock(html, "capacity");
  if (!block) return [];

  const options = [];
  const liRegex = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = liRegex.exec(block))) {
    const liAttrs = match[1] || "";
    const inner = match[2] || "";
    const anchorTag = (inner.match(/<a\b[^>]*>/i) || [])[0] || "";
    const label = stripTags(inner);
    const href = absoluteUrl(getAttr(anchorTag, "href"), pageUrl);

    if (label) {
      options.push({
        label,
        url: href || pageUrl,
        active: /\bactive\b/i.test(liAttrs),
      });
    }
  }

  return uniqueOptions(options);
}

function parseColorOptions(html) {
  const block = getClassBlock(html, "color-sp");
  if (!block) return [];

  const options = [];
  const liRegex = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = liRegex.exec(block))) {
    const liAttrs = match[1] || "";
    const rawName = getAttr(match[0], "data-name");
    const name = cleanColorName(rawName || stripTags(match[2]));
    const code = getAttr(match[0], "data-code");
    const style = getAttr((match[2].match(/<a\b[^>]*>/i) || [])[0], "style");
    const hex = ((style.match(/#[0-9a-f]{3,8}/i) || [])[0] || "").toUpperCase();

    if (name) {
      options.push({
        name,
        code,
        hex,
        active: /\bactive\b/i.test(liAttrs),
      });
    }
  }

  if (options.length) return uniqueOptions(options, "name");

  const currentColorText = stripTags(
    (block.match(/<span[^>]*>([\s\S]*?)<\/span>/i) || [])[1]
  );
  const currentColor = cleanColorName(currentColorText);
  return currentColor ? [{ name: currentColor, code: "", hex: "", active: true }] : [];
}

function getClassBlock(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openRegex = new RegExp(
    `<div\\b[^>]*class=(?:"[^"]*\\b${escaped}\\b[^"]*"|'[^']*\\b${escaped}\\b[^']*')[^>]*>`,
    "i"
  );
  const openMatch = openRegex.exec(html);
  if (!openMatch) return "";

  const start = openMatch.index;
  let cursor = start;
  let depth = 0;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = start;

  let match;
  while ((match = tagRegex.exec(html))) {
    if (match[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) return html.slice(start, tagRegex.lastIndex);
    } else {
      depth += 1;
    }
    cursor = tagRegex.lastIndex;
  }

  return html.slice(start, cursor);
}

function cleanColorName(value) {
  const text = normalizeSpace(value);
  if (!text) return "";
  if (text.includes(":")) return normalizeSpace(text.split(":").slice(1).join(":"));
  return text;
}

function uniqueOptions(options, key = "label") {
  const seen = new Set();
  const result = [];

  for (const option of options) {
    const id = normalizeAscii(option[key] || option.name || option.label);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(option);
  }

  return result;
}

function collectImages(html, fallbackImage, baseUrl, sourceProductId) {
  const images = [fallbackImage];
  const imgRegex = /<(?:img|source)\b[^>]*(?:src|data-src)=["'][^"']+["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html))) {
    const tag = match[0];
    const src = absoluteUrl(
      getAttr(tag, "data-src") || getAttr(tag, "src"),
      baseUrl
    );
    if (!src) continue;
    if (!/\.(?:png|jpe?g|webp)(?:\?|$)/i.test(src)) continue;
    if (!/(?:Products\/Images|mwg-static|cdn\.tgdd\.vn)/i.test(src)) continue;
    if (/logo|icon|banner|qr|certify|dmca|chat|loading/i.test(src)) continue;
    if (sourceProductId && src.includes("/Products/Images/")) {
      if (!src.includes(`/${sourceProductId}/`)) continue;
    }
    images.push(src);
  }

  return unique(images).slice(0, 12);
}

function hasStock(html) {
  const text = normalizeAscii(stripTags(html));
  return !/(tam het hang|het hang|ngung kinh doanh|ngung ban|sap ve hang)/.test(
    text
  );
}

function inferAttributes(...parts) {
  const source = normalizeSpace(parts.filter(Boolean).join(" "));
  const attrs = {};

  const ramStorage = source.match(
    /\b(\d+\s*GB)\s*(?:-|\/)\s*(\d+\s*(?:GB|TB))\b/i
  );
  if (ramStorage) {
    attrs.ram = compactUnit(ramStorage[1]);
    attrs.storage = compactUnit(ramStorage[2]);
  }

  const explicitRam = source.match(/\b(\d+\s*GB)\s*(?:RAM|Ram|ram)\b/);
  if (explicitRam) attrs.ram = compactUnit(explicitRam[1]);

  const slashRam = source.match(/\b(\d+\s*GB)\s*\/\s*(\d+\s*(?:GB|TB))\b/i);
  if (slashRam) {
    attrs.ram = compactUnit(slashRam[1]);
    attrs.storage = compactUnit(slashRam[2]);
  }

  const capacities = [...source.matchAll(/\b(\d+\s*(?:GB|TB))\b/gi)].map(
    (match) => compactUnit(match[1])
  );
  if (!attrs.storage && capacities.length) {
    attrs.storage = capacities[capacities.length - 1];
  }

  const size = source.match(/\b(\d{1,2}(?:\.\d+)?)\s*(?:inch|")\b/i);
  if (size) attrs.size = `${size[1]} inch`;

  return attrs;
}

function compactUnit(value) {
  return normalizeSpace(value).replace(/\s+/g, "").toUpperCase();
}

function buildVariantName(attributes) {
  const ordered = [
    attributes.ram,
    attributes.size,
    attributes.storage,
    attributes.color,
  ];
  const parts = unique(ordered.map((value) => normalizeSpace(value)));
  return parts.length ? parts.join(" - ") : "Default";
}

function buildSku(productId, capacityLabel, colorCode, index) {
  const pieces = ["TZ", productId || "NOID", slugify(capacityLabel) || "default"];
  if (colorCode) pieces.push(colorCode);
  else pieces.push(String(index + 1));
  return pieces.join("-").toUpperCase();
}

async function crawlProduct(item, categoryConfig) {
  const detailHtml = await fetchText(item.url);
  const detail = parseDetail(detailHtml, item, item.url);
  const capacityOptions = detail.capacityOptions.length
    ? detail.capacityOptions
    : [{ label: inferPrimaryCapacity(item), url: item.url, active: true }];
  const variantDetails = [];

  if (CONFIG.fetchVariantDetails) {
    const selected = capacityOptions
      .slice(0, CONFIG.maxVariantUrlsPerProduct)
      .map((option) => ({
        ...option,
        url: option.url || item.url,
      }));

    for (const option of selected) {
      if (sameUrl(option.url, item.url)) {
        variantDetails.push({ option, detail, html: detailHtml });
        continue;
      }

      try {
        const html = await fetchText(option.url);
        variantDetails.push({
          option,
          detail: parseDetail(html, item, option.url),
          html,
        });
      } catch (err) {
        console.warn(
          `Skip variant detail: ${option.label} (${option.url}) - ${err.message}`
        );
      }
    }
  } else {
    variantDetails.push({ option: capacityOptions[0], detail, html: detailHtml });
  }

  // salePrice = giá LIST (chưa giảm). Nếu trang web có giá cũ (old) → dùng làm list,
  // saleDiscount sẽ tự áp lúc hiển thị/order. Nếu không có giảm → current = list.
  const listPrice = detail.priceInfo.old || detail.priceInfo.current || item.listOldPrice || item.listPrice || 0;
  const salePrice = listPrice;
  // basePrice (giá nhập) tính trên giá THỰC tế khách trả (sau saleDiscount),
  // tránh trường hợp bán lỗ khi TopZone giảm nhiều hơn costRatio.
  const actualPrice = detail.priceInfo.current || item.listPrice || listPrice;
  const basePrice = actualPrice
    ? roundToThousand(actualPrice * CONFIG.costRatio)
    : 0;
  const productName =
    cleanProductBaseName(item.baseName || detail.title || item.name) || item.name;
  const images = unique([...detail.images, item.listImage]);
  const stock = hasStock(detailHtml) ? CONFIG.defaultStock : 0;

  const product = {
    name: productName,
    slug: slugify(productName),
    description:
      detail.description ||
      `${productName}. Source: ${item.url}`,
    category: categoryConfig._id,
    basePrice,
    salePrice,
    saleDiscount: detail.priceInfo.discount,
    images: images.map((url, index) => ({ url, isPrimary: index === 0 })),
    stock,
    sold: 0,
    tags: unique([
      "topzone",
      categoryConfig.slug,
      item.brand,
      item.sourceCategory,
      ...Object.values(inferAttributes(item.name)),
    ]).slice(0, 12),
    isActive: true,
    isFlashSale: false,
    flashSalePrice: null,
    flashSaleEndsAt: null,
    deletedAt: null,
  };

  const variants = buildVariants(item, product, variantDetails);
  if (!variants.length) {
    variants.push({
      name: "Default",
      sku: buildSku(item.sourceProductId, "default", item.sourceProductCode, 0),
      attributes: {},
      price: salePrice,
      stock,
      images,
    });
  }

  product.stock = variants.reduce((sum, variant) => sum + variant.stock, 0);

  return { product, variants };
}

function parseDetail(html, item, pageUrl) {
  const priceInfo = parsePriceInfo(html, item.listPrice, item.listOldPrice);
  return {
    title: parseTitle(html),
    description: parseMetaDescription(html),
    priceInfo,
    capacityOptions: parseCapacityOptions(html, pageUrl),
    colorOptions: parseColorOptions(html),
    images: collectImages(html, item.listImage, pageUrl, item.sourceProductId),
    inStock: hasStock(html),
  };
}

function inferPrimaryCapacity(item) {
  const attrs = inferAttributes(item.name);
  return attrs.storage || attrs.ram || item.listVariantLabels[0] || "Default";
}

function sameUrl(left, right) {
  try {
    const a = new URL(left);
    const b = new URL(right);
    return a.origin === b.origin && a.pathname === b.pathname;
  } catch (_err) {
    return left === right;
  }
}

function buildVariants(item, product, variantDetails) {
  const variants = [];
  const seen = new Set();

  for (const { option, detail } of variantDetails) {
    const colors = detail.colorOptions.length
      ? detail.colorOptions
      : [{ name: "", code: item.sourceProductCode || "", hex: "", active: true }];
    // Variant.price = giá list (chưa giảm) — saleDiscount của product apply lúc display.
    const price = detail.priceInfo.old || detail.priceInfo.current || product.salePrice || product.basePrice;
    const variantStock = detail.inStock ? CONFIG.defaultStock : 0;

    colors.forEach((color, index) => {
      const attributes = inferAttributes(item.name, option.label, product.name);
      if (color.name) attributes.color = color.name;
      if (color.hex) attributes.colorHex = color.hex;

      const sku = buildSku(
        item.sourceProductId,
        option.label,
        color.code || item.sourceProductCode,
        index
      );
      const identity = `${sku}-${buildVariantName(attributes)}`;
      if (seen.has(identity)) return;
      seen.add(identity);

      variants.push({
        name: buildVariantName(attributes),
        sku,
        attributes,
        price,
        stock: variantStock,
        images: detail.images,
      });
    });
  }

  return variants;
}

async function ensureCategory(config) {
  if (CONFIG.dryRun) {
    return { ...config, _id: `dry-${config.slug}` };
  }

  const existing = await Category.findOne({
    deletedAt: null,
    $or: [{ slug: config.slug }, { name: config.name }],
  });

  if (existing) {
    existing.name = config.name;
    existing.slug = config.slug;
    existing.description = existing.description || `Products crawled from TopZone ${config.name}.`;
    existing.isActive = true;
    existing.sortOrder = config.sortOrder;
    await existing.save();
    return { ...config, _id: existing._id };
  }

  const category = await Category.create({
    name: config.name,
    slug: config.slug,
    description: `Products crawled from TopZone ${config.name}.`,
    imageUrl: "",
    parent: null,
    isActive: true,
    sortOrder: config.sortOrder,
    deletedAt: null,
  });

  return { ...config, _id: category._id };
}

async function saveProductWithVariants(product, variants) {
  if (CONFIG.dryRun) {
    return {
      productId: `dry-${product.slug}`,
      variantCount: variants.length,
      action: "dry-run",
    };
  }

  const savedProduct = await Product.findOneAndUpdate(
    { slug: product.slug, deletedAt: null },
    { $set: product },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  await ProductVariant.deleteMany({ productId: savedProduct._id });
  await ProductVariant.insertMany(
    variants.map((variant) => ({
      ...variant,
      productId: savedProduct._id,
    })),
    { ordered: false }
  );

  return {
    productId: savedProduct._id,
    variantCount: variants.length,
    action: "upserted",
  };
}

async function crawlCategory(categoryConfig) {
  const category = await ensureCategory(categoryConfig);
  const html = await fetchText(categoryConfig.url);
  const items = extractProductItems(html, categoryConfig).slice(
    0,
    CONFIG.limitPerCategory
  );

  console.log(
    `\n[${categoryConfig.name}] Found ${items.length} products from ${categoryConfig.url}`
  );

  const results = [];
  for (const [index, item] of items.entries()) {
    try {
      console.log(
        `  ${index + 1}/${items.length} Crawl ${item.name} (${item.url})`
      );
      const crawled = await crawlProduct(item, category);
      const saved = await saveProductWithVariants(
        crawled.product,
        crawled.variants
      );

      console.log(
        `    ${saved.action}: ${crawled.product.name} - ${saved.variantCount} variants`
      );
      results.push({ item, ...crawled, saved });
    } catch (err) {
      console.error(`    Failed: ${item.name} - ${err.message}`);
    }
  }

  return results;
}

async function connectDBIfNeeded() {
  if (CONFIG.dryRun) {
    console.log("Dry-run mode: skip MongoDB writes.");
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI. Add it to .env or run TOPZONE_DRY_RUN=true.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected.");
}

async function main() {
  const categoryKeys = listFromEnv();
  if (!categoryKeys.length) {
    throw new Error("No valid TopZone categories selected.");
  }

  console.log("TopZone Product/ProductVariant seed");
  console.log(`Categories: ${categoryKeys.join(", ")}`);
  console.log(`Limit/category: ${CONFIG.limitPerCategory}`);

  await connectDBIfNeeded();

  const allResults = [];
  for (const key of categoryKeys) {
    const config = CATEGORY_CONFIGS[key];
    const results = await crawlCategory(config);
    allResults.push(...results);
  }

  const productCount = allResults.length;
  const variantCount = allResults.reduce(
    (sum, result) => sum + result.variants.length,
    0
  );

  console.log("\nDone.");
  console.log(`Products: ${productCount}`);
  console.log(`Variants: ${variantCount}`);

  if (CONFIG.dryRun && allResults[0]) {
    const preview = allResults[0];
    console.log("\nPreview first product:");
    console.log(
      JSON.stringify(
        {
          product: preview.product,
          variants: preview.variants.slice(0, 3),
        },
        null,
        2
      )
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
