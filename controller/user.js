const express = require("express");
const router = express.Router();
const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Validator = require("fastest-validator");
const v = new Validator();

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

/**
 * @route   POST /register
 * @desc    Register new user
 */
router.post("/register", async (req, res, next) => {
  try {
    const schema = {
      name: { type: "string", empty: false, max: 255 },
      email: { type: "email", empty: false },
      password: { type: "string", empty: false, min: 8, max: 255 },
      confirm_password: { type: "string", empty: false, min: 8, max: 255 },
      phone_number: { type: "string", optional: true, max: 15 },
    };

    const { body } = req;
    const validation = v.validate(body, schema);

    if (validation !== true) {
      return res.status(400).json({
        code: 400,
        status: "error",
        data: { error: "Validation failed", details: validation },
      });
    }

    // ✅ Pastikan password dan konfirmasi sama
    if (body.password !== body.confirm_password) {
      return res.status(400).json({
        code: 400,
        status: "error",
        data: { error: "Password and confirm password do not match" },
      });
    }

    const email_used = await User.findOne({ email: body.email });
    const name_used = await User.findOne({ name: body.name });

    if (email_used || name_used) {
      return res.status(400).json({
        code: 400,
        status: "error",
        data: {
          error: email_used ? "Email has been used" : "Name has been used",
        },
      });
    }

    const hashed_password = bcrypt.hashSync(body.password, 10);

    const user = await User.create({
      name: body.name,
      email: body.email,
      password: hashed_password,
      phone: body.phone_number || null,
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


/**
 * @route   POST /login
 * @desc    Authenticate user and return token
 */
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  const schema = {
    email: { type: "email", empty: false },
    password: { type: "string", min: 8, empty: false },
  };

  try {
    const validation = v.validate(req.body, schema);
    if (validation !== true) {
      return res.status(400).json({
        meta: {
          message: "Validation failed",
          code: 400,
          status: "error",
        },
        data: validation,
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({
        meta: {
          message: "Invalid email or password",
          code: 401,
          status: "error",
        },
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        meta: {
          message: "Invalid email or password",
          code: 401,
          status: "error",
        },
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      meta: {
        message: "Authentication successful",
        code: 200,
        status: "success",
      },
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

/**
 * @route   GET /list
 * @desc    Get all users
 */
router.get(
  "/list",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      meta: {
        message: "Users retrieved successfully",
        code: 200,
        status: "success",
      },
      data: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      })),
    });
  })
);

/**
 * @route   GET /:id
 * @desc    Get user by ID
 */
router.get(
  "/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "User not found",
        data: null,
      });
    }

    res.status(200).json({
      meta: {
        message: "User retrieved successfully",
        code: 200,
        status: "success",
      },
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  })
);

/**
 * @route   DELETE /delete/:id
 * @desc    Delete user by ID
 */
router.delete(
  "/delete/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "User deleted successfully",
    });
  })
);

module.exports = router;
