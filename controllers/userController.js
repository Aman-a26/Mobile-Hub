const Product = require('../models/Product');
const Order = require('../models/Order');

// Display the main product catalog
exports.getDashboard = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const brand = req.query.brand || '';
    const limit = 8;
    const skip = (page - 1) * limit;

    try {
        let query = { active: true }; // Only show products that are not deactivated
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (brand) {
            query.brand = brand;
        }

        const products = await Product.find(query).skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const brands = await Product.distinct('brand', { active: true }); // Only show brands for active products

        let orderNotifications = [];
        if (req.session.user) {
            // Fetch recent status updates (Cancelled, Shipping, etc.) to show as notifications
            orderNotifications = await Order.find({
                user: req.session.user.id,
                status: { $ne: 'Processing' }
            }).sort({ updatedAt: -1 }).limit(3);
        }

        res.render('user-dashboard', {
            user: req.session.user,
            products,
            brands,
            selectedBrand: brand,
            search,
            currentPage: page,
            totalPages,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            orderNotifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading store catalog');
    }
};

// Checkout logic: Convert cart items into a permanent Order
exports.checkout = async (req, res) => {
    if (!req.session.user) return res.status(401).redirect('/login');
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect('/user-dashboard');
    }
    
    try {
        const total = req.session.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        const orderItems = req.session.cart.map(item => ({
            product: item.productId, // Links to the Product model ID
            name: item.name,
            quantity: item.qty,
            price: item.price
        }));

        const order = await Order.create({
            user: req.session.user.id,
            items: orderItems,
            totalAmount: total,
            status: 'Processing'
        });
        
        req.session.cart = [];
        res.render('order-success', { 
            orderId: order._id, 
            totalAmount: total,
            customerName: req.session.user.name 
        });
    } catch (err) {
        console.error("Checkout Error:", err);
        res.status(500).send('Checkout failed. Please try again.');
    }
};

// GET: Fetch orders for the logged-in user
exports.getMyOrders = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    try {
        const orders = await Order.find({ user: req.session.user.id }).sort({ createdAt: -1 });
        res.render('my-orders', { orders });
    } catch (err) {
        console.error("My Orders Error:", err);
        res.status(500).send('Error loading your orders');
    }
};