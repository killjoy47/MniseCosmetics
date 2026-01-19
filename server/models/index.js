const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const userSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true }, // 'admin', 'seller', 'masterKey'
    password: { type: String, required: true }
});

module.exports = {
    Product: mongoose.model('Product', productSchema),
    Category: mongoose.model('Category', categorySchema),
    User: mongoose.model('User', userSchema)
};
