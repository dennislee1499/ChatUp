const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); 
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const User = require('./models/User');
const ws = require('ws');

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
        const hashedPassword = await bcrypt.hash(password, 10)
        const createdUser = await User.create({ username, password: hashedPassword });
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

const server = app.listen(4000);

const wss = new ws.WebSocketServer({ server });
wss.on('connection', (connection, req) => {
     const cookies = req.headers.cookie;
     if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1]; 
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if (err) throw err;
                    const { userId, username } = userData; 
                    connection.userId = userId; 
                    connection.username = username; 
                })
            }
        }
     }

     [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
        }))
     })
})