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
    const phone = await Category.findOneAndUpdate(
      { name: "Phone" },
      { name: "Phone" },
      { upsert: true, new: true }
    );

    const computer = await Category.findOneAndUpdate(
      { name: "Computer" },
      { name: "Computer" },
      { upsert: true, new: true }
    );

    const phones = [
      {
        name: "iPhone 15 Pro Max",
        price: 1199,
        description: "Flagship Apple phone with A17 Pro chip",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png",
        inStock: true,
        flashSales: 5,
        rating: 4.9,
      },
      {
        name: "iPhone 14",
        price: 799,
        description: "Powerful Apple phone with A15 Bionic chip",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-14_1.png",
        inStock: true,
        flashSales: 4,
        rating: 4.7,
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        price: 1099,
        description: "High-end Android phone with advanced camera",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/s/ss-s24-ultra-xam-222.png",
        inStock: true,
        flashSales: 4,
        rating: 4.8,
      },
      {
        name: "Samsung Galaxy A54",
        price: 449,
        description: "Mid-range Samsung phone with solid performance",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-a54-8gb-256gb.png",
        inStock: true,
        flashSales: 3,
        rating: 4.4,
      },
      {
        name: "Xiaomi Redmi Note 13 Pro",
        price: 299,
        description: "Budget phone with impressive specs",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/p/h/photo_2024-12-20_17-05-54_1.jpg",
        inStock: true,
        flashSales: 3,
        rating: 4.3,
      },
      {
        name: "Xiaomi 14 Ultra",
        price: 999,
        description: "High-end Xiaomi flagship with powerful camera",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-14-ultra_3_1_1_1.png",
        inStock: true,
        flashSales: 5,
        rating: 4.7,
      },
      {
        name: "OPPO A78",
        price: 259,
        description: "Affordable OPPO phone with large battery",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/o/combo_a78_-_black_-_rgb_2_1.jpg",
        inStock: true,
        flashSales: 2,
        rating: 4.1,
      },
      {
        name: "Realme C55",
        price: 189,
        description: "Budget Realme phone with dynamic island-like UI",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/g/rgrgrtyt6_1_2_2.jpg",
        inStock: true,
        flashSales: 3,
        rating: 4.2,
      },
      {
        name: "Vivo V29 5G",
        price: 499,
        description: "Vivo phone with Aura light and curved AMOLED screen",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/v/i/vivo-v29-5g-12gb-256gb-cu-dep_1_.png",
        inStock: true,
        flashSales: 3,
        rating: 4.4,
      },
      {
        name: "Vivo Y36",
        price: 219,
        description: "Affordable Vivo phone with decent performance",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/v/i/vivo-y36_2_2.jpg",
        inStock: true,
        flashSales: 2,
        rating: 4.0,
      },
      {
        name: "Google Pixel 8 Pro",
        price: 999,
        description: "Pixel phone with Google Tensor G3 and top-tier camera",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/o/google-pixel-8-pro_7_.png",
        inStock: true,
        flashSales: 5,
        rating: 4.9,
      },
      {
        name: "ASUS ROG Phone 7",
        price: 999,
        description: "Gaming phone with top-tier specs and cooling system",
        category: phone._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/h/y/hyu7544_2__1.jpg",
        inStock: true,
        flashSales: 4,
        rating: 4.8,
      },
    ];
        const computers = [
      {
        name: "MacBook Pro 14 M3 Pro",
        price: 1999,
        description: "Apple laptop with M3 Pro chip and Liquid Retina XDR display",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/b/o/bo-dan-full-macbook-pro-16-inch-2021-jcpal-5-in-1_2_1.jpg",
        inStock: true,
        flashSales: 4,
        rating: 4.9,
      },
      {
        name: "MacBook Air 13 M2",
        price: 1099,
        description: "Lightweight and powerful Apple laptop with M2 chip",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/f/g/fgt7778_3_.jpg",
        inStock: true,
        flashSales: 3,
        rating: 4.7,
      },
      {
        name: "ASUS ROG Zephyrus G14",
        price: 1699,
        description: "Gaming laptop with Ryzen 9 and RTX 4060",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_d_i_7_14.png",
        inStock: true,
        flashSales: 4,
        rating: 4.8,
      },
      {
        name: "Dell XPS 13 Plus",
        price: 1399,
        description: "Premium ultrabook with InfinityEdge touchscreen",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_3__7_102.png",
        inStock: true,
        flashSales: 4,
        rating: 4.6,
      },
      {
        name: "Dell Inspiron 15 3530",
        price: 499,
        description: "Affordable laptop for everyday tasks",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_d_i_6_9.png",
        inStock: true,
        flashSales: 3,
        rating: 4.2,
      },
      {
        name: "HP Pavilion x360",
        price: 649,
        description: "2-in-1 convertible laptop with touchscreen",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_828_1_.png",
        inStock: true,
        flashSales: 3,
        rating: 4.3,
      },
      {
        name: "HP Omen 16",
        price: 1499,
        description: "Gaming laptop with RTX 4070 and high-refresh display",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_d_i_6_32.png",
        inStock: true,
        flashSales: 4,
        rating: 4.7,
      },
      {
        name: "Lenovo IdeaPad 5",
        price: 599,
        description: "Great balance of performance and value",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_658_2.png",
        inStock: true,
        flashSales: 3,
        rating: 4.4,
      },
      {
        name: "Lenovo Legion 5 Pro",
        price: 1499,
        description: "Gaming laptop with AMD CPU and powerful GPU",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_509_70_.png",
        inStock: true,
        flashSales: 4,
        rating: 4.6,
      },
      {
        name: "Acer Aspire 7",
        price: 799,
        description: "Budget-friendly laptop with NVIDIA GTX graphics",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_509_11__1.png",
        inStock: true,
        flashSales: 3,
        rating: 4.2,
      },
      {
        name: "MSI Modern 15",
        price: 699,
        description: "Stylish thin & light laptop for office work",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/a/laptop-msi-modern-15-b13m-438vn.png",
        inStock: true,
        flashSales: 2,
        rating: 4.1,
      },
      {
        name: "MSI Raider GE78",
        price: 2299,
        description: "High-end gaming laptop with RGB and top-tier specs",
        category: computer._id,
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/a/laptop-msi-gaming-ge66-raider-10sfs-474vn.jpg",
        inStock: true,
        flashSales: 5,
        rating: 4.9,
      },
    ];


    await insertUniqueProducts(phones);
    await insertUniqueProducts(computers);

    console.log("New product seeding done.");
    process.exit();
  } catch (err) {
    console.error("Error while seeding new products:", err);
    process.exit(1);
  }
};

seedNewProducts();
