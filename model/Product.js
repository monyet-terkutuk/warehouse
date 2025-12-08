// models/Product.js
const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const productSchema = new Schema(
    {
        // Rp (Hpp barang /pis)*
        hpp_per_piece: {
            type: Schema.Types.Decimal128,
            required: true,
            get: (v) => (v ? parseFloat(v.toString()) : v),
            set: (v) => (v !== undefined && v !== null ? mongoose.Types.Decimal128.fromString(String(v)) : v),
        },

        // #NAMA PRODUK# (nama umum / label produk)
        product_name: {
            type: String,
            required: true,
            trim: true,
        },

        // Kategori*
        category: {
            type: String,
            required: true,
            trim: true,
        },

        // Kode Barang*
        code: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },

        // Nama Barang*
        name: {
            type: String,
            required: true,
            trim: true,
        },

        // Variasi barang* (mis. warna/ukuran)
        variation: {
            type: String,
            required: true,
            trim: true,
        },

        // satuan* (pcs, kg, m, dll)
        unit: {
            type: String,
            required: true,
            trim: true,
        },

        // #Masuk#
        stock_in: {
            type: Number,
            default: 0,
            min: 0,
        },

        // #Keluar#
        stock_out: {
            type: Number,
            default: 0,
            min: 0,
        },

        // #Total Stock# (opsional, akan dihitung otomatis jika tidak diberikan)
        total_stock: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Database Lokasi (lokasi penyimpanan / warehouse)
        location: {
            type: String,
            default: null,
            trim: true,
        },

        image_url: {
            type: String,
            default: null,
            trim: true,
        },

        // opsional: referensi lokasi jika punya collection lokasi
        // locationRef: { type: Types.ObjectId, ref: 'Location', default: null },
    },
    {
        timestamps: true,
        toJSON: { getters: true }, // agar Decimal128 jadi number saat JSON.stringify
        toObject: { getters: true },
    }
);

// Pre-save: hitung total_stock otomatis
productSchema.pre("save", function (next) {
    if (this.isModified("stock_in") || this.isModified("stock_out") || this.isNew) {
        const inQty = Number(this.stock_in) || 0;
        const outQty = Number(this.stock_out) || 0;
        this.total_stock = Math.max(0, inQty - outQty);
    }
    next();
});

// Method: tambah / kurangi stok
productSchema.methods.adjustStock = function (deltaIn = 0, deltaOut = 0) {
    this.stock_in = (Number(this.stock_in) || 0) + Number(deltaIn || 0);
    this.stock_out = (Number(this.stock_out) || 0) + Number(deltaOut || 0);
    this.total_stock = Math.max(0, Number(this.stock_in) - Number(this.stock_out));
    return this.save();
};


module.exports = model("Product", productSchema);
