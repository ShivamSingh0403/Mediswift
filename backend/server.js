require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// ==========================================
// 1. APP & SOCKET.IO SETUP
// ==========================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ==========================================
// 2. MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mediswift_local';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Database!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ==========================================
// 4. MONGODB MODELS
// ==========================================
const Contact = mongoose.model('Contact', new mongoose.Schema({
    name: String, email: String, message: String, date: { type: Date, default: Date.now }
}));

const User = mongoose.model('User', new mongoose.Schema({
    name: String, email: { type: String, unique: true }, password: String, date: { type: Date, default: Date.now }
}));

const Prescription = mongoose.model('Prescription', new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    patientName: String, phone: String, notes: String, prescriptionUrl: String, date: { type: Date, default: Date.now }
}));

const Appointment = mongoose.model('Appointment', new mongoose.Schema({
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    speciality: { type: String, required: true },
    healthConcern: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}));

// ==========================================
// 5. MULTER SETUP (For File Uploads)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

// ==========================================
// 6. API ROUTES
// ==========================================
app.post('/api/contact', async (req, res) => {
    try {
        await new Contact(req.body).save();
        res.status(201).json({ success: true, message: 'Message saved!' });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email in use.' });
        await new User({ name, email, password }).save();
        res.status(201).json({ success: true, message: 'Account created!' });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/upload-prescription', upload.single('prescriptionFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false });
        await new Prescription({ ...req.body, prescriptionUrl: `/uploads/${req.file.filename}` }).save();
        res.status(201).json({ success: true, message: 'Uploaded!' });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/book-consultation', async (req, res) => {
    try {
        const { name, email, speciality, concern } = req.body;
        if (!name || !email || !speciality || !concern) return res.status(400).json({ error: 'All fields required.' });

        await new Appointment({
            patientName: name, patientEmail: email, speciality: speciality, healthConcern: concern
        }).save();

        res.status(201).json({ message: 'Consultation booking successfully processed!' });
    } catch (err) {
        console.error('❌ Database Write failure:', err);
        res.status(500).json({ error: 'Internal system failure saving consultation data.' });
    }
});

// Route: Fetch all uploaded prescriptions
app.get('/api/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.find().sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch prescriptions.' });
    }
});

const mockDoctors = [
    { _id: "doc1", name: "Dr. Sharma", category: "General Physician", experience: "12 Years", fees: "500" },
    { _id: "doc2", name: "Dr. Gupta", category: "Cardiologist", experience: "8 Years", fees: "800" }
];

app.get('/api/doctors', (req, res) => res.json({ success: true, doctors: mockDoctors }));

// ==========================================
// 7. VIDEO CALL SWITCHBOARD (Socket.io)
// ==========================================
io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined');
    });

    socket.on('offer', (roomId, offer) => socket.to(roomId).emit('offer', offer));
    socket.on('answer', (roomId, answer) => socket.to(roomId).emit('answer', answer));
    socket.on('ice-candidate', (roomId, candidate) => socket.to(roomId).emit('ice-candidate', candidate));

    socket.on('hang-up', (roomId) => socket.to(roomId).emit('user-hung-up'));
});

// ==========================================
// 8. START THE SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});