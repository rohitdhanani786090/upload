const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For local file storage

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public')); // Serve static frontend files from 'public' folder

// File upload endpoint
app.post('/upload', upload.single('myFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const fileInfo = {
        name: req.file.originalname,
        path: `/uploads/${req.file.filename}`, // Accessible URL for the file
        uploadedAt: new Date()
    };
    // In a real app, save fileInfo to a database here
    console.log('File uploaded:', fileInfo);

    // Emit real-time event to all connected clients
    io.emit('newFileUploaded', fileInfo);

    res.send('File uploaded successfully!');
});

// Endpoint to get all uploaded files (simulated for now, would be from DB)
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error listing files.');
        }
        const fileList = files.map(file => ({
            name: file.substring(file.indexOf('-') + 1), // Get original name
            path: `/uploads/${file}`
        }));
        res.json(fileList);
    });
});

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});