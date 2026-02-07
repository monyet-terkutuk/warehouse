const express = require("express");
const router = express.Router();
const Product = require("../model/Product");
const Validator = require("fastest-validator");
const v = new Validator();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

const SalesOut = require("../model/BarangKeluar");
const BarangMasuk = require("../model/BarangMasuk");

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
    image_url: { type: "string", optional: true, max: 500 },
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


// ==========================================================
// ✅ DASHBOARD SUMMARY
// ==========================================================
router.get(
    "/dashboard/summary",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        try {
            // 1. Get all products
            const allProducts = await Product.find();

            // 2. Calculate summary
            const totalProduct = allProducts.length;
            const totalProductLowStock = allProducts.filter(product =>
                product.total_stock <= 10 // Anggap low stock jika <= 10
            ).length;

            // 3. Calculate total HPP barang masuk
            const barangMasukList = await BarangMasuk.find();
            const totalHppBarangMasuk = barangMasukList.reduce((total, item) => {
                const hpp = item.hpp ? parseFloat(item.hpp.toString()) : 0;
                const qty = item.qty_in || 0;
                return total + (hpp * qty);
            }, 0);

            // 4. Calculate total HPP barang keluar
            const salesOutList = await SalesOut.find();
            const totalHppBarangKeluar = salesOutList.reduce((total, item) => {
                const hpp = item.hpp_snapshot || 0;
                const qty = item.qty_out || 0;
                return total + (hpp * qty);
            }, 0);

            // 5. Get top products by value (HPP * total stock)
            const valueTopProducts = allProducts
                .map(product => {
                    const hpp = product.hpp_per_piece ? parseFloat(product.hpp_per_piece.toString()) : 0;
                    const totalValue = hpp * (product.total_stock || 0);
                    return {
                        name: product.name,
                        total_value: totalValue,
                        percentage_product: ((product.total_stock || 0) / totalProduct * 100).toFixed(2) + '%'
                    };
                })
                .sort((a, b) => b.total_value - a.total_value)
                .slice(0, 2); // Ambil 2 teratas

            // 6. Get top selling products (berdasarkan quantity terjual)
            const topSellingAggregate = await SalesOut.aggregate([
                {
                    $group: {
                        _id: "$product_id",
                        total_qty_out: { $sum: "$qty_out" },
                        total_hpp_value: {
                            $sum: {
                                $multiply: ["$qty_out", "$hpp_snapshot"]
                            }
                        },
                        latest_sale: { $max: "$createdAt" }
                    }
                },
                { $sort: { total_qty_out: -1 } },
                { $limit: 5 } // Ambil 5 produk terlaris
            ]);

            // Get product details for top selling
            const topSellingProducts = [];
            for (const item of topSellingAggregate) {
                const product = await Product.findById(item._id).select("name category hpp_per_piece");
                if (product) {
                    topSellingProducts.push({
                        id: product._id.toString(),
                        name: product.name,
                        category: {
                            id: product.category, // Asumsi category adalah string, jika ObjectId perlu disesuaikan
                            name: product.category
                        },
                        total_qty: item.total_qty_out,
                        hpp: product.hpp_per_piece ? parseFloat(product.hpp_per_piece.toString()).toFixed(2) : "0.00",
                        total_qty_out: item.total_qty_out
                    });
                }
            }

            // 7. Calculate weekly revenue (HPP barang keluar per bulan)
            const weeklyRevenue = [];
            const currentYear = new Date().getFullYear();

            for (let month = 1; month <= 12; month++) {
                const startDate = new Date(currentYear, month - 1, 1);
                const endDate = new Date(currentYear, month, 0);

                const monthlySales = await SalesOut.find({
                    date: { $gte: startDate, $lte: endDate }
                });

                const monthlyRevenue = monthlySales.reduce((total, sale) => {
                    return total + ((sale.hpp_snapshot || 0) * (sale.qty_out || 0));
                }, 0);

                weeklyRevenue.push({
                    month: month,
                    revenue: monthlyRevenue
                });
            }

            // 8. Compose final response
            const response = {
                summary: {
                    total_product: totalProduct,
                    total_product_low_stok: totalProductLowStock,
                    total_hpp_barang_masuk: totalHppBarangMasuk,
                    total_hpp_barang_keluar: totalHppBarangKeluar
                },
                value_top_product: valueTopProducts,
                top_selling_product: topSellingProducts,
                weekly_revenue: weeklyRevenue
            };

            res.status(200).json({
                code: 200,
                status: "success",
                message: "Dashboard data retrieved successfully",
                data: response
            });

        } catch (error) {
            console.error("Dashboard error:", error);
            return next(new ErrorHandler("Error fetching dashboard data", 500));
        }
    })
);

// ==========================================================
// ✅ DASHBOARD - DATA UNTUK CHART
// ==========================================================
router.get(
    "/dashboard/chart-data",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { period = 'monthly' } = req.query; // monthly, weekly, yearly

            let chartData = [];
            const currentDate = new Date();

            if (period === 'monthly') {
                // Data 12 bulan terakhir
                for (let i = 11; i >= 0; i--) {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();

                    const startDate = new Date(year, month - 1, 1);
                    const endDate = new Date(year, month, 0);

                    const monthlySales = await SalesOut.find({
                        date: { $gte: startDate, $lte: endDate }
                    });

                    const revenue = monthlySales.reduce((total, sale) => {
                        return total + ((sale.hpp_snapshot || 0) * (sale.qty_out || 0));
                    }, 0);

                    chartData.push({
                        month: month,
                        year: year,
                        revenue: revenue
                    });
                }
            } else if (period === 'weekly') {
                // Data 8 minggu terakhir
                for (let i = 7; i >= 0; i--) {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() - (i * 7));
                    const startDate = new Date(endDate);
                    startDate.setDate(startDate.getDate() - 6);

                    const weeklySales = await SalesOut.find({
                        date: { $gte: startDate, $lte: endDate }
                    });

                    const revenue = weeklySales.reduce((total, sale) => {
                        return total + ((sale.hpp_snapshot || 0) * (sale.qty_out || 0));
                    }, 0);

                    chartData.push({
                        week: i + 1,
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0],
                        revenue: revenue
                    });
                }
            }

            res.status(200).json({
                code: 200,
                status: "success",
                message: "Chart data retrieved successfully",
                data: chartData
            });

        } catch (error) {
            console.error("Chart data error:", error);
            return next(new ErrorHandler("Error fetching chart data", 500));
        }
    })
);

// ==========================================================
// ✅ DASHBOARD - STOCK ALERT
// ==========================================================
router.get(
    "/dashboard/stock-alert",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { threshold = 10 } = req.query;

            const lowStockProducts = await Product.find({
                total_stock: { $lte: parseInt(threshold) }
            }).sort({ total_stock: 1 });

            res.status(200).json({
                code: 200,
                status: "success",
                message: "Low stock products retrieved successfully",
                data: lowStockProducts.map(product => ({
                    id: product._id,
                    name: product.name,
                    code: product.code,
                    current_stock: product.total_stock,
                    threshold: parseInt(threshold),
                    category: product.category,
                    unit: product.unit
                }))
            });

        } catch (error) {
            console.error("Stock alert error:", error);
            return next(new ErrorHandler("Error fetching stock alert data", 500));
        }
    })
);


module.exports = router;
