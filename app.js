require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
const app = express();

// --- 1. Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : null;
const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/mobile_hub_db';
const mongoUri = MONGODB_URI || DEFAULT_MONGODB_URI;

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        const connectionType = MONGODB_URI ? "Atlas Cloud" : "Local MongoDB";
        console.log(`✅ Database Connected to ${connectionType}`);
    })
    .catch(err => console.error("❌ DB Connection Error:", err.message));

// --- 2. Settings & Middleware ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 3. Session Configuration ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 1000 * 60 * 60 * 24 // 24-hour session
    }
}));

// --- 4. Global Variables for Templates ---
app.use((req, res, next) => {
    if (!req.session.cart) req.session.cart = [];
    
    // Set global variables for EJS templates
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.isAdmin || false; // Used for Admin Logout button
    res.locals.cartCount = req.session.cart.reduce((sum, item) => sum + item.qty, 0);
    res.locals.search = '';
    res.locals.storeName = "Mobile Hub";
    res.locals.currencySymbol = '₹';
    next();
});

// --- 5. Route Mounting ---
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/userRoutes'));

// --- 6. Root & Logout Routes ---
app.get('/', (req, res) => {
    res.render('index'); 
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

const PORT = Number(process.env.PORT) || 3001;

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const fallbackPort = port === 3001 ? 3002 : port + 1;
            console.warn(`⚠️ Port ${port} is already in use. Trying port ${fallbackPort}...`);
            startServer(fallbackPort);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

startServer(PORT);