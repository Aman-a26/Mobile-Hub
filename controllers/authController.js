const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student' // Default role for new signups
        });
        
        res.redirect('/login');
    } catch (err) {
        res.status(500).send("Registration failed. Email might already exist.");
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            // Initialize the session with user details
            req.session.user = {
                id: user._id,
                name: user.name,
                role: user.role
            };
            
            // Role-based redirection
            return user.role === 'admin' 
                ? res.redirect('/admin-dashboard') 
                : res.redirect('/user-dashboard');
        }
        res.render('login', { error: 'Invalid email or password' });
    } catch (err) {
        res.status(500).send("Login server error");
    }
};