const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();

app.use(cors());

app.use(express.json());

// Health Check

app.get("/", (req, res) => {
  res.json({
    message: "Eco Scientist AI Backend Running 🚀",
  });
});

// Routes

const chatRoutes = require("./routes/chatRoutes");

const userRoutes = require("./routes/userRoutes");

app.use("/api/chat", chatRoutes);

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
