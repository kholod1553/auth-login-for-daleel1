// routes/auth.js
import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

// ======= Nodemailer Setup =======
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your@gmail.com",
        pass: "your-app-password",
    },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// ======= Supabase Auth Routes =======

// Signup
router.post("/signup", async (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
    });
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Register (with extra fields)
router.post("/register", async (req, res) => {
    const { email, password, name, phone, username, birthdate } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone, username, birthdate } },
    });
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) return res.status(400).json({ error: error.message });

    // حفظ في Session كمان (للمشروع القديم)
    req.session.user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
    };

    res.json(data);
});

// Get current user
router.get("/me", requireAuth, (req, res) => {
    res.json(req.user);
});

// Logout
router.post("/logout", requireAuth, async (req, res) => {
    // مسح الـ Session
    req.session.destroy();

    const { error } = await req.supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "تم تسجيل الخروج بنجاح" });
});

// ======= OTP Routes (Supabase) =======

// Verify OTP (Supabase)
router.post("/verify-otp", async (req, res) => {
    const { email, token, type } = req.body;
    if (!email || !token || !type)
        return res.status(400).json({ error: "email, token, and type are required" });

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Resend OTP (Supabase)
router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "تم إرسال الكود بنجاح" });
});

// ======= OTP Routes (Nodemailer - المشروع القديم) =======

// Send OTP via Email (Nodemailer)
router.post("/send-otp-email", async (req, res) => {
    try {
        const { email } = req.body;

        // تحقق إن اليوزر موجود في Supabase
        const { data: users, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email
