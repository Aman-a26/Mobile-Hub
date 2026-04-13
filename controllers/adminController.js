const Product = require('../models/Product');
const Order = require('../models/Order');

// Fetch all products for the admin management table with pagination
exports.getAdminDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.render('admin-dashboard', {
            products,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1
        });
    } catch (err) {
        res.status(500).send("Error loading admin dashboard");
    }
};

// Logic to add a new mobile device with technical specs
exports.addProduct = async (req, res) => {
    try {
        const { name, brand, price, storage, ram, stock, category } = req.body;
        
        await Product.create({
            name,
            brand,
            price,
            specs: { storage, ram }, // Structured for mobile data
            stock,
            category,
            image: req.file ? `uploads/${req.file.filename}` : 'default-phone.jpg'
        });
        
        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error("Add Product Error:", err);
        res.status(500).send("Error adding device to inventory");
    }
};

// Logic to delete a product from the store
exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin-dashboard');
    } catch (err) {
        res.status(500).send("Error deleting product");
    }
};

// Toggle active status for a product
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');

        product.active = !product.active;
        await product.save();

        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error('Toggle product status error:', err);
        res.status(500).send('Error updating product status');
    }
};

// Logic to edit a product
exports.editProduct = async (req, res) => {
    try {
        const { name, brand, price, storage, ram, stock, category } = req.body;
        const updateData = {
            name,
            brand,
            price,
            specs: { storage, ram },
            stock,
            category
        };

        // If a new image was uploaded, update the image field
        if (req.file) {
            updateData.image = `uploads/${req.file.filename}`;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        
        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error("Edit Product Error:", err);
        res.status(500).send("Error updating product");
    }
};

// Fetch all orders for admin
exports.getAdminOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product') // Optional: populates product specs if needed in admin view
            .sort({ createdAt: -1 });
        res.render('admin-orders', { orders });
    } catch (err) {
        console.error("Error fetching orders for admin:", err);
        res.status(500).send("Error loading orders");
    }
};

// Logic to update the status of an order
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await Order.findByIdAndUpdate(orderId, { status });
        res.redirect('/admin/orders');
    } catch (err) {
        console.error("Update Order Status Error:", err);
        res.status(500).send("Error updating order status");
    }
};