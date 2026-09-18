const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();

// ==============================
// Middlewares
// ==============================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

// ==============================
// Health Check
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "Eco Scientist AI Backend Running 🚀",
  });
});

// ==============================
// Routes
// ==============================

const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/chat", chatRoutes);

app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

// ==============================
// Server
// ==============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
