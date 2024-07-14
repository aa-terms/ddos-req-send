const http2 = require('http2');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Define the server and path
const host = 'task-server-sigma.vercel.app';
const requestPath = '/notes/signup';

// Set up Express server and Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let intervalId;

io.on('connection', (socket) => {
    console.log('New client connected');
    if (!intervalId) {
        intervalId = setInterval(() => sendRequests(socket), 1000);
    }
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Generate a unique username and email
function generateUniqueUser() {
    const uniqueId = uuidv4();
    const username = `user_${uniqueId}`;
    const email = `${username}@gmail.com`;
    const password = 'password1';
    return { username, email, password };
}

// Function to log data to log.json
function logToFile(data) {
    const logFilePath = path.join(__dirname, 'log.json');
    fs.readFile(logFilePath, 'utf8', (err, fileData) => {
        let jsonData = [];
        if (!err) {
            try {
                jsonData = JSON.parse(fileData);
            } catch (e) {
                console.error('Error parsing log file:', e);
            }
        }
        jsonData.push(data);
        fs.writeFile(logFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
            if (err) console.error('Error writing to log file:', err);
        });
    });
}

// Send requests periodically
function sendRequests(socket) {
    // Create a client session
    const client = http2.connect(`https://${host}`);

    const user = generateUniqueUser();
    const data = JSON.stringify(user);

    // Create the request headers
    const headers = {
        ':method': 'POST',
        ':path': requestPath,
        'Content-Length': Buffer.byteLength(data),
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.122 Safari/537.36',
        'Origin': 'https://task-app-six-pi.vercel.app'
    };

    // Make the request
    const req = client.request(headers);

    // Handle the response
    req.on('response', (headers) => {
        const status = headers[':status'];
        const success = status === 200;
        const logData = {
            username: user.username,
            email: user.email,
            status: success ? 'Success' : `Failed (Status: ${status})`,
            timestamp: new Date().toISOString()
        };
        console.log(`Request for user ${user.username} ${success ? 'succeeded' : 'failed'} with status: ${status}`);
        socket.emit('log', logData);
        logToFile(logData);
    });

    // Handle errors
    req.on('error', (error) => {
        console.error(`Error for user ${user.username}:`, error);
        const logData = {
            username: user.username,
            email: user.email,
            status: `Error: ${error.message}`,
            timestamp: new Date().toISOString()
        };
        socket.emit('log', logData);
        logToFile(logData);
    });

    // End the request
    req.write(data);
    req.end();

    // Close the client session when all requests are completed
    client.on('close', () => {
        console.log('Client session closed.');
    });
}

// Start the server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
