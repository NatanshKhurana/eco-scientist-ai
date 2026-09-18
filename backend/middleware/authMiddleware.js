const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================
// Protect Routes Using JWT Cookie
// ======================================

const authMiddleware = async (req, res, next) => {
  try {
    // Cookie check
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,

        message: "Authentication required",
      });
    }

    // Verify JWT

    const decoded = jwt.verify(
      token,

      process.env.JWT_SECRET,
    );

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,

        message: "Invalid token payload",
      });
    }

    // Find user

    const user = await User.findById(decoded.id)

      .select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,

        message: "User not found",
      });
    }

    // Attach user

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,

      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
