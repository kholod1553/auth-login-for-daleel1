import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js";
import categoriesRoutes from "./routes/categories.js";
import usersRoutes from "./routes/users.js";
import votesRouter from "./routes/votes.js";
import settingsRoutes from "./routes/settings.js";
import chatRoutes from "./routes/chat.js";
import session from "express-session";
import connectPg from "connect-pg-simple";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);

app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

const PgSession = connectPg(session);
app.use(
  session({
    store: new PgSession({
      conString: process.env.SUPABASE_URL,
    }),
    secret: process.env.SESSION_SECRET || "daleel-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  }),
);

app.use("/auth", authRoutes);
app.use("/services", servicesRoutes);
app.use("/categories", categoriesRoutes);
app.use("/users", usersRoutes);
app.use("/votes", votesRouter);
app.use("/settings", settingsRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Daleel API is running",
    endpoints: ["/auth", "/services", "/categories", "/users", "/votes", "/settings", "/chat"],
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;