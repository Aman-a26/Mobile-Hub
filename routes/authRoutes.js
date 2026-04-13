const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration Flow
router.get('/register', (req, res) => res.render('signup'));
router.post('/register', authController.register);

// Login Flow
router.get('/login', (req, res) => res.render('login'));
router.post('/login', authController.login);

// Logout: Destroys the session and redirects to login
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect('/login');
    });
});

module.exports = router;