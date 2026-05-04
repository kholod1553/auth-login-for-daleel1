import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your@gmail.com",
        pass: "your-app-password",
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
        req.session.user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name,
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
        const { error } = aw
