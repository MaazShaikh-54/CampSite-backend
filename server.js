// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors'); 

const app = express();
const PORT = 5000;
const User = require('./models/User');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({origin:"*"}));

const userEmail = 'smaaz658@gmail.com'; // Email to check
User.findOne({ email: userEmail }).exec();
console.log("Hello!");

mongoose.connect('mongodb+srv://mohdmaaz612054it:Fq2c5mRwsRRvIR8V@clustercampsite.z1xkam5.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCampSite');
console.log("Hello!");

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB Atlas database connection established successfully');
});

app.post('/api/register', async (req, res) => {
  try {
    console.log('someone is registering!')
    User.findOne({ email}).exec();
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.find({ email });
    console.log(user);
    if (!user) {
      console.log('1');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    else if (user[0].password != password) {
      console.log(user.password);
      console.log(password);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    else {
      return res.status(200).json({ message: 'Login successful' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  } 
});

const user = mongoose.model('User', new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
}));

app.use(express.json());
app.use(session({
  secret: 'campsite658',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production for HTTPS
}));

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Middleware for input validation
const validateRegisterInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  next();
};

app.post('http://localhost:5000/api/register', validateRegisterInput, async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user._id; // Store user ID in session
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(); // Destroy session on logout
  res.status(200).json({ message: 'Logout successful' });
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Example admin dashboard route
app.get('/admin/dashboard', isLoggedIn, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Admin dashboard' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
