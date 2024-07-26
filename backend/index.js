const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); 
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); 

mongoose.connect(process.env.MONGO_URI);
const jwtSecret = process.env.JWT_SECRET;
const openaiSecret = process.env.API_KEY;

const app = express(); 
const uploadDir = path.join(__dirname, 'uploads'); 

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));

async function getUserData(req) {
    const token = req.cookies?.token;
    return new Promise((resolve, reject) => {
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err; 
                resolve(userData);
            });
        } else {
            reject('No token found'); 
        }
    });
}

app.get('/test', (req, res) => {
    res.json('test okkkk');
})

app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params; 
    const userData = await getUserData(req);
    const ourId = userData.userId; 
    const messages = await Message.find({
        sender: {$in: [userId, ourId]},
        recipient: {$in: [userId, ourId]},   
    }).sort({ createdAt: 1 });
    res.json(messages);
})

app.get('/users', async (req, res) => {
    const users = await User.find( {}, {'_id': 1, username: 1}); 
    res.json(users);
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
            maxAge: 1000000
        }).status(200).json({ id: user._id });
    } catch (err) {
        console.error(err); 
        res.status(500).json({ error: 'Internal server error' }); 
    }
})

app.post('/logout', async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }).status(200).json('logged out');
})

app.post('/chatbot', async (req, res) => {
    const { message } = req.body; 

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
            max_tokens: 150, 
        }, {
            headers: {
                'Authorization': `Bearer ${openaiSecret}`,
            },
        });

        const reply = response.data.choices[0].message.content.trim(); 
        res.json({ reply });
    } catch (err) {
        console.error('Error communicating with ChatBot', err.response ? err.response.data: err);
        res.status(500).json({ err: 'Failed to communicate with ChatBot' });
    }
});

const server = app.listen(4000);

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {

    function notifyUserStatus() {
        wss.clients.forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
            }));
        });
    }

    connection.isValid = true; 

    connection.timer = setInterval(() => {
        connection.ping();
        connection.invalidTimer = setTimeout(() => {
            connection.isValid = false;
            clearInterval(connection.invalidTimer);
            connection.terminate();
            notifyUserStatus();
        }, 1000); 
    }, 3000);

    connection.on('pong', () => {
        clearTimeout(connection.invalidTimer);
    })

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
                });
            }
        }
     }

     connection.on('message', async (message) => {
        try {
            msgData = JSON.parse(message.toString()); 
            const { recipient, text, file } = msgData;
            let fileName = null; 

            if (file) {
                const parts = file.name.split('.');
                const extension = parts[parts.length - 1]; 
                fileName = Date.now() + '.'+extension;
                const filePath = __dirname + '/uploads/' + fileName;
                const data = Buffer.from(file.data.split(',')[1], 'base64');
                fs.writeFile(filePath, data, () => {
                    console.log('file saved'+ filePath);
                });
            }
            if (recipient && (text || file)) {
                const msgDoc = await Message.create({
                    sender: connection.userId,
                    recipient, 
                    text,
                    file: file ? fileName : null,
                });
                [...wss.clients]
                    .filter(c => c.userId === recipient || c.userId === connection.userId)
                    .forEach(c => c.send(JSON.stringify({
                        text, 
                        sender: connection.userId,
                        recipient: recipient,
                        file: file ? fileName : null,
                        id: msgDoc._id,
                })));

                if (recipient === 'ChatBot') {
                    const botResponse = await axios.post('http://localhost:4000/chatbot', { message: text });
                    const botMsgDoc = await Message.create({
                        sender: 'ChatBot',
                        recipient: connection.userId,
                        text: botResponse.data.reply,
                    });

                    [...wss.clients]
                        .filter(c => c.userId === connection.userId)
                        .forEach(c => c.send(JSON.stringify({
                            text: botResponse.data.reply,
                            sender: 'ChatBot',
                            recipient: connection.userId,
                            id: botMsgDoc._id,
                        })));
                }
            }
        } catch (err) {
            console.error('Error handling messages:', err)
        } 
     });

     notifyUserStatus();
})