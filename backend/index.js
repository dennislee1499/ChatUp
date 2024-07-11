const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); 
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI);
const jwtSecret = process.env.JWT_SECRET; 

const app = express(); 
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.use(express.json());
app.use(cookieParser());

app.get('/test', (req, res) => {
    res.json('test okkkk');
})

app.get('/profile', async (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err; 
            res.json(userData);
        })
    } else {
        res.status(401).json('No token found');
    }
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const createdUser = await User.create({ username, password });
        const token = await jwt.sign({ userId: createdUser._id, username }, jwtSecret);
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 300000
        }).status(201).json({
            id: createdUser._id,
        });
    } catch (err) {
        console.error(err); 
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body; 

    try {
        const user = await User.findOne({ username }); 
        if (!user) {
            return res.status(404).json({ error: 'User not found' }); 
        }

        const validCredentials = await bcrypt.compare(password, user.password); 
        if (!validCredentials) {
            return res.status(400).json({ error: 'Invalid Credentials' }); 
        }

        const token = jwt.sign({ userId: user._id, username }, jwtSecret);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 300000
        }).status(200).json({ id: user._id });
    } catch (err) {
        console.error(err); 
        res.status(500).json({ error: 'Internal server error' }); 
    }
})

app.listen(4000);