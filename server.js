require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Debugging Logs (Check if Environment Variables Exist)
console.log("🔍 Checking Environment Variables:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ MISSING");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Loaded" : "❌ MISSING");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ MISSING");
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL ? "✅ Loaded" : "❌ MISSING");

// ✅ Ensure `MONGO_URI` is not missing
if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing! Check your Railway environment variables.");
    process.exit(1);
}

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Stop server if DB connection fails
});

// ✅ Contact Schema & Model
const Contact = require('./models/Contact');

// ✅ Contact Form API Endpoint
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const newContact = new Contact({ name, email, message });
        await newContact.save();
        console.log("✅ New contact saved to database");

        // ✅ Email Notification
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
            console.error("❌ Email credentials missing! Cannot send email.");
            return res.status(500).json({ message: "Email credentials not set up correctly." });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: "New Contact Form Submission",
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Email Sending Error:", error);
            } else {
                console.log("📩 Email sent: " + info.response);
            }
        });

        res.status(201).json({ message: "Message Sent!" });
    } catch (error) {
        console.error("❌ Error handling contact request:", error);
        res.status(500).json({ message: "Error sending message", error });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
