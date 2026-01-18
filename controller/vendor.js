const express = require("express");
const router = express.Router();
const Vendor = require("../model/Vendor");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ✅ Schema validasi untuk Vendor
const vendorSchema = {
    name: { type: "string", empty: false, max: 255, label: "Vendor Name" },
    email: {
        type: "string",
        empty: false,
        max: 255,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        label: "Email",
        optional: true
    },
    phone: {
        type: "string",
        optional: true,
        max: 50,
        pattern: /^[\d\s\-\+\(\)]+$/,
        label: "Phone Number"
    },
    address: {
        type: "string",
        optional: true,
        max: 500,
        label: "Address"
    },
};

// ==========================================================
// ✅ CREATE VENDOR
// ==========================================================
router.post(
    "",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        // Validasi input
        const validation = v.validate(req.body, vendorSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        // Cek duplikasi email jika email diisi
        if (req.body.email) {
            const existingEmail = await Vendor.findOne({ email: req.body.email });
            if (existingEmail) {
                return res.status(400).json({
                    code: 400,
                    status: "error",
                    message: "Email already exists",
                });
            }
        }

        const vendor = await Vendor.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Vendor created successfully",
            data: vendor,
        });
    })
);

// ==========================================================
// ✅ READ - GET ALL VENDORS
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        // Tambahkan query parameters untuk filtering dan searching
        const { search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        let query = {};

        // Jika ada search parameter, tambahkan pencarian
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                ]
            };
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        const vendors = await Vendor.find(query).sort(sortOptions);

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Vendors retrieved successfully",
            data: vendors,
        });
    })
);

// ==========================================================
// ✅ READ - GET VENDOR BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        // Validasi ObjectId
        // if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        //     return res.status(400).json({
        //         code: 400,
        //         status: "error",
        //         message: "Invalid vendor ID format",
        //     });
        // }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Vendor not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Vendor retrieved successfully",
            data: vendor,
        });
    })
);

// ==========================================================
// ✅ READ - GET VENDOR BY EMAIL (OPTIONAL)
// ==========================================================
router.get(
    "/email/:email",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const vendor = await Vendor.findOne({ email: req.params.email });
        if (!vendor) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Vendor not found with this email",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Vendor retrieved successfully",
            data: vendor,
        });
    })
);

// ==========================================================
// ✅ UPDATE VENDOR
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        // Validasi ObjectId
        // if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        //     return res.status(400).json({
        //         code: 400,
        //         status: "error",
        //         message: "Invalid vendor ID format",
        //     });
        // }

        // Validasi input (semua field optional untuk update)
        const updateSchema = {
            name: { ...vendorSchema.name, optional: true },
            email: { ...vendorSchema.email, optional: true },
            phone: { ...vendorSchema.phone, optional: true },
            address: { ...vendorSchema.address, optional: true },
        };

        const validation = v.validate(req.body, updateSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        // Cek apakah vendor ada
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Vendor not found",
            });
        }

        // Cek duplikasi email jika email diupdate
        if (req.body.email && req.body.email !== vendor.email) {
            const existingEmail = await Vendor.findOne({
                email: req.body.email,
                _id: { $ne: req.params.id } // Exclude current vendor
            });
            if (existingEmail) {
                return res.status(400).json({
                    code: 400,
                    status: "error",
                    message: "Email already exists",
                });
            }
        }

        // Update field sesuai body
        Object.keys(req.body).forEach((key) => {
            vendor[key] = req.body[key];
        });

        await vendor.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Vendor updated successfully",
            data: vendor,
        });
    })
);

// ==========================================================
// ✅ DELETE VENDOR
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        // Validasi ObjectId
        // if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        //     return res.status(400).json({
        //         code: 400,
        //         status: "error",
        //         message: "Invalid vendor ID format",
        //     });
        // }

        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Vendor not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Vendor deleted successfully",
        });
    })
);

// ==========================================================
// ✅ SEARCH VENDORS (ALTERNATIVE ENDPOINT)
// ==========================================================
router.get(
    "/search/:keyword",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { keyword } = req.params;

        const vendors = await Vendor.find({
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { email: { $regex: keyword, $options: "i" } },
                { phone: { $regex: keyword, $options: "i" } },
                { address: { $regex: keyword, $options: "i" } }
            ]
        }).limit(20); // Limit hasil pencarian

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Search results retrieved successfully",
            data: vendors,
        });
    })
);

module.exports = router;