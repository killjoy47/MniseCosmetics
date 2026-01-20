const { Product, Sale } = require('./models');

const parseAssistantQuery = async (query, role) => {
    const q = query.toLowerCase().trim();

    // --- STOCK QUERIES ---
    if (q.includes('stock') || q.includes('reste') || q.includes('combien')) {
        const products = await Product.find();

        // Specific product check
        const targetProd = products.find(p => q.includes(p.name.toLowerCase()));
        if (targetProd) {
            return `Il reste actuellement **${targetProd.stock}** unités de **${targetProd.name}**.`;
        }

        // Low stock check
        if (q.includes('bas') || q.includes('alerte')) {
            const low = products.filter(p => p.stock <= (p.securityStock || 0));
            if (low.length === 0) return "Tous les stocks sont corrects ! ✅";
            return `Attention, les produits suivants sont bas : ${low.map(p => `\n- **${p.name}** (${p.stock} restants)`).join('')}`;
        }

        return `Vous avez **${products.length}** types de produits en rayon. Pour un produit précis, demandez par exemple "Stock de Bella".`;
    }

    // --- SALES QUERIES (Admin only for full details) ---
    if (q.includes('vente') || q.includes('bilan') || q.includes('encaissé') || q.includes('gagné')) {
        let queryDate = new Date();
        let dateLabel = "aujourd'hui";

        if (q.includes('hier')) {
            queryDate.setDate(queryDate.getDate() - 1);
            dateLabel = "hier";
        }

        const start = new Date(queryDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(queryDate);
        end.setUTCHours(23, 59, 59, 999);

        const sales = await Sale.find({ createdAt: { $gte: start, $lte: end } });
        const total = sales.reduce((acc, s) => acc + s.totalPrice, 0);

        if (role !== 'admin' && !q.includes('mon')) {
            return "Désolé, seul le patron peut voir le bilan global. Demandez 'mon bilan' pour voir vos propres ventes.";
        }

        if (sales.length === 0) return `Aucune vente enregistrée pour ${dateLabel}.`;

        return `Le bilan pour **${dateLabel}** est de **${total.toLocaleString()} FCFA** (${sales.length} ventes).`;
    }

    return "Je ne suis pas sûr de comprendre. Je peux vous aider sur les **stocks** ou le **bilan des ventes**. Essayez : 'Stock Bella' ou 'Bilan aujourd'hui'.";
};

module.exports = { parseAssistantQuery };
