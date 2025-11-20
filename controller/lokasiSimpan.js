const express = require("express");
const router = express.Router();
const LokasiSimpan = require("../model/LokasiSimpan");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ==========================================================
// ✅ Schema Validasi
// ==========================================================
const lokasiSchema = {
    name: { type: "string", empty: false, max: 255 },
};

// ==========================================================
// ✅ CREATE LOKASI SIMPAN
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, lokasiSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const lokasi = await LokasiSimpan.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Lokasi simpan created successfully",
            data: lokasi,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL LOKASI SIMPAN
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const lokasi = await LokasiSimpan.find().sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Lokasi simpan retrieved successfully",
            data: lokasi,
        });
    })
);

// ==========================================================
// ✅ READ - GET BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const lokasi = await LokasiSimpan.findById(req.params.id);

        if (!lokasi) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Lokasi simpan not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Lokasi simpan retrieved successfully",
            data: lokasi,
        });
    })
);

// ==========================================================
// ✅ UPDATE LOKASI SIMPAN
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, lokasiSchema);

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const lokasi = await LokasiSimpan.findById(req.params.id);

        if (!lokasi) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Lokasi simpan not found",
            });
        }

        Object.keys(req.body).forEach((key) => {
            lokasi[key] = req.body[key];
        });

        await lokasi.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Lokasi simpan updated successfully",
            data: lokasi,
        });
    })
);

// ==========================================================
// ✅ DELETE LOKASI SIMPAN
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const lokasi = await LokasiSimpan.findByIdAndDelete(req.params.id);

        if (!lokasi) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Lokasi simpan not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Lokasi simpan deleted successfully",
        });
    })
);

module.exports = router;
