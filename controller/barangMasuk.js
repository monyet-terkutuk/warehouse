// controllers/BarangMasukController.js
const express = require("express");
const router = express.Router();
const BarangMasuk = require("../model/BarangMasuk");
const Product = require("../model/Product");
const Supplier = require("../model/Supplier");
const TipeNota = require("../model/TipeNota");
const LokasiSimpan = require("../model/LokasiSimpan");
const User = require("../model/User");
const Validator = require("fastest-validator");
const v = new Validator();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ✅ Schema validasi untuk Barang Masuk
const barangMasukValidationSchema = {
    date: { type: "date", convert: true, optional: false },
    note_type: { type: "string", empty: false, pattern: /^[0-9a-fA-F]{24}$/ },
    supplier: { type: "string", empty: false, pattern: /^[0-9a-fA-F]{24}$/ },
    note_number: { type: "string", empty: false, max: 255 },
    additional_notes: { type: "string", optional: true, max: 500 },
    product: { type: "string", empty: false, pattern: /^[0-9a-fA-F]{24}$/ },
    qty_in: { type: "number", positive: true, integer: true, min: 1 },
    unit: { type: "string", empty: false, max: 50 },
    entered_by: { type: "string", empty: false, pattern: /^[0-9a-fA-F]{24}$/ },
    storage_location: { type: "string", empty: false, pattern: /^[0-9a-fA-F]{24}$/ },
    hpp: { type: "number", positive: true, optional: false },
};

// ==========================================================
// ✅ CREATE BARANG MASUK
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, barangMasukValidationSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validasi gagal",
                details: validation,
            });
        }

        // Cek apakah product exists
        const product = await Product.findById(req.body.product);
        if (!product) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Produk tidak ditemukan",
            });
        }

        // Cek apakah supplier exists
        const supplier = await Supplier.findById(req.body.supplier);
        if (!supplier) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Supplier tidak ditemukan",
            });
        }

        // Cek apakah tipe nota exists
        const noteType = await TipeNota.findById(req.body.note_type);
        if (!noteType) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Tipe nota tidak ditemukan",
            });
        }

        // Cek apakah lokasi simpan exists
        const storageLocation = await LokasiSimpan.findById(req.body.storage_location);
        if (!storageLocation) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Lokasi simpan tidak ditemukan",
            });
        }

        // Cek apakah user exists
        const user = await User.findById(req.body.entered_by);
        if (!user) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "User tidak ditemukan",
            });
        }

        // Cek duplikasi nomor nota untuk supplier yang sama
        const existingNote = await BarangMasuk.findOne({
            note_number: req.body.note_number,
            supplier: req.body.supplier
        });
        if (existingNote) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Nomor nota sudah digunakan untuk supplier ini",
            });
        }

        // Gunakan nama variable yang berbeda
        const newBarangMasuk = await BarangMasuk.create(req.body);

        // Populate data untuk response
        const populatedData = await BarangMasuk.findById(newBarangMasuk._id)
            .populate("note_type")
            .populate("supplier")
            .populate("product")
            .populate("entered_by")
            .populate("storage_location");

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Barang masuk berhasil dicatat",
            data: populatedData,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL BARANG MASUK
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { page = 1, limit = 10, start_date, end_date, supplier, product } = req.query;

        // Build filter object
        let filter = {};

        // Filter by date range
        if (start_date && end_date) {
            filter.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date + 'T23:59:59.999Z')
            };
        } else if (start_date) {
            filter.date = { $gte: new Date(start_date) };
        } else if (end_date) {
            filter.date = { $lte: new Date(end_date + 'T23:59:59.999Z') };
        }

        // Filter by supplier
        if (supplier) {
            filter.supplier = supplier;
        }

        // Filter by product
        if (product) {
            filter.product = product;
        }

        const barangMasukList = await BarangMasuk.find(filter)
            .populate("note_type")
            .populate("supplier")
            .populate("product")
            .populate("entered_by")
            .populate("storage_location")
            .sort({ date: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await BarangMasuk.countDocuments(filter);

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Data barang masuk berhasil diambil",
            data: barangMasukList,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    })
);

