const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Database connected'))
    .catch(err => console.log(err));

// User model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

// Pizza model (dummy structure)
const pizzaSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
});

const Pizza = mongoose.model('Pizza', pizzaSchema);

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.redirect('/login');
    }
};

// Routes
// Home Page
app.get('/', authenticate, async (req, res) => {
    const pizzas = await Pizza.find();
    res.render('index', { user: req.user, pizzas });
});

// Sign-Up Page
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = new User({ name, email, password });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.send('Error: ' + err.message);
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send('User not found!');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('Invalid credentials!');

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
});

// Logout Route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Add a dummy pizza route (for testing purposes)
app.get('/add-pizza', async (req, res) => {
    const pizza = new Pizza({
        name: 'Margherita',
        price: 200,
        description: 'Classic Margherita Pizza',
    });
    await pizza.save();
    res.send('Pizza added');
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
