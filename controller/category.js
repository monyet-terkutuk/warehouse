const express = require("express");
const router = express.Router();
const Category = require("../model/Category");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ==========================================================
// ✅ Schema Validasi
// ==========================================================
const categorySchema = {
    name: { type: "string", empty: false, max: 255 },
};

// ==========================================================
// ✅ CREATE CATEGORY
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, categorySchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const existing = await Category.findOne({ name: req.body.name.trim() });
        if (existing) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Category already exists",
            });
        }

        const category = await Category.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Category created successfully",
            data: category,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL CATEGORY
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const data = await Category.find().sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Category list retrieved successfully",
            data,
        });
    })
);

// ==========================================================
// ✅ READ - GET CATEGORY BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Category not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Category retrieved successfully",
            data: category,
        });
    })
);

// ==========================================================
// ✅ UPDATE CATEGORY
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, categorySchema);

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Category not found",
            });
        }

        // prevent duplicate name
        if (req.body.name) {
            const exists = await Category.findOne({
                name: req.body.name.trim(),
                _id: { $ne: req.params.id },
            });

            if (exists) {
                return res.status(400).json({
                    code: 400,
                    status: "error",
                    message: "Category name already exists",
                });
            }
        }

        Object.keys(req.body).forEach((key) => {
            category[key] = req.body[key];
        });

        await category.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Category updated successfully",
            data: category,
        });
    })
);

// ==========================================================
// ✅ DELETE CATEGORY
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Category not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Category deleted successfully",
        });
    })
);

module.exports = router;
