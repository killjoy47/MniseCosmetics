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

    return "Je ne suis pas sûr de comprendre. Je peux vous aider sur les **stocks** ou les **produits**. Essayez : 'Stock Bella' ou 'Ajoute 5 au stock de Bosie'.";
};

module.exports = { parseAssistantQuery };
