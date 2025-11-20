const express = require("express");
const router = express.Router();
const Supplier = require("../model/Supplier");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ==========================================================
// ✅ Schema validasi Supplier
// ==========================================================
const supplierSchema = {
    name: { type: "string", empty: false, max: 255 },
    phone: { type: "string", optional: true, max: 50 },
};

// ==========================================================
// ✅ CREATE SUPPLIER
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, supplierSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const supplier = await Supplier.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Supplier created successfully",
            data: supplier,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL SUPPLIERS
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Suppliers retrieved successfully",
            data: suppliers,
        });
    })
);

// ==========================================================
// ✅ READ - GET SUPPLIER BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Supplier not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Supplier retrieved successfully",
            data: supplier,
        });
    })
);

// ==========================================================
// ✅ UPDATE SUPPLIER
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, {
            ...supplierSchema,
        });

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Supplier not found",
            });
        }

        Object.keys(req.body).forEach((key) => {
            supplier[key] = req.body[key];
        });

        await supplier.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Supplier updated successfully",
            data: supplier,
        });
    })
);

// ==========================================================
// ✅ DELETE SUPPLIER
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Supplier not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Supplier deleted successfully",
        });
    })
);

module.exports = router;
