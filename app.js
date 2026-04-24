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

mongoose.connect(mongoUri)
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
    secret: process.env.SESSION_SECRET || 'dev_secret_key_123_change_me',
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
    res.locals.cartCount = (req.session.cart || []).reduce((sum, item) => sum + (item.qty || 0), 0);
    res.locals.search = '';
    res.locals.storeName = "MobileHub";
    res.locals.currencySymbol = '₹';
    res.locals.currentYear = new Date().getFullYear();

    // Modern UI Framework: Centralized Design Tokens and Navigation
    res.locals.ui = {
        currentPath: req.path,
        title: 'MobileHub',
        subtitle: 'Premium devices for the modern world.',
        theme: {
            primary: '#0f172a',    // Slate 900
            secondary: '#94a3b8',  // Slate 400
            accent: '#06b6d4',     // Cyan 500: Matches Login aesthetics
            surface: 'rgba(15, 23, 42, 0.6)', // Glass panel base
            background: '#020617', // Deep Space
            border: 'rgba(255, 255, 255, 0.05)'
        },
        layout: {
            radius: '1.5rem',      // Modern rounded corners
            shadow: '0 20px 50px rgba(6, 182, 212, 0.15)'
        },
        animation: {
            fast: 'transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)',
            standard: 'transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)',
            slow: 'transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)',
            hoverScale: 'transform transition-all duration-300 hover:scale-[1.02] active:scale-95',
            glass: 'backdrop-blur-2xl bg-[#0f172a]/60 border border-white/5 shadow-2xl'
        },
        nav: [
            { label: 'Shop', path: '/user-dashboard', icon: 'smart-phone' },
            { label: 'Orders', path: '/my-orders', icon: 'package' }
        ]
    };

    res.locals.formatPrice = (num) => new Intl.NumberFormat('en-IN').format(num);
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

// --- 7. 404 & Error Handling ---
// Catch 404 and forward to error handler
app.use((req, res) => {
    res.status(404).render('404', { title: "Page Not Found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error(`❌ Error: ${err.message}`);
    res.status(err.status || 500).render('error', { 
        message: err.message || "Internal Server Error" 
    });
});

const PORT = Number(process.env.PORT) || 3001;

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const fallbackPort = Number(port) + 1;
            console.warn(`⚠️ Port ${port} is already in use. Trying port ${fallbackPort}...`);
            startServer(fallbackPort);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

startServer(PORT);