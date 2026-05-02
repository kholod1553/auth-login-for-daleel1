import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { SYSTEM_PROMPT } from "../data/prompts.js";

const router = express.Router();

router.post("/message", requireAuth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" ,
               "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`},
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [{
          parts: [{ text: message }]
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.error?.message || "Gemini error" });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
