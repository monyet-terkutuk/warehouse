const express = require("express");
const router = express.Router();
const TipeNota = require("../model/TipeNota");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ==========================================================
// ✅ Schema Validasi
// ==========================================================
const tipeNotaSchema = {
    name: { type: "string", empty: false, max: 255 },
};

// ==========================================================
// ✅ CREATE TIPE NOTA
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, tipeNotaSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const tipeNota = await TipeNota.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Tipe nota created successfully",
            data: tipeNota,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL TIPE NOTA
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const data = await TipeNota.find().sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Tipe nota retrieved successfully",
            data,
        });
    })
);

// ==========================================================
// ✅ READ - GET TIPE NOTA BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const tipeNota = await TipeNota.findById(req.params.id);

        if (!tipeNota) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Tipe nota not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Tipe nota retrieved successfully",
            data: tipeNota,
        });
    })
);

// ==========================================================
// ✅ UPDATE TIPE NOTA
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, tipeNotaSchema);

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const tipeNota = await TipeNota.findById(req.params.id);

        if (!tipeNota) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Tipe nota not found",
            });
        }

        Object.keys(req.body).forEach((key) => {
            tipeNota[key] = req.body[key];
        });

        await tipeNota.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Tipe nota updated successfully",
            data: tipeNota,
        });
    })
);

// ==========================================================
// ✅ DELETE TIPE NOTA
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const tipeNota = await TipeNota.findByIdAndDelete(req.params.id);

        if (!tipeNota) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Tipe nota not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Tipe nota deleted successfully",
        });
    })
);

module.exports = router;
