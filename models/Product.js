// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    category: { type: String, default: 'Smartphone' },
    image: { type: String, default: 'default-phone.jpg' },
    specs: {
        storage: { type: String }, // e.g., "128GB"
        ram: { type: String },     // e.g., "8GB"
        screen: { type: String },  // e.g., "6.1-inch OLED"
        processor: { type: String },
        camera: { type: String },
        battery: { type: String }
    },
    stock: { type: Number, default: 10 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);