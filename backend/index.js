const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const cors = require('cors');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI);
const jwtSecret = process.env.JWT_SECRET; 

const app = express(); 
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.use(express.json());

app.get('/test', (req, res) => {
    res.json('test okkkk');
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const createdUser = await User.create({ username, password });
        const token = await jwt.sign({ userId: createdUser._id }, jwtSecret);
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, 
            maxAge: 300000
        }).status(201).json({
            _id: createdUser._id,
        });
    } catch (err) {
        console.error(err); 
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.listen(4000);