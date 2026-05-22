const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;

    console.log('Signup attempt:', { name, email });

    try {
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log('User created successfully:', email);
        res.status(201).json({ token, user: { id: user._id, name, email, message: "User created successfully" } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordReceived: !!password });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log('Login successful for:', email);
        res.json({ token, user: { id: user._id, name: user.name, email, message: "Login successful" } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};