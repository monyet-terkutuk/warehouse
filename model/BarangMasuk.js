// models/BarangMasuk.js (diperbaiki)
const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const BarangMasukSchema = new Schema(
    {
        // ... field definitions sama seperti sebelumnya
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        note_type: {
            type: Types.ObjectId,
            ref: "TipeNota",
            required: true,
        },
        supplier: {
            type: Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        note_number: {
            type: String,
            required: true,
            trim: true,
        },
        additional_notes: {
            type: String,
            default: "",
            trim: true,
        },
        product: {
            type: Types.ObjectId,
            ref: "Product",
            required: true,
        },
        qty_in: {
            type: Number,
            required: true,
            min: 0,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
        },
        entered_by: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },
        storage_location: {
            type: Types.ObjectId,
            ref: "LokasiSimpan",
            required: true,
        },
        hpp: {
            type: Schema.Types.Decimal128,
            required: true,
            get: (v) => (v ? parseFloat(v.toString()) : v),
            set: (v) => (v !== undefined && v !== null ? mongoose.Types.Decimal128.fromString(String(v)) : v),
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    }
);

// Middleware: Update stok produk ketika ada barang masuk
BarangMasukSchema.post("save", async function (doc) {
    try {
        const Product = mongoose.model("Product");
        await Product.findByIdAndUpdate(
            doc.product,
            {
                $inc: {
                    stock_in: doc.qty_in,
                    total_stock: doc.qty_in
                }
            }
        );
    } catch (error) {
        console.error("Error updating product stock:", error);
    }
});

// Middleware: Update stok produk ketika data dihapus
BarangMasukSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        try {
            const Product = mongoose.model("Product");
            await Product.findByIdAndUpdate(
                doc.product,
                {
                    $inc: {
                        stock_in: -doc.qty_in,
                        total_stock: -doc.qty_in
                    }
                }
            );
        } catch (error) {
            console.error("Error reverting product stock:", error);
        }
    }
});

module.exports = model("BarangMasuk", BarangMasukSchema);