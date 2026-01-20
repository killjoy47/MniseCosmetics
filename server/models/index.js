const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: false },
    securityStock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const userSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true }, // 'admin', 'seller', 'masterKey'
    password: { type: String, required: true }
});

const saleSchema = new mongoose.Schema({
    clientNumber: { type: String, required: false },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number
    }],
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    Product: mongoose.model('Product', productSchema),
    Category: mongoose.model('Category', categorySchema),
    User: mongoose.model('User', userSchema),
    Sale: mongoose.model('Sale', saleSchema)
};
