const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// ======================================
// Generate Token
// ======================================

const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};

// ======================================
// Set Cookie
// ======================================

const setTokenCookie = (res, token) => {
  res.cookie(
    "token",

    token,

    {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  );
};

// ======================================
// Signup
// ======================================

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,

        message: "All fields required",
      });
    }

    const exists = await User.findOne({
      email,
    });

    if (exists) {
      return res.status(400).json({
        success: false,

        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,

      email,

      password: hashedPassword,
    });

    const token = generateToken(user._id);

    setTokenCookie(res, token);

    res.status(201).json({
      success: true,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ======================================
// Login
// ======================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,

        message: "Email and password required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        success: false,

        message: "Invalid credentials",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,

        message: "User password missing",
      });
    }

    const match = await bcrypt.compare(
      password,

      user.password,
    );

    if (!match) {
      return res.status(401).json({
        success: false,

        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    setTokenCookie(res, token);

    res.json({
      success: true,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ======================================
// Logout
// ======================================

exports.logout = async (req, res) => {
  res.clearCookie("token");

  res.json({
    success: true,

    message: "Logged out successfully",
  });
};
