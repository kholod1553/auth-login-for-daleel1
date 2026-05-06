import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js";
import categoriesRoutes from "./routes/categories.js";
import usersRoutes from "./routes/users.js";
import votesRouter from "./routes/votes.js";
import settingsRoutes from "./routes/settings.js";
import chatRoutes from "./routes/chat.js";
import session from 'express-session';
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/services", servicesRoutes);
app.use("/categories", categoriesRoutes);
app.use("/users", usersRoutes);
app.use("/votes", votesRouter);
app.use("/settings", settingsRoutes);
app.use("/chat", chatRoutes);
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

app.get("/", (req, res) => {
  res.json({ message: "Daleel API is running" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log("Gemini Key:", process.env.GEMINI_API_KEY);
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
