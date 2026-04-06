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
    const smartWatch = await Category.findOneAndUpdate(
      { name: "SmartWatch" },
      { name: "SmartWatch" },
      { upsert: true, new: true }
    );

    const camera = await Category.findOneAndUpdate(
      { name: "Camera" },
      { name: "Camera" },
      { upsert: true, new: true }
    );

    const smartWatches = [
      {
        name: "Apple Watch Series 9",
        price: 399,
        description: "Latest Apple smartwatch with advanced health features",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_494.png",
        inStock: true,
        flashSales: 4,
        rating: 4.8,
      },
      {
        name: "Samsung Galaxy Watch 6",
        price: 349,
        description: "Feature-rich Android smartwatch with fitness tracking",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/w/a/watch6_classic_thumbnail_1.png",
        inStock: true,
        flashSales: 3,
        rating: 4.5,
      },
      {
        name: "Garmin Venu 3",
        price: 449,
        description: "Premium GPS smartwatch for fitness enthusiasts",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/v/e/venu_3s.png",
        inStock: true,
        flashSales: 2,
        rating: 4.6,
      },
      {
        name: "Fitbit Versa 4",
        price: 229,
        description: "Affordable smartwatch with health tracking",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/techzones-fitbit-versa-7.jpg",
        inStock: true,
        flashSales: 5,
        rating: 4.2,
      },
      {
        name: "Amazfit GTR 4",
        price: 199,
        description: "Stylish smartwatch with long battery life",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/_/n/_ng_h_th_ng_minh_amazfit_gtr_4_d_y_v_i.png",
        inStock: true,
        flashSales: 6,
        rating: 4.1,
      },
      {
        name: "Huawei Watch GT 4",
        price: 249,
        description: "Elegant design with fitness features",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/h/u/huawei_1__1_1.png",
        inStock: true,
        flashSales: 2,
        rating: 4.3,
      },
      {
        name: "Xiaomi Watch S1",
        price: 179,
        description: "Affordable smartwatch with AMOLED display",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/c/active-s1-blue-thumb_1_1.jpg",
        inStock: true,
        flashSales: 3,
        rating: 4.0,
      },
      {
        name: "OnePlus Watch",
        price: 299,
        description: "Smooth performance with long battery",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/o/dong-ho-thong-minh-oneplus-watch.jpg",
        inStock: true,
        flashSales: 2,
        rating: 4.1,
      },
      {
        name: "Realme Watch 2 Pro",
        price: 99,
        description: "Budget-friendly with GPS support",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-watch-2-pro-teaser-2-removebg-preview.png",
        inStock: true,
        flashSales: 4,
        rating: 3.9,
      },
      {
        name: "TicWatch Pro 5",
        price: 329,
        description: "Dual display with extended battery",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/4/5/45a9b8fefe8f7676fcafc92b39703343_1.jpg",
        inStock: true,
        flashSales: 3,
        rating: 4.4,
      },
      {
        name: "Suunto 9 Peak",
        price: 469,
        description: "Rugged watch for outdoor adventures",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/0/0/002_1_1.jpg",
        inStock: true,
        flashSales: 2,
        rating: 4.3,
      },
      {
        name: "Coros Pace 3",
        price: 229,
        description: "Lightweight and efficient multisport watch",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/o/coros_pace_3.png",
        inStock: true,
        flashSales: 1,
        rating: 4.0,
      },
      {
        name: "Mobvoi TicWatch E3",
        price: 199,
        description: "Affordable Wear OS with fitness sensors",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/o/dong-ho-thong-minh-tic-watch-pro-3-gps-cu-tray-xuoc.png",
        inStock: true,
        flashSales: 3,
        rating: 4.0,
      },
      {
        name: "Honor Watch GS 3",
        price: 229,
        description: "Premium style with accurate tracking",
        category: smartWatch._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/o/dong-ho-thong-minh-black-shark-gs3_2_.png",
        inStock: true,
        flashSales: 4,
        rating: 4.2,
      },
    ];
    const cameras = [
      {
        name: "Canon EOS R6 Mark II",
        price: 2499,
        description: "Full-frame mirrorless camera with fast autofocus",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/_/m_y_nh_1__8.png",
        inStock: true,
        flashSales: 3,
        rating: 4.8,
      },
      {
        name: "Sony Alpha A7 IV",
        price: 2699,
        description: "Versatile mirrorless camera for photo and video",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/_/m_y_nh_4__2.png",
        inStock: true,
        flashSales: 4,
        rating: 4.7,
      },
      {
        name: "Nikon Z6 II",
        price: 1999,
        description: "Hybrid full-frame camera with dual processors",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/2/3/236_1_3.png",
        inStock: true,
        flashSales: 2,
        rating: 4.6,
      },
      {
        name: "Fujifilm X-T5",
        price: 1699,
        description: "Retro-style APS-C camera with film simulations",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/h/thumb_9.png",
        inStock: true,
        flashSales: 3,
        rating: 4.5,
      },
      {
        name: "GoPro HERO12 Black",
        price: 399,
        description: "Waterproof action camera with 5.3K recording",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_573_5_.png",
        inStock: true,
        flashSales: 6,
        rating: 4.6,
      },
      {
        name: "DJI Osmo Action 4",
        price: 379,
        description: "Compact action camera with RockSteady 3.0",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/camera-hanh-dong-dji-action-4_12_.png",
        inStock: true,
        flashSales: 4,
        rating: 4.4,
      },
      {
        name: "Insta360 ONE X3",
        price: 449,
        description: "360-degree camera for immersive content",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/camera-hanh-trinh-insta360-one-x3.png",
        inStock: true,
        flashSales: 3,
        rating: 4.5,
      },
      {
        name: "Canon PowerShot G7 X Mark III",
        price: 749,
        description: "Compact vlogging camera with flip screen",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/may-anh-canon-powershot-g7-x-mark-iii.png",
        inStock: true,
        flashSales: 5,
        rating: 4.2,
      },
      {
        name: "Sony ZV-1 II",
        price: 799,
        description: "Vlog-focused compact camera with wide lens",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/may-anh-sony-zv-1-ii-0.png",
        inStock: true,
        flashSales: 3,
        rating: 4.3,
      },
      {
        name: "Leica Q3",
        price: 5999,
        description: "Premium full-frame compact camera with fixed lens",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/_/m_y_nh_4_5.png",
        inStock: true,
        flashSales: 1,
        rating: 4.9,
      },
      {
        name: "Nikon D780",
        price: 2299,
        description: "DSLR camera with live view performance",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/2/4/242_1_1.png",
        inStock: true,
        flashSales: 2,
        rating: 4.4,
      },
      {
        name: "Fujifilm X100V",
        price: 1399,
        description: "Compact fixed-lens camera with film-like images",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/may-anh-fujifilm-x100v_1.png",
        inStock: true,
        flashSales: 4,
        rating: 4.8,
      },
      {
        name: "Kodak PixPro AZ528",
        price: 299,
        description: "Affordable superzoom camera with 52x optical zoom",
        category: camera._id,
        image:
          "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/h/thumb_5.png",
        inStock: true,
        flashSales: 5,
        rating: 3.9,
      },
    ];

    await insertUniqueProducts(smartWatches);
    await insertUniqueProducts(cameras);

    console.log("New product seeding done.");
    process.exit();
  } catch (err) {
    console.error("Error while seeding new products:", err);
    process.exit(1);
  }
};

seedNewProducts();
