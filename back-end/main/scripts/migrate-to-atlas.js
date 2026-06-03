/**
 * Script migrate data từ MongoDB local sang Atlas.
 * - Đọc MONGO_URI từ .env (phải là Atlas connection string)
 * - Connect local mongodb://localhost:27017/ecommerce
 * - XÓA SẠCH atlas DB trước khi copy
 *
 * Chạy: node scripts/migrate-to-atlas.js
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const LOCAL_URI = "mongodb://localhost:27017/ecommerce";
const ATLAS_URI = process.env.MONGO_URI;
const DB_NAME = "ecommerce";

if (!ATLAS_URI) {
  console.error("❌ MONGO_URI trong .env trống.");
  process.exit(1);
}
if (!ATLAS_URI.includes("mongodb+srv://")) {
  console.error("❌ MONGO_URI trong .env không phải Atlas URI (cần dạng mongodb+srv://).");
  console.error("   Hiện tại:", ATLAS_URI);
  process.exit(1);
}

(async () => {
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    console.log("🔌 Connecting to LOCAL MongoDB...");
    await localClient.connect();
    console.log("🔌 Connecting to ATLAS...");
    await atlasClient.connect();

    const localDb = localClient.db(DB_NAME);
    const atlasDb = atlasClient.db(DB_NAME);

    // 1. List local collections
    const localCols = (await localDb.listCollections().toArray())
      .map(c => c.name)
      .filter(n => !n.startsWith("system."));
    if (localCols.length === 0) {
      console.error("❌ Local MongoDB không có collection nào. Hủy migration.");
      process.exit(1);
    }
    console.log(`📦 Local có ${localCols.length} collections: ${localCols.join(", ")}`);

    // 2. Drop all atlas collections (clear)
    const atlasCols = (await atlasDb.listCollections().toArray())
      .map(c => c.name)
      .filter(n => !n.startsWith("system."));
    if (atlasCols.length > 0) {
      console.log(`\n🗑️  Xóa ${atlasCols.length} collections cũ trong Atlas...`);
      for (const name of atlasCols) {
        await atlasDb.collection(name).drop();
        console.log(`   ✓ Dropped ${name}`);
      }
    }

    // 3. Copy each collection from local → atlas
    console.log("\n📤 Copy data...");
    let totalDocs = 0;
    for (const name of localCols) {
      const docs = await localDb.collection(name).find().toArray();
      if (docs.length === 0) {
        console.log(`   ⏭  ${name}: rỗng, skip`);
        continue;
      }
      // Chia batch nếu collection lớn (>1000 docs) để tránh oversize
      const BATCH = 500;
      for (let i = 0; i < docs.length; i += BATCH) {
        await atlasDb.collection(name).insertMany(docs.slice(i, i + BATCH), { ordered: false });
      }
      totalDocs += docs.length;
      console.log(`   ✅ ${name}: ${docs.length} documents`);
    }

    console.log(`\n🎉 Migration xong! Tổng ${totalDocs} documents.`);
    console.log("\n⚠️  Lưu ý: Indexes (text index, unique...) sẽ tự tạo lại khi backend khởi động.");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
})();
