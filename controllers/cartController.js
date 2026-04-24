const Product = require('../models/Product');

// Display the cart with calculated totals
exports.getCart = (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    res.render('cart', { 
        cart, 
        total,
        user: req.session.user 
    });
};

// Handle adding items to the cart and deducting stock immediately
exports.addToCart = async (req, res) => {
    try {
        const { productId } = req.body;

        // Atomic update: find a product that is active and has stock > 0, then decrement stock by 1
        const product = await Product.findOneAndUpdate(
            { _id: productId, active: true, stock: { $gt: 0 } },
            { $inc: { stock: -1 } },
            { new: true }
        );

        if (!product) {
            return res.json({ success: false, message: 'This item is currently unavailable or out of stock.' });
        }

        if (!req.session.cart) req.session.cart = [];
        const existingItem = req.session.cart.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.qty += 1;
        } else {
            req.session.cart.push({
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                image: product.image,
                qty: 1
            });
        }

        const cartCount = req.session.cart.reduce((sum, item) => sum + item.qty, 0);
        res.json({ success: true, cartCount });
    } catch (err) {
        console.error("Cart Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update quantity (increment/decrement) with stock validation
exports.updateQuantity = async (req, res) => {
    try {
        const { productId, action } = req.body;
        const item = req.session.cart.find(i => i.productId === productId);
        if (!item) return res.status(404).json({ success: false });

        if (action === 'inc') {
            const product = await Product.findOneAndUpdate(
                { _id: productId, active: true, stock: { $gt: 0 } },
                { $inc: { stock: -1 } }
            );
            
            if (!product) {
                return res.json({ success: false, message: 'Out of stock' });
            }
            item.qty += 1;
        } else if (action === 'dec' && item.qty > 1) {
            await Product.findByIdAndUpdate(productId, { $inc: { stock: 1 } });
            item.qty -= 1;
        }

        const total = req.session.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const cartCount = req.session.cart.reduce((sum, i) => sum + i.qty, 0);
        
        res.json({ success: true, newQty: item.qty, total, cartCount });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// Remove item and restore stock
exports.removeFromCart = async (req, res) => {
    try {
        const id = req.params.id;
        const itemIndex = req.session.cart.findIndex(item => item.productId === id);
        
        if (itemIndex !== -1) {
            const item = req.session.cart[itemIndex];
            const product = await Product.findById(id);
            if (product) {
                product.stock += item.qty;
                await product.save();
            }
            req.session.cart.splice(itemIndex, 1);
        }
        res.redirect('/cart');
    } catch (err) {
        res.status(500).send('Server error');
    }
};