// models/TipeNota.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const lokasiSimpanSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

    },
    {
        timestamps: true,
    }
);

module.exports = model("LokasiSimpan", lokasiSimpanSchema);
