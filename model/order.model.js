const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    // Exact variant selected by the user
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variant',
        required: true
    },

    // Example: 2 L, 5 kg, 3 pieces
    quantity: {
        type: Number,
        required: true,
        min: [0.001, 'Quantity must be greater than 0']
    },

    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'L', 'ml', 'piece']
    },

    // Snapshot price at the time of confirmation
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // When inventory was reserved
    reservationDate: {
        type: Date,
        required: true
    },

    // When reservation expires
    expiresAt: {
        type: Date,
        required: true
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },

    orderStatus: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'expired',
            'cancelled'
        ],
        default: 'pending'
    }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);