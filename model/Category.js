// models/TipeNota.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const categorySchema = new Schema(
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

module.exports = model("Category", categorySchema);
