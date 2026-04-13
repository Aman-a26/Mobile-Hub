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
        const product = await Product.findById(productId);
        
        if (!product || !product.active || parseInt(product.stock) <= 0) {
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

        product.stock -= 1;
        await product.save();

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
        const product = await Product.findById(productId);

        if (!item || !product) return res.status(404).json({ success: false });

        if (action === 'inc') {
            if (product.stock > 0) {
                item.qty += 1;
                product.stock -= 1;
            } else {
                return res.json({ success: false, message: 'Out of stock' });
            }
        } else if (action === 'dec' && item.qty > 1) {
            item.qty -= 1;
            product.stock += 1;
        }

        await product.save();
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