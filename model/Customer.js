const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const customerSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: false,
            trim: true,
            unique: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: false,
            trim: true,
        },

        address: {
            type: String,
            required: false,
            trim: true,
        },

    },
    {
        timestamps: true,
    }
);

module.exports = model("Customer", customerSchema);
