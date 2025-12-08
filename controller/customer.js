const express = require("express");
const router = express.Router();
const Customer = require("../model/Customer");
const Validator = require("fastest-validator");
const v = new Validator();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// ==========================================================
// ✅ Schema Validasi Customer
// ==========================================================
const customerSchema = {
    name: { type: "string", empty: false, max: 255 },
    email: { type: "string", optional: true, max: 255 },
    phone: { type: "string", optional: true, max: 50 },
    address: { type: "string", optional: true, max: 500 },
};

// ==========================================================
// ✅ CREATE CUSTOMER
// ==========================================================
router.post(
    "/",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const validation = v.validate(req.body, customerSchema);
        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        // Cek email sudah ada atau belum
        if (req.body.email) {
            const exists = await Customer.findOne({ email: req.body.email });
            if (exists) {
                return res.status(400).json({
                    code: 400,
                    status: "error",
                    message: "Email already registered",
                });
            }
        }

        const customer = await Customer.create(req.body);

        res.status(201).json({
            code: 201,
            status: "success",
            message: "Customer created successfully",
            data: customer,
        });
    })
);

// ==========================================================
// ✅ GET ALL CUSTOMERS
// ==========================================================
router.get(
    "/list",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json({
            code: 200,
            status: "success",
            message: "Customers retrieved successfully",
            data: customers,
        });
    })
);

// ==========================================================
// ✅ GET CUSTOMER BY ID
// ==========================================================
router.get(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Customer not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Customer retrieved successfully",
            data: customer,
        });
    })
);

// ==========================================================
// ✅ UPDATE CUSTOMER
// ==========================================================
router.put(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const validation = v.validate(req.body, {
            ...customerSchema,
            email: { type: "string", optional: true },
        });

        if (validation !== true) {
            return res.status(400).json({
                code: 400,
                status: "error",
                message: "Validation failed",
                details: validation,
            });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Customer not found",
            });
        }

        // Cek email duplikat ketika update
        if (req.body.email && req.body.email !== customer.email) {
            const exists = await Customer.findOne({ email: req.body.email });
            if (exists) {
                return res.status(400).json({
                    code: 400,
                    status: "error",
                    message: "Email already registered",
                });
            }
        }

        // Update semua field sesuai body
        Object.keys(req.body).forEach((key) => {
            customer[key] = req.body[key];
        });

        await customer.save();

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Customer updated successfully",
            data: customer,
        });
    })
);

// ==========================================================
// ✅ DELETE CUSTOMER
// ==========================================================
router.delete(
    "/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "Customer not found",
            });
        }

        res.status(200).json({
            code: 200,
            status: "success",
            message: "Customer deleted successfully",
        });
    })
);

module.exports = router;
