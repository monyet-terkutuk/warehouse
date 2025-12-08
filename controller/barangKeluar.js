const express = require("express");
const router = express.Router();
const SalesOut = require("../model/BarangKeluar");
const Product = require("../model/Product");
const Customer = require("../model/Customer");
const TipeNota = require("../model/TipeNota");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ==========================================================
// 📌 VALIDATION SCHEMA
// ==========================================================
const salesOutSchema = {
    date: { type: "date", convert: true },
    note_type_id: { type: "string", empty: false },
    customer_id: { type: "string", optional: true },
    note_number: { type: "string", optional: true }, // otomatis dibuat jika tidak diisi
    additional_info: { type: "string", optional: true },
    product_id: { type: "string", empty: false },
    qty_out: { type: "number", positive: true },
    handled_by: { type: "string", empty: false },
    location_id: { type: "string", optional: true },
};

// ==========================================================
// 📌 CREATE SALES OUT
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const validation = v.validate(req.body, salesOutSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        // ====== Ambil detail product untuk snapshot ======
        const product = await Product.findById(req.body.product_id);
        if (!product) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Product not found",
            });
        }

        // ====== Auto-generate note_number jika kosong ======
        let noteNumber = req.body.note_number;
        if (!noteNumber) {
            noteNumber = "NT-" + Date.now();
        }

        // Hitung total_hpp
        const total_hpp = product.hpp_per_piece * req.body.qty_out;

        const newSales = await SalesOut.create({
            ...req.body,
            note_number: noteNumber,
            product_name_snapshot: product.product_name,
            hpp_snapshot: product.hpp_per_piece,
            unit_snapshot: product.unit,
            total_hpp,
        });

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Sales Out created successfully",
            data: newSales,
        });
    })
);

// ==========================================================
// 📌 GET ALL SALES OUT
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const data = await SalesOut.find()
            .populate("customer_id")
            .populate("note_type_id")
            .populate("product_id")
            .populate("location_id")
            .populate("handled_by")
            .sort({ date: -1 });

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Sales Out data retrieved successfully",
            data,
        });
    })
);

// ==========================================================
// 📌 GET SALES OUT BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const data = await SalesOut.findById(req.params.id)
            .populate("customer_id")
            .populate("note_type_id")
            .populate("product_id")
            .populate("location_id")
            .populate("handled_by");

        if (!data) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Sales Out not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Sales Out retrieved successfully",
            data,
        });
    })
);

// ==========================================================
// 📌 UPDATE SALES OUT
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const validation = v.validate(req.body, {
            ...salesOutSchema,
            note_number: { type: "string", optional: true },
        });

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const sales = await SalesOut.findById(req.params.id);
        if (!sales) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Sales Out not found",
            });
        }

        // Jika product diganti → refresh snapshot
        if (req.body.product_id && req.body.product_id !== String(sales.product_id)) {
            const product = await Product.findById(req.body.product_id);
            if (!product) {
                return res.status(404).json({
                    code: 404,
                    status: "error",
                    message: "Product not found",
                });
            }

            sales.product_name_snapshot = product.product_name;
            sales.hpp_snapshot = product.hpp_per_piece;
            sales.unit_snapshot = product.unit;
        }

        // Hitung ulang total_hpp
        const hpp = req.body.hpp_snapshot || sales.hpp_snapshot;
        const qty = req.body.qty_out || sales.qty_out;
        sales.total_hpp = hpp * qty;

        // Update field satu-per-satu
        Object.keys(req.body).forEach((key) => {
            sales[key] = req.body[key];
        });

        await sales.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Sales Out updated successfully",
            data: sales,
        });
    })
);

// ==========================================================
// 📌 DELETE SALES OUT
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const deleted = await SalesOut.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Sales Out not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Sales Out deleted successfully",
        });
    })
);

module.exports = router;