// ==========================================================
// ✅ READ - GET BARANG MASUK BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const barangMasuk = await BarangMasuk.findById(req.params.id)
            .populate("note_type")
            .populate("supplier")
            .populate("product")
            .populate("entered_by")
            .populate("storage_location");

        if (!barangMasuk) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Data barang masuk tidak ditemukan",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Data barang masuk berhasil diambil",
            data: barangMasuk,
        });
    })
);

// ==========================================================
// ✅ UPDATE BARANG MASUK
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const validation = v.validate(req.body, {
            ...barangMasukValidationSchema,
            note_type: { ...barangMasukValidationSchema.note_type, optional: true },
            supplier: { ...barangMasukValidationSchema.supplier, optional: true },
            product: { ...barangMasukValidationSchema.product, optional: true },
            entered_by: { ...barangMasukValidationSchema.entered_by, optional: true },
            storage_location: { ...barangMasukValidationSchema.storage_location, optional: true },
        });

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validasi gagal",
                details: validation,
            });
        }

        const barangMasuk = await BarangMasuk.findById(req.params.id);
        if (!barangMasuk) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Data barang masuk tidak ditemukan",
            });
        }

        // Jika mengubah product, cek product baru是否存在
        if (req.body.product && req.body.product !== barangMasuk.product.toString()) {
            const product = await Product.findById(req.body.product);
            if (!product) {
                return res.status(404).json({
                    code: 404,
                    status: "error",
                    message: "Produk tidak ditemukan",
                });
            }
        }

        // Jika mengubah qty_in, perlu adjust stok
        if (req.body.qty_in !== undefined && req.body.qty_in !== barangMasuk.qty_in) {
            const oldQty = barangMasuk.qty_in;
            const newQty = req.body.qty_in;
            const difference = newQty - oldQty;

            // Update stok produk
            const product = await Product.findById(barangMasuk.product);
            if (product) {
                await product.adjustStock(difference, 0);
            }
        }

        // Update field
        Object.keys(req.body).forEach((key) => {
            if (key !== "product" || req.body.product === barangMasuk.product.toString()) {
                barangMasuk[key] = req.body[key];
            }
        });

        await barangMasuk.save();

        // Populate data untuk response
        const populatedData = await BarangMasuk.findById(barangMasuk._id)
            .populate("note_type")
            .populate("supplier")
            .populate("product")
            .populate("entered_by")
            .populate("storage_location");

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Data barang masuk berhasil diupdate",
            data: populatedData,
        });
    })
);

// ==========================================================
// ✅ DELETE BARANG MASUK
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const barangMasuk = await BarangMasuk.findByIdAndDelete(req.params.id);
        if (!barangMasuk) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Data barang masuk tidak ditemukan",
            });
        }

        // Note: Stok produk akan otomatis dikurangi oleh middleware di model

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Data barang masuk berhasil dihapus",
        });
    })
);

// ==========================================================
// ✅ GET STATISTIK BARANG MASUK
// ==========================================================
router.get(
    "/dashboard/stats",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { start_date, end_date } = req.query;

        let dateFilter = {};
        if (start_date && end_date) {
            dateFilter.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date + 'T23:59:59.999Z')
            };
        }

        // Total barang masuk
        const totalIncoming = await BarangMasuk.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalQty: { $sum: "$qty_in" },
                    totalValue: { $sum: { $multiply: ["$qty_in", "$hpp"] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Barang masuk per supplier
        const bySupplier = await BarangMasuk.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$supplier",
                    totalQty: { $sum: "$qty_in" },
                    totalValue: { $sum: { $multiply: ["$qty_in", "$hpp"] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalValue: -1 } },
            { $limit: 10 }
        ]);

        // Populate supplier names
        const bySupplierWithNames = await Promise.all(
            bySupplier.map(async (item) => {
                const supplier = await Supplier.findById(item._id);
                return {
                    ...item,
                    supplier_name: supplier ? supplier.name : 'Unknown'
                };
            })
        );

        const stats = {
            total_transactions: totalIncoming[0]?.count || 0,
            total_quantity: totalIncoming[0]?.totalQty || 0,
            total_value: totalIncoming[0]?.totalValue || 0,
            top_suppliers: bySupplierWithNames
        };

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Statistik barang masuk berhasil diambil",
            data: stats,
        });
    })
);

module.exports = router;