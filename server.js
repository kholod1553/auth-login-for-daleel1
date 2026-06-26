import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js";
import categoriesRoutes from "./routes/categories.js";
import usersRoutes from "./routes/users.js";
import votesRouter from "./routes/votes.js";
import settingsRoutes from "./routes/settings.js";
import chatRoutes from "./routes/chat.js";
import commentsRouter from "./routes/comments.js";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);

const createFallbackSessionMiddleware = () => (req, res, next) => {
  req.session = {
    destroy(callback) {
      if (typeof callback === "function") callback();
    },
  };
  next();
};

const loadSessionMiddleware = async () => {
  try {
    const { default: session } = await import("express-session");

    return session({
      secret: process.env.SESSION_SECRET || "daleel-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "lax",
      },
    });
  } catch (error) {
    console.warn(
      "express-session is unavailable; using stateless session fallback.",
    );
    return createFallbackSessionMiddleware();
  }
};

app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(await loadSessionMiddleware());

app.use("/auth", authRoutes);
app.use("/services", servicesRoutes);
app.use("/categories", categoriesRoutes);
app.use("/users", usersRoutes);
app.use("/votes", votesRouter);
app.use("/settings", settingsRoutes);
app.use("/chat", chatRoutes);
app.use("/comments", commentsRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Daleel API is running",
    endpoints: ["/auth", "/services", "/categories", "/users", "/votes", "/settings", "/chat", "/comments"],
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled backend error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.status || 500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "production"
        ? "Unexpected backend error"
        : error.message,
  });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
