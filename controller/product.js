const express = require("express");
const router = express.Router();
const Product = require("../model/Product");
const Validator = require("fastest-validator");
const v = new Validator();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ✅ Schema validasi (pakai snake_case)
const productSchema = {
    hpp_per_piece: { type: "number", positive: true, optional: false },
    product_name: { type: "string", empty: false, max: 255 },
    category: { type: "string", empty: false, max: 255 },
    code: { type: "string", empty: false, max: 100 },
    name: { type: "string", empty: false, max: 255 },
    variation: { type: "string", empty: false, max: 255 },
    unit: { type: "string", empty: false, max: 50 },
    stock_in: { type: "number", integer: true, min: 0, optional: true },
    stock_out: { type: "number", integer: true, min: 0, optional: true },
    total_stock: { type: "number", integer: true, min: 0, optional: true },
    location: { type: "string", optional: true, max: 255 },
};

// ==========================================================
// ✅ CREATE PRODUCT
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, productSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const { code } = req.body;
        const existing = await Product.findOne({ code });
        if (existing) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Product code already exists",
            });
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Product created successfully",
            data: product,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL PRODUCTS
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({
            code: 200,
            status: "success",
            message: "Products retrieved successfully",
            data: products,
        });
    })
);

// ==========================================================
// ✅ READ - GET PRODUCT BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Product not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Product retrieved successfully",
            data: product,
        });
    })
);

// ==========================================================
// ✅ UPDATE PRODUCT
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, { ...productSchema, code: { type: "string", optional: true } });
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Product not found",
            });
        }

        // Update field sesuai body
        Object.keys(req.body).forEach((key) => {
            product[key] = req.body[key];
        });

        await product.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Product updated successfully",
            data: product,
        });
    })
);

// ==========================================================
// ✅ DELETE PRODUCT
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Product not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Product deleted successfully",
        });
    })
);

module.exports = router;
