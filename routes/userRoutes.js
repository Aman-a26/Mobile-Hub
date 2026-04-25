const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');

// --- 1. View Cart ---
router.get('/cart', cartController.getCart);

// --- 2. Add to Cart (with Stock Check and Deduction) ---
router.post('/add-to-cart', cartController.addToCart);

// --- 3. Update Cart Quantity ---
router.post('/cart/update', cartController.updateQuantity);

// --- 4. Remove from Cart (Restore Stock) ---
router.post('/cart/remove/:id', cartController.removeFromCart);

// GET: Product details for Quick View (Big Screen)
router.get('/product-details/:id', userController.getProductDetails);

// GET: User dashboard (no login required)
router.get('/user-dashboard', userController.getDashboard);

// --- 4. Checkout ---
// Handle accidental GET requests by redirecting to the cart
router.get('/checkout', (req, res) => {
    res.redirect('/cart');
});

// Process the actual checkout
router.post('/checkout', userController.checkout);

// --- 5. My Orders ---
router.get('/my-orders', userController.getMyOrders);

module.exports = router;