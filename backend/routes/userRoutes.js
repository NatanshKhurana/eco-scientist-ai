const express = require("express");

const router = express.Router();

const userController = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

// ========================
// Auth
// ========================

router.post("/signup", userController.signup);

router.post("/login", userController.login);

router.post("/logout", userController.logout);

// ========================
// Profile
// ========================

router.get("/profile", authMiddleware, userController.getProfile);

router.get("/me", authMiddleware, userController.getMe);

module.exports = router;
