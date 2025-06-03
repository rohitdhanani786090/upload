const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs'); // Import Node.js File System module
const path = require('path'); // Import Node.js Path module

// Initialize Express app
const app = express();
// Create an HTTP server from the Express app
const server = http.createServer(app);
// Initialize Socket.IO with the HTTP server for real-time communication
const io = socketIo(server);

// --- Message Persistence Setup ---
// Define the path to the file where messages will be stored
const messagesFilePath = path.join(__dirname, 'messages.json');
let messages = []; // Array to hold all chat messages in memory

// Function to load messages from the messages.json file
function loadMessages() {
    // Check if the messages.json file exists
    if (fs.existsSync(messagesFilePath)) {
        try {
            // Read the file content synchronously (blocking operation)
            const data = fs.readFileSync(messagesFilePath, 'utf8');
            // Parse the JSON data into the 'messages' array
            messages = JSON.parse(data);
            console.log('Messages loaded from file.');
        } catch (error) {
            // Log any errors that occur during file reading or JSON parsing
            console.error('Error loading messages from file:', error);
            messages = []; // Reset messages to an empty array if there's an error
        }
    } else {
        // If the file doesn't exist, log a message and create an empty file
        console.log('No messages.json found. Starting with empty chat.');
        saveMessages(); // Create an empty messages.json file
    }
}

// Function to save messages to the messages.json file
function saveMessages() {
    // Write the current 'messages' array (converted to JSON string) to the file
    // 'null, 2' formats the JSON with 2-space indentation for readability
    fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8', (err) => {
        if (err) {
            // Log any errors that occur during file writing
            console.error('Error saving messages to file:', err);
        } else {
            console.log('Messages saved to file.');
        }
    });
}

// Load messages when the server starts up
loadMessages();

// --- Express Routes ---

// Serve static files from the 'public' directory
// This makes 'public/index.html' accessible at the root URL ('/')
app.use(express.static('public'));

// New API endpoint to get all stored messages
// When a new client connects or refreshes, it can fetch the history
app.get('/messages', (req, res) => {
    res.json(messages); // Send the entire messages array as a JSON response
});

// --- Socket.IO Event Handling ---

// Listen for new client connections
io.on('connection', (socket) => {
    console.log('A user connected'); // Log when a new user connects

    // Handle incoming chat messages from clients
    socket.on('chatMessage', (msg) => {
        console.log('Message received: ' + msg);
        // Add the new message to our in-memory array
        messages.push(msg);
        // Save the updated array to the file asynchronously
        saveMessages();
        // io.emit() sends the message to ALL connected clients, including the sender
        io.emit('chatMessage', msg);
    });

    // Listen for client disconnections
    socket.on('disconnect', () => {
        console.log('User disconnected'); // Log when a user disconnects
    });
});

// --- Start the Server ---

// Define the port the server will listen on
// It uses the environment variable PORT if available (e.g., in hosting environments)
// otherwise, it defaults to 3000 for local development
const PORT = process.env.PORT || 3000;

// Start the server and listen on the defined port
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
