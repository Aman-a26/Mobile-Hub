const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');

// Multer configuration for product image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/login');
};

router.get('/admin-dashboard', isAdmin, adminController.getAdminDashboard);
router.get('/admin/add-product', isAdmin, (req, res) => res.render('add-product'));
router.post('/admin/add', isAdmin, upload.single('image'), adminController.addProduct);
router.post('/admin/delete/:id', isAdmin, adminController.deleteProduct);
router.post('/admin/toggle-status/:id', isAdmin, adminController.toggleProductStatus);
router.get('/admin/edit/:id', isAdmin, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');
        res.render('edit-product', { product });
    } catch (err) {
        console.error('Error loading edit form:', err);
        res.status(500).send('Error loading edit form');
    }
});
router.post('/admin/edit/:id', isAdmin, upload.single('image'), adminController.editProduct);
router.get('/admin/orders', isAdmin, adminController.getAdminOrders);
router.post('/admin/orders/update-status', isAdmin, adminController.updateOrderStatus);

module.exports = router;