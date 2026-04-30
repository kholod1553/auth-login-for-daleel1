import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/message", requireAuth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `أنت مساعد ذكي لتطبيق دليل المصري. 
              مهمتك مساعدة المستخدمين في:
              - الإجابة على أسئلتهم عن الخدمات الحكومية في مصر
              - شرح خطوات إتمام المعاملات الحكومية
              - توجيههم للجهات المختصة
              - إخبارهم بالأوراق والمستندات المطلوبة
              تكلم دايماً بالعربي وكن مختصراً وواضحاً.`
            }]
          },
          contents: [{
            parts: [{ text: message }]
          }]
        }),
      }
    );

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
