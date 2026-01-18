const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const vendorSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
        },
        phone: {
            type: String,
        },
        address: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = model('Vendor', vendorSchema);
