require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { Product, Category, User, Sale } = require('./models');
const { parseAssistantQuery } = require('./assistant');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Authorization Middleware
const auth = (roles = []) => {
    return (req, res, next) => {
        const userRole = req.headers['x-role'];
        if (!userRole) return res.status(401).json({ message: "Role non spécifié (Security Header)" });
        if (roles.length && !roles.includes(userRole)) {
            return res.status(403).json({ message: "Accès refusé : privilèges insuffisants" });
        }
        req.userRole = userRole;
        next();
    };
};

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

app.post('/api/reset-password', auth(['admin']), async (req, res) => {
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
app.get('/api/products', auth(['admin', 'seller']), async (req, res) => {
    const products = await Product.find();
    // Rename _id to id for frontend compatibility if needed, or handle in frontend. 
    // Mongoose uses _id. Let's map it.
    const mapped = products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category,
        securityStock: p.securityStock || 0
    }));
    res.json(mapped);
});

app.post('/api/products', auth(['admin']), async (req, res) => {
    const { id, name, price, stock, category, securityStock } = req.body;
    try {
        if (id) {
            await Product.findByIdAndUpdate(id, { name, price, stock, category, securityStock });
        } else {
            await Product.create({ name, price, stock, category, securityStock });
        }

        const products = await Product.find();
        const mapped = products.map(p => ({
            id: p._id,
            name: p.name, price: p.price, stock: p.stock, category: p.category, securityStock: p.securityStock || 0
        }));

        io.emit('stock_update', mapped);
        res.json({ success: true, products: mapped });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/categories', auth(['admin', 'seller']), async (req, res) => {
    const cats = await Category.find();
    res.json(cats.map(c => c.name));
});

app.post('/api/categories', auth(['admin']), async (req, res) => {
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
app.post('/api/sell', auth(['admin', 'seller']), async (req, res) => {
    const { items, totalPrice, clientNumber } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const soldItems = [];
        for (const item of items) {
            const product = await Product.findById(item.id).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Stock insuffisant pour ${product ? product.name : 'un article'}`);
            }
            product.stock -= item.quantity;
            await product.save({ session });

            soldItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }

        const sale = new Sale({
            clientNumber,
            items: soldItems,
            totalPrice
        });
        await sale.save({ session });

        await session.commitTransaction();
        session.endSession();

        const products = await Product.find();
        const mapped = products.map(p => ({
            id: p._id, name: p.name, price: p.price, stock: p.stock, category: p.category, securityStock: p.securityStock || 0
        }));
        io.emit('stock_update', mapped);

        res.json({ success: true, message: "Vente enregistrée" });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: err.message });
    }
});

app.get('/api/sales', auth(['admin', 'seller']), async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};

        console.log(`[GET /api/sales] Request Date: ${date || 'ALL'}`);

        if (date) {
            // Robust UTC parsing
            const startStr = `${date}T00:00:00.000Z`;
            const endStr = `${date}T23:59:59.999Z`;
            const start = new Date(startStr);
            const end = new Date(endStr);

            console.log(`[GET /api/sales] UTC Range: ${startStr} TO ${endStr}`);
            query = { createdAt: { $gte: start, $lte: end } };
        }

        const sales = await Sale.find(query).sort({ createdAt: -1 });
        console.log(`[GET /api/sales] Found ${sales.length} sales`);
        res.json(sales);
    } catch (err) {
        console.error(`[GET /api/sales] Error: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/assistant', auth(['admin', 'seller']), async (req, res) => {
    const { query, role } = req.body;
    try {
        const response = await parseAssistantQuery(query, role);
        res.json({ response });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

io.on('connection', async (socket) => {
    console.log('Client connected');
    const products = await Product.find();
    const mapped = products.map(p => ({
        id: p._id, name: p.name, price: p.price, stock: p.stock, category: p.category, securityStock: p.securityStock || 0
    }));
    socket.emit('stock_update', mapped);
});

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
