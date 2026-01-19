require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { Product, Category, User } = require('./models');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn("⚠️  MONGO_URI manquant dans le fichier .env !");
            console.warn("   L'application ne fonctionnera pas correctement sans base de données.");
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connecté');
        initData(); // Seed initial data if empty
    } catch (err) {
        console.error('❌ Erreur Connexion MongoDB:', err.message);
    }
};

const initData = async () => {
    // Seed default Categories
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
        await Category.insertMany([{ name: "Soins" }, { name: "Parfums" }, { name: "Maquillage" }]);
        console.log("Categories initialisées");
    }
    // Seed default Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        await User.insertMany([
            { role: 'admin', password: 'admin' },
            { role: 'seller', password: '123' },
            { role: 'masterKey', password: '0000' }
        ]);
        console.log("Utilisateurs initialisés");
    }
};

connectDB();

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { role, password } = req.body;
    try {
        const user = await User.findOne({ role });
        if (user && user.password === password) {
            res.json({ success: true, role });
        } else {
            res.status(401).json({ success: false, message: "Mot de passe incorrect" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur Serveur" });
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { masterKey, newAdminPwd, newSellerPwd } = req.body;
    try {
        const master = await User.findOne({ role: 'masterKey' });
        if (master && master.password === masterKey) {
            if (newAdminPwd) await User.findOneAndUpdate({ role: 'admin' }, { password: newAdminPwd });
            if (newSellerPwd) await User.findOneAndUpdate({ role: 'seller' }, { password: newSellerPwd });
            res.json({ success: true, message: "Mots de passe mis à jour" });
        } else {
            res.status(403).json({ success: false, message: "Code Master incorrect" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- PRODUCTS & CATEGORIES ---
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    // Rename _id to id for frontend compatibility if needed, or handle in frontend. 
    // Mongoose uses _id. Let's map it.
    const mapped = products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category
    }));
    res.json(mapped);
});

app.post('/api/products', async (req, res) => {
    const { id, name, price, stock, category } = req.body;
    try {
        if (id) {
            await Product.findByIdAndUpdate(id, { name, price, stock, category });
        } else {
            await Product.create({ name, price, stock, category });
        }

        const products = await Product.find();
        const mapped = products.map(p => ({
            id: p._id,
            name: p.name, price: p.price, stock: p.stock, category: p.category
        }));

        io.emit('stock_update', mapped);
        res.json({ success: true, products: mapped });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/categories', async (req, res) => {
    const cats = await Category.find();
    res.json(cats.map(c => c.name));
});

app.post('/api/categories', async (req, res) => {
    const { categories } = req.body; // Expects simplified list handling from logic v1
    // Actually, v1 logic sent full array. Let's adapt. 
    // The frontend sends the full list of strings. We should sync.
    // For simplicity, we just ensure they exist. 
    // Or, simpler: just add the new ones.
    // The frontend logic was: push new cat to list, save list.
    // Let's perform a "Sync": delete all and re-insert is brutal.
    // Better: upsert.

    try {
        for (const catName of categories) {
            const exists = await Category.findOne({ name: catName });
            if (!exists) await Category.create({ name: catName });
        }
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- SALES ---
app.post('/api/sell', async (req, res) => {
    const { items, totalPrice } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of items) {
            const product = await Product.findById(item.id).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Stock insuffisant pour ${product ? product.name : 'un article'}`);
            }
            product.stock -= item.quantity;
            await product.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        const products = await Product.find();
        const mapped = products.map(p => ({
            id: p._id, name: p.name, price: p.price, stock: p.stock, category: p.category
        }));
        io.emit('stock_update', mapped);

        res.json({ success: true, message: "Vente enregistrée" });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: err.message });
    }
});

io.on('connection', async (socket) => {
    console.log('Client connected');
    const products = await Product.find();
    const mapped = products.map(p => ({
        id: p._id, name: p.name, price: p.price, stock: p.stock, category: p.category
    }));
    socket.emit('stock_update', mapped);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
