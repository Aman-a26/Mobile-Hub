// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

const products = [
    {
        name: "iPhone 15 Pro",
        brand: "Apple",
        price: 999,
        description: "Titanium design with A17 Pro chip.",
        specs: { storage: "128GB", ram: "8GB", screen: "6.1-inch" },
        stock: 15,
        image: "default-phone.jpg"
    },
    {
        name: "Galaxy S24 Ultra",
        brand: "Samsung",
        price: 1199,
        description: "AI-powered camera and built-in S Pen.",
        specs: { storage: "256GB", ram: "12GB", screen: "6.8-inch" },
        stock: 10,
        image: "default-phone.jpg"
    },
    {
        name: "Pixel 8 Pro",
        brand: "Google",
        price: 899,
        description: "The best of Google AI in a phone.",
        specs: { storage: "128GB", ram: "12GB", screen: "6.7-inch" },
        stock: 20,
        image: "default-phone.jpg"
    }
];

const adminUser = {
    name: "Admin User",
    email: "admin@mobilehub.com",
    password: "admin123",
    role: "admin"
};

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_hub_db', { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to Atlas for seeding...");
        
        await Product.deleteMany({});
        await Product.insertMany(products);
        
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        await User.findOneAndUpdate(
            { email: adminUser.email },
            { ...adminUser, password: hashedPassword },
            { upsert: true, new: true }
        );
        
        console.log("✅ Database Seeded Successfully!");
        console.log("Admin Credentials:");
        console.log("Email: admin@mobilehub.com");
        console.log("Password: admin123");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err);
        process.exit(1);
    }
};

seedDB();