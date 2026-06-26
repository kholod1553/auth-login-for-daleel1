import express from "express";
import { supabase, supabaseAdmin } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "daleel.support.csi@gmail.com",
        pass: "bbna dyid clot yplj",
    },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

router.post("/signup", async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/register", async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "Email and password are required" });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return res.status(400).json({ error: error.message });
        console.log("session:", req.session);
        console.log("data.user:", data.user);
        req.session.user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name,
            accessToken: data.session.access_token,
        };
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/me", requireAuth, (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/logout", requireAuth, async (req, res) => {
    try {
        req.session.destroy();
        const { error } = await req.supabase.auth.signOut();
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: "تم تسجيل الخروج بنجاح" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/verify-otp", async (req, res) => {
    try {
        const { email, token, type } = req.body;
        if (!email || !token || !type)
            return res.status(400).json({ error: "email, token, and type are required" });
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false },
        });
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: "تم إرسال الكود بنجاح" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post("/send-otp-email", async (req, res) => {
    try {
        const { email } = req.body;

        // دور في جدول users مباشرة
        const { data: user, error } = await supabase
            .from("users")
            .select("email")
            .eq("email", email)
            .single();

        if (error || !user)
            return res.status(400).json({ message: "User not found" });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase.from("users").update({
            otp,
            otp_expiry: otpExpiry,
        }).eq("email", email);

        await transporter.sendMail({
            from: "daleel.support.csi@gmail.com",
            to: email,
            subject: "OTP Verification",
            text: `كود التحقق الخاص بك: ${otp}`,
        });

        res.json({ message: "OTP sent to email successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/verify-otp-email", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();
        if (!user) return res.status(400).json({ message: "User not found" });
        if (user.is_verified)
            return res.status(400).json({ message: "User already verified" });
        if (user.otp !== otp || new Date(user.otp_expiry) < new Date())
            return res.status(400).json({ message: "Invalid or expired OTP" });
        await supabase
            .from("users")
            .update({ is_verified: true, otp: null, otp_expiry: null })
            .eq("email", email);
        res.json({ message: "Email verified successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "https://auth-login-for-daleel1-3nl2.vercel.app/reset-password",
        });
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: "تم إرسال رابط إعادة تعيين كلمة المرور" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/google", async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: "https://auth-login-for-daleel1-3nl2.vercel.app/auth/callback",
        },
    });
    if (error) return res.status(400).json({ error: error.message });
    res.redirect(data.url);
});

router.get("/callback", async (req, res) => {
    res.redirect("https://auth-login-for-daleel1-3nl2.vercel.app");
});

export default router;
