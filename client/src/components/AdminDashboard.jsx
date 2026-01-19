import React, { useEffect, useState } from 'react';
import GlassCard from './ui/GlassCard';
import GoldButton from './ui/GoldButton';
import { socket, saveProduct, getProducts, getCategories, saveCategories } from '../services/api';
import { Plus, Edit, List, Package } from 'lucide-react';

const AdminDashboard = ({ onLogout }) => {
    const [tab, setTab] = useState('products'); // 'products' | 'categories'
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Modals
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Product Form
    const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '' });

    // Category Form
    const [newCatName, setNewCatName] = useState('');

    useEffect(() => {
        getProducts().then(setProducts);
        getCategories().then(setCategories);

        socket.on('stock_update', (updatedProducts) => {
            setProducts(updatedProducts);
        });

        return () => socket.off('stock_update');
    }, []);

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const product = {
            ...formData,
            id: editingProduct ? editingProduct.id : undefined,
            price: Number(formData.price),
            stock: Number(formData.stock)
        };
        await saveProduct(product);
        closeProdModal();
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName || categories.includes(newCatName)) return;
        const newCats = [...categories, newCatName];
        await saveCategories(newCats);
        setCategories(newCats);
        setNewCatName('');
    };

    const openProdModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({ name: '', price: '', stock: '', category: categories[0] || '' });
        }
        setIsProdModalOpen(true);
    };

    const closeProdModal = () => {
        setIsProdModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'var(--color-gold)', fontFamily: 'Playfair Display' }}>M'NISE COSMETICS</h1>
                    <p style={{ color: '#888' }}>Dashboard Patronne</p>
                </div>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                    <nav style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setTab('products')}
                            style={{ color: tab === 'products' ? 'var(--color-gold)' : '#666', fontWeight: 'bold' }}
                        >
                            Produits
                        </button>
                        <button
                            onClick={() => setTab('categories')}
                            style={{ color: tab === 'categories' ? 'var(--color-gold)' : '#666', fontWeight: 'bold' }}
                        >
                            Catégories
                        </button>
                    </nav>
                    <button onClick={onLogout} style={{ color: '#888', textDecoration: 'underline' }}>Déconnexion</button>
                </div>
            </header>

            {tab === 'products' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <GlassCard>
                            <h3 style={{ color: '#888', fontSize: '0.9rem' }}>Total Produits</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{products.length}</p>
                        </GlassCard>
                        <GlassCard>
                            <h3 style={{ color: '#888', fontSize: '0.9rem' }}>Valeur Stock</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>
                                {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()} €
                            </p>
                        </GlassCard>
                        <GoldButton onClick={() => openProdModal()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Plus size={24} /> Nouveau Produit
                        </GoldButton>
                    </div>

                    <GlassCard style={{ overflow: 'hidden', padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                                <tr>
                                    <th style={{ padding: '15px 24px' }}>Nom</th>
                                    <th style={{ padding: '15px 24px' }}>Catégorie</th>
                                    <th style={{ padding: '15px 24px' }}>Prix</th>
                                    <th style={{ padding: '15px 24px' }}>Stock</th>
                                    <th style={{ padding: '15px 24px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '15px 24px', fontWeight: '500' }}>{p.name}</td>
                                        <td style={{ padding: '15px 24px', color: '#888' }}>{p.category}</td>
                                        <td style={{ padding: '15px 24px' }}>{p.price} €</td>
                                        <td style={{ padding: '15px 24px', color: p.stock < 5 ? '#ff6b6b' : 'inherit' }}>{p.stock}</td>
                                        <td style={{ padding: '15px 24px' }}>
                                            <button onClick={() => openProdModal(p)} style={{ color: 'var(--color-gold)' }}>
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </>
            )}

            {tab === 'categories' && (
                <GlassCard style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <List /> Gestion des Catégories
                    </h2>

                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                        <input
                            placeholder="Nouvelle catégorie..."
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <GoldButton type="submit">Ajouter</GoldButton>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categories.map((cat, idx) => (
                            <div key={idx} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Package size={18} color="var(--color-gold)" />
                                {cat}
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Product Modal */}
            {isProdModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <GlassCard style={{ width: '500px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--color-gold)' }}>
                            {editingProduct ? 'Modifier Produit' : 'Ajouter Produit'}
                        </h2>
                        <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                placeholder="Nom du produit"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={inputStyle} required
                            />
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <input
                                    placeholder="Prix" type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    style={inputStyle} required
                                />
                                <input
                                    placeholder="Stock" type="number"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    style={inputStyle} required
                                />
                            </div>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="">Sélectionner une catégorie</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={closeProdModal} style={{ color: '#888', padding: '10px' }}>Annuler</button>
                                <GoldButton type="submit">Enregistrer</GoldButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

const inputStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid #444',
    padding: '12px',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    width: '100%'
};

export default AdminDashboard;
