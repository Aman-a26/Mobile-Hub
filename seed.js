// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

const adminUser = {
    name: "Admin User",
    email: "admin@mobilehub.com",
    password: "admin123",
    role: "admin"
};

const products = [
    {
        name: "iPhone 15 Pro",
        brand: "Apple",
        price: 129900,
        specs: { storage: "256GB", ram: "8GB" },
        stock: 10,
        category: "Smartphone",
        active: true,
        image: "/image/default-phone.jpg"
    },
    {
        name: "Galaxy S24 Ultra",
        brand: "Samsung",
        price: 129999,
        specs: { storage: "512GB", ram: "12GB" },
        stock: 15,
        category: "Smartphone",
        active: true,
        image: "/image/default-phone.jpg"
    }
];

const seedDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_hub_db';
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`Connected to ${uri.includes('mongodb.net') ? 'Atlas' : 'Local MongoDB'} for seeding...`);
        
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