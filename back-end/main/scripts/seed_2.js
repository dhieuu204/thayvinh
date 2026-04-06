const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Product = require("./models/Product");
const Category = require("./models/Category");

mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://kien:hehe@shopping-app.nfn3dio.mongodb.net/?retryWrites=true&w=majority&appName=shopping-app",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection failed", err));

const insertUniqueProducts = async (products) => {
  for (const product of products) {
    const exists = await Product.findOne({ name: product.name });
    if (!exists) {
      await Product.create(product);
      console.log(`Inserted: ${product.name}`);
    } else {
      console.log(`Skipped (already exists): ${product.name}`);
    }
  }
};

const seedNewProducts = async () => {
  try {
    const headPhones = await Category.findOneAndUpdate(
      { name: "HeadPhones" },
      { name: "HeadPhones" },
      { upsert: true, new: true }
    );

    const gaming = await Category.findOneAndUpdate(
      { name: "Gaming" },
      { name: "Gaming" },
      { upsert: true, new: true }
    );

    const headPhone = [
      {
        name: "Tai nghe Bluetooth Apple AirPods 4",
        price: 3190,
        description: "chính hãng Apple Việt Nam",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/i/airpods-4-2.png",
        inStock: true,
        flashSales: 4,
        rating: 5,
      },
      {
        name: "Tai nghe Bluetooth True Wireless HUAWEI FreeClip",
        price: 3490,
        description:
          "Huawei Freeclip là tai nghe không dây thiết kế C-bridge với driver nam châm kép 10,8 mm, âm thanh vượt trội, pin dùng đến 36 giờ, kháng nước bụi chuẩn IP54.",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-khong-day-huawei-freeclip-.png",
        inStock: true,
        flashSales: 3,
        rating: 5,
      },
      {
        name: "Tai nghe Bluetooth True Wireless Samsung Galaxy Buds 3",
        price: 3390,
        description:
          "Samsung Galaxy Buds 3 là tai nghe không dây thiết kế Open-type, màu trắng và bạc sang trọng, tích hợp công nghệ âm thanh Hi-Fi, ANC và AI hỗ trợ dịch thuật trực tiếp.",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-buds-3_3_.png",
        inStock: true,
        flashSales: 2,
        rating: 5,
      },
      {
        name: "Tai nghe Bluetooth chụp tai Sony WH-1000XM4",
        price: 4650,
        description: "Sony WH-1000XM4 – Bản nâng cấp nhẹ của WH-1000XM3",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_17333.png",
        inStock: true,
        flashSales: 5,
        rating: 4.9,
      },
      {
        name: "Tai nghe Bluetooth True Wireless JBL Tour Pro 2",
        price: 4090,
        description:
          "Tai nghe JBL Tour Pro 2 - Màn hình cảm ứng độc đáo, chất âm vòm lôi cuốn",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-bluetooth-jbl-tour-pro-2-1.png",
        inStock: true,
        flashSales: 32,
        rating: 4.9,
      },
      {
        name: "Tai nghe Bluetooth chụp tai Sony WH-1000XM5",
        price: 7490,
        description:
          "Tai nghe Sony WH-1000XM5 - Chống ồn dịu tai, sử dụng thoải mái",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-chup-tai-sony-wh-1000xm5-4.png",
        inStock: true,
        flashSales: 6,
        rating: 5,
      },
      {
        name: "Tai nghe Bluetooth True Wireless JBL Live Pro 2",
        price: 2170,
        description: "Tai nghe JBL Live Pro 2 – Trải nghiệm âm nhạc ấn tượng",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/9/_/9_84_4.png",
        inStock: true,
        flashSales: 46,
        rating: 4.7,
      },
      {
        name: "Tai nghe chụp tai chống ồn Apple AirPods Max 2024",
        price: 12290,
        description:
          "Apple Airpods Max 2024- Âm thanh không gian, chống ồn chủ động",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/p/apple-airpods-max-1_1.png",
        inStock: true,
        flashSales: 7,
        rating: 4.6,
      },
      {
        name: "Tai nghe Bluetooth True Wireless Sony WF-1000XM5",
        price: 5790,
        description: "Tai nghe Sony WF-1000XM5 - Âm thanh vượt trội",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-khong-day-sony-wf-1000xm5-6_1.png",
        inStock: true,
        flashSales: 17,
        rating: 5,
      },
      {
        name: "Tai nghe Bluetooth True Wireless Anker Soundcore R50I NC",
        price: 490,
        description: "Dual display with extended battery",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/4/5/45a9b8fefe8f7676fcafc92b39703343_1.jpg",
        inStock: true,
        flashSales: 3,
        rating: 4.4,
      },
      {
        name: "Suunto 9 Peak",
        price: 469,
        description:
          "Tai nghe không dây Anker Soundcore R50i NC - Mang đến trải nghiệm đắm chìm trong chất âm sâu lắng",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-khong-day-anker-soundcore-r50i-nc-9.png",
        inStock: true,
        flashSales: 35,
        rating: 5,
      },
      {
        name: "Tai nghe Bluetooth chụp tai Sennheiser MOMENTUM 4",
        price: 6490,
        description:
          "Tai nghe Sennheiser Momentum 4 – Thiết kế sang trọng, âm thanh ổn định",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-chup-tai-sennheiser-momentum-4_8_.png",
        inStock: true,
        flashSales: 32,
        rating: 5,
      },
      {
        name: "Tai nghe Apple EarPods Lightning MWTY3ZA/A",
        price: 500,
        description:
          "Apple Earpods Lightning - Thiết kế hai đầu tai hình hạt đậu ôm trọn trong tai hiện đại",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/1/_/1_9_3_1.jpg",
        inStock: true,
        flashSales: 37,
        rating: 5,
      },
      {
        name: "Tai nghe nhét tai JBL C200 SIU",
        price: 240,
        description: "Premium style with accurate tracking",
        category: headPhones._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/v/dvdv5_2_.jpg",
        inStock: true,
        flashSales: 17,
        rating: 4.9,
      },
    ];
    const gamings = [
      {
        name: "Chuột gaming Logitech Pro X Superlight 2 Lightspeed",
        price: 3140,
        description:
          "Chuột Gaming Logitech Pro X Superlight 2 Lightspeed – Hạn chế ma sát, tăng cường trải nghiệm",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/h/chuot-gaming-logitech-pro-x-superlight-2-lightspeed-1.png",
        inStock: true,
        flashSales: 19,
        rating: 4.8,
      },
      {
        name: "Laptop Acer Gaming Aspire 5 A515-58GM-53PZ",
        price: 15490,
        description:
          "Laptop Acer Gaming Aspire 5 A515 58GM 53PZ - Mỏng nhẹ, mạnh mẽ",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/a/laptop_acer_gaming_aspire_5_a515-58gm-53pz_-_1.png",
        inStock: true,
        flashSales: 24,
        rating: 5,
      },
      {
        name: "Chuột Gaming không dây Logitech G304 Lightspeed",
        price: 765,
        description:
          "Chuột gaming không dây Logitech G304 Lightspeed - Thương hiệu dành cho các gaming",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/_/t_i_xu_ng_36__2.png",
        inStock: true,
        flashSales: 19,
        rating: 5,
      },
      {
        name: "Laptop Gaming Acer Nitro V ANV15-51-57B2",
        price: 23490,
        description:
          "Laptop Gaming Acer Nitro V ANV15-51-57B2 mạnh mẽ bứt phá mọi giới hạn",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/a/laptop_gaming_acer_nitro_v_anv15-51-57b2_-_1.png",
        inStock: true,
        flashSales: 20,
        rating: 4.9,
      },
      {
        name: "Chuột không dây Logitech G Pro X Superlight",
        price: 2600,
        description:
          "Chuột không dây Logitech G Pro X Superlight - Cảm biến Hero hiện đại ",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/f/dfgty67676.jpg",
        inStock: true,
        flashSales: 18,
        rating: 5,
      },
      {
        name: "Chuột Gaming Logitech Pro X Superlight 2 Dex",
        price: 3390,
        description:
          "Chuột Gaming Logitech Pro X Superlight 2 Dex - Kết nối không dây tiện lợi, độ nhạy ấn tượng",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/h/chuot-gaming-logitech-pro-x-superlight-2-dex_2_.png",
        inStock: true,
        flashSales: 13,
        rating: 5,
      },
      {
        name: "Chuột có dây Gaming Dareu LM130S RGB",
        price: 120,
        description:
          "Chuột chơi game có dây Dareu LM130S RGB - Cảm biến trò chơi",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/h/chuot-choi-game-co-day-dareu-lm130s-1.jpg",
        inStock: true,
        flashSales: 33,
        rating: 4.8,
      },
      {
        name: "Chuột Gaming Logitech G502 Hero",
        price: 990,
        description:
          "Chuột chơi Game có dây Logitech G502 Hero - Bản nâng cấp hoàn hảo dành cho game thủ",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/f/a/fab763309ba5fd53478e9dda2268c79a.jpg",
        inStock: true,
        flashSales: 29,
        rating: 4.8,
      },
      {
        name: "PC CPS X ASUS Gaming Intel i3 Gen 12 Kèm màn hình",
        price: 12190,
        description: "PC CPS ASUS Gaming Intel i3 Gen 12 – Chơi game mượt mà",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/1/2/12_5_119.png",
        inStock: true,
        flashSales: 3,
        rating: 5,
      },
      {
        name: "Bàn Phím Cơ Gaming Predator Aethon TKL 301",
        price: 990,
        description:
          "Bàn phím cơ Gaming Predator Aethon 301 TKL - Nhanh nhạy cực tiện dụng",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/b/a/ban_ph_m.png",
        inStock: true,
        flashSales: 60,
        rating: 4.9,
      },
      {
        name: "Máy chơi game Sony PlayStation 5 Slim (PS5 Slim) Bản ổ đĩa | Chính hãng Sony Việt Nam",
        price: 12100,
        description: "PS5 Slim thiết kế gọn, lưu trữ khủng",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/may-choi-game-sony-playstation-5-slim-1.png",
        inStock: true,
        flashSales: 9,
        rating: 4.8,
      },
      {
        name: "Máy chơi game MSI Claw",
        price: 12490,
        description:
          "MSI Claw hiệu năng mạnh mẽ, thoải mái sử dụng không lo về pin",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/s/msi-claw_1.png",
        inStock: true,
        flashSales: 42,
        rating: 4.8,
      },
      {
        name: "Máy chơi game ASUS ROG Ally X",
        price: 24990,
        description:
          "Asus ROG Ally X - Hiệu năng siêu mượt mà, màn hình kích thước lớn",
        category: gaming._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/s/asus-rog-ally-x-1.png",
        inStock: true,
        flashSales: 5,
        rating: 5,
      },
    ];

    await insertUniqueProducts(headPhone);
    await insertUniqueProducts(gamings);

    console.log("New product seeding done.");
    process.exit();
  } catch (err) {
    console.error("Error while seeding new products:", err);
    process.exit(1);
  }
};

seedNewProducts();
