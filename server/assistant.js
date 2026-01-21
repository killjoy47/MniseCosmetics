const { Product, Sale } = require('./models');

const parseAssistantQuery = async (query, role) => {
    const q = query.toLowerCase().trim();

    // --- WRITE ACTIONS (Admin Only) ---
    if (role === 'admin') {
        // Change Name: e.g. "Change le nom de Bosie en Bosie Gold"
        if (q.includes('change') && q.includes('nom') && q.includes('en')) {
            const match = q.match(/change le nom de (.+) en (.+)/i);
            if (match) {
                const oldName = match[1].trim();
                const newName = match[2].trim();
                const product = await Product.findOne({ name: new RegExp(`^${oldName}$`, 'i') });
                if (product) {
                    product.name = newName;
                    await product.save();
                    return `C'est fait ! Le produit **${oldName}** s'appelle désormais **${newName}**. ✅`;
                }
                return `Désolé, je n'ai pas trouvé de produit nommé "${oldName}".`;
            }
        }

        // Add Stock: e.g. "Ajoute 10 au stock de Bosie"
        if (q.includes('ajoute') && q.includes('stock')) {
            const match = q.match(/ajoute (\d+) (au stock de|de) (.+)/i);
            if (match) {
                const amount = parseInt(match[1]);
                const prodName = match[3].trim();
                const product = await Product.findOne({ name: new RegExp(`^${prodName}$`, 'i') });
                if (product) {
                    product.stock += amount;
                    await product.save();
                    return `Parfait ! J'ai ajouté ${amount} unités. Le stock de **${product.name}** est maintenant de **${product.stock}**. ✅`;
                }
                return `Je n'ai pas trouvé le produit "${prodName}" pour ajouter du stock.`;
            }
        }
    } else if (q.includes('ajoute') || q.includes('change') || q.includes('modifie')) {
        return "Désolé, seule la patronne peut modifier les données via l'assistant. 🔐";
    }

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
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);
        let dateLabel = "aujourd'hui";

        // Reset times for range calculations
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);

        if (q.includes('hier')) {
            start.setUTCDate(start.getUTCDate() - 1);
            end.setUTCDate(end.getUTCDate() - 1);
            dateLabel = "hier";
        } else if (q.includes('semaine')) {
            // Get Monday of current week
            const day = now.getUTCDay(); // 0 (Sun) to 6 (Sat)
            const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
            start.setUTCDate(diff);
            dateLabel = "cette semaine";
        } else if (q.includes('mois')) {
            start.setUTCDate(1);
            dateLabel = "ce mois-ci";
        } else if (q.includes('an') || q.includes('année')) {
            start.setUTCMonth(0, 1);
            dateLabel = "cette année";
        }

        const sales = await Sale.find({ createdAt: { $gte: start, $lte: end } });
        const total = sales.reduce((acc, s) => acc + s.totalPrice, 0);

        if (role !== 'admin' && !q.includes('mon')) {
            return "Désolé, seul le patron peut voir le bilan global. Demandez 'mon bilan' pour voir vos propres ventes.";
        }

        if (sales.length === 0) return `Aucune vente enregistrée pour ${dateLabel}.`;

        return `Le bilan pour **${dateLabel}** est de **${total.toLocaleString()} FCFA** (${sales.length} ventes).`;
    }

    return "Je ne suis pas sûr de comprendre. Je peux vous aider sur les **stocks** ou le **bilan des ventes**. Essayez : 'Stock Bella', 'Ajoute 5 au stock de Bosie' ou 'Bilan aujourd'hui'.";
};

module.exports = { parseAssistantQuery };
