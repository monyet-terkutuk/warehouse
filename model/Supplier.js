// models/Supplier.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const supplierSchema = new Schema(
    {
        // Nama Supplier (wajib)
        name: {
            type: String,
            required: true,
            trim: true,
        },

        // Nomor Telepon (opsional)
        phone: {
            type: String,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = model("Supplier", supplierSchema);
