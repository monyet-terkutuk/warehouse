// models/TipeNota.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const tipeNotaSchema = new Schema(
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

module.exports = model("TipeNota", tipeNotaSchema);
