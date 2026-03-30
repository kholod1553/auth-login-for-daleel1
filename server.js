import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js"; 

dotenv.config();

const app = express(); 

app.use(express.json());

app.use("/auth", authRoutes);
app.use(servicesRoutes); // ← أو "/services", servicesRoutes لو عايز prefix

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000 🚀");
});
