/**
 * Fix URL ảnh trong Atlas: thay "http://localhost:3000/api/images/..." → "/api/images/..."
 * Để browser tự resolve theo origin hiện tại.
 *
 * Chạy: node scripts/fix-image-urls.js
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const URI = process.env.MONGO_URI;
const DB_NAME = "ecommerce";

if (!URI) {
  console.error("❌ MONGO_URI trong .env trống.");
  process.exit(1);
}

const OLD_HOSTS = [
  "http://localhost:3000",
  "https://localhost:3000",
  "http://localhost:5174",
  "http://103.179.190.254",
  "http://103.179.190.254:3000",
];

function stripHost(url) {
  if (typeof url !== "string") return url;
  for (const host of OLD_HOSTS) {
    if (url.startsWith(host)) return url.slice(host.length);
  }
  return url;
}

(async () => {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log("🔌 Connected to:", URI.includes("mongodb+srv") ? "Atlas" : "Local");

    let totalUpdated = 0;

    // 1. Products.images[].url
    console.log("\n📦 Products...");
    const products = await db.collection("products").find({ "images.url": { $regex: "^https?://(localhost|103\\.)" } }).toArray();
    for (const p of products) {
      const newImages = p.images.map(img => ({ ...img, url: stripHost(img.url) }));
      const changed = newImages.some((img, i) => img.url !== p.images[i].url);
      if (changed) {
        await db.collection("products").updateOne({ _id: p._id }, { $set: { images: newImages } });
        totalUpdated++;
      }
    }
    console.log(`   ✅ ${products.length} products updated`);

    // 2. Banners.imageUrl
    console.log("\n🎨 Banners...");
    const banners = await db.collection("banners").find({ imageUrl: { $regex: "^https?://(localhost|103\\.)" } }).toArray();
    for (const b of banners) {
      await db.collection("banners").updateOne({ _id: b._id }, { $set: { imageUrl: stripHost(b.imageUrl) } });
      totalUpdated++;
    }
    console.log(`   ✅ ${banners.length} banners updated`);

    // 3. Categories.imageUrl (nếu có)
    console.log("\n📁 Categories...");
    const cats = await db.collection("categories").find({ imageUrl: { $regex: "^https?://(localhost|103\\.)" } }).toArray();
    for (const c of cats) {
      await db.collection("categories").updateOne({ _id: c._id }, { $set: { imageUrl: stripHost(c.imageUrl) } });
      totalUpdated++;
    }
    console.log(`   ✅ ${cats.length} categories updated`);

    // 4. Reviews.images[]
    console.log("\n⭐ Reviews...");
    const reviews = await db.collection("reviews").find({ images: { $elemMatch: { $regex: "^https?://(localhost|103\\.)" } } }).toArray();
    for (const r of reviews) {
      const newImages = (r.images || []).map(img => typeof img === "string" ? stripHost(img) : img);
      await db.collection("reviews").updateOne({ _id: r._id }, { $set: { images: newImages } });
      totalUpdated++;
    }
    console.log(`   ✅ ${reviews.length} reviews updated`);

    // 5. Users.avatarUrl
    console.log("\n👤 Users...");
    const users = await db.collection("users").find({ avatarUrl: { $regex: "^https?://(localhost|103\\.)" } }).toArray();
    for (const u of users) {
      await db.collection("users").updateOne({ _id: u._id }, { $set: { avatarUrl: stripHost(u.avatarUrl) } });
      totalUpdated++;
    }
    console.log(`   ✅ ${users.length} users updated`);

    // 6. ProductVariants.images[].url (nếu có)
    console.log("\n🎨 ProductVariants...");
    const variants = await db.collection("productvariants").find({ "images.url": { $regex: "^https?://(localhost|103\\.)" } }).toArray();
    for (const v of variants) {
      const newImages = (v.images || []).map(img => img.url ? { ...img, url: stripHost(img.url) } : img);
      await db.collection("productvariants").updateOne({ _id: v._id }, { $set: { images: newImages } });
      totalUpdated++;
    }
    console.log(`   ✅ ${variants.length} variants updated`);

    console.log(`\n🎉 Xong! Tổng ${totalUpdated} documents updated.`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
