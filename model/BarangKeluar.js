// models/SalesOut.js
const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const salesOutSchema = new Schema(
    {
        // ===========================
        // 1. Tanggal
        // ===========================
        date: {
            type: Date,
            required: true,
        },

        // ===========================
        // 2. Relasi ke TipeNota
        // ===========================
        note_type_id: {
            type: Types.ObjectId,
            ref: "TipeNota",
            required: true,
        },

        // ===========================
        // 3. Relasi Customer
        // ===========================
        customer_id: {
            type: Types.ObjectId,
            ref: "Customer",
            required: false,
            default: null,
        },

        // ===========================
        // 4. Nomor Nota
        // ===========================
        note_number: {
            type: String,
            required: true,
            trim: true,
        },

        // ===========================
        // 5. Keterangan Tambahan
        // ===========================
        additional_info: {
            type: String,
            trim: true,
            default: null,
        },

        // ===========================
        // 6. Relasi Produk
        // ===========================
        product_id: {
            type: Types.ObjectId,
            ref: "Product",
            required: true,
        },

        // Nama produk snapshot (optional, supaya tidak berubah)
        product_name_snapshot: {
            type: String,
            required: false,
            trim: true,
        },

        // HPP snapshot (mengambil dari Product saat create)
        hpp_snapshot: {
            type: Number,
            required: false,
            min: 0,
        },

        // ===========================
        // 7. Jumlah keluarnya
        // ===========================
        qty_out: {
            type: Number,
            required: true,
            min: 1,
        },

        // Unit (satuan) snapshot
        unit_snapshot: {
            type: String,
            trim: true,
        },

        // ===========================
        // 8. User yang menginput
        // ===========================
        handled_by: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ===========================
        // 9. Lokasi pengambilan
        // ===========================
        location_id: {
            type: Types.ObjectId,
            ref: "LokasiSimpan",
            required: false, // opsional, tergantung kebutuhan
        },

        // ===========================
        // 10. Total HPP (qty * hpp)
        // ===========================
        total_hpp: {
            type: Number,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = model("SalesOut", salesOutSchema);
