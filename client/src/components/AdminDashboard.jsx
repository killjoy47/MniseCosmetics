import React, { useEffect, useState } from 'react';
import GlassCard from './ui/GlassCard';
import GoldButton from './ui/GoldButton';
import Assistant from './Assistant';
import { socket, saveProduct, getProducts, getCategories, saveCategories, getSales } from '../services/api';
import { Plus, Edit, List, Package, History, AlertTriangle, PlusCircle } from 'lucide-react';

const AdminDashboard = ({ onLogout }) => {
    const [tab, setTab] = useState('products'); // 'products' | 'categories' | 'sales'
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sales, setSales] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoadingSales, setIsLoadingSales] = useState(false);
    const [salesError, setSalesError] = useState('');

    // Modals
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Product Form
    const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '' });

    // Category Form
    const [newCatName, setNewCatName] = useState('');

    // Replenishment State
    const [selCategory, setSelCategory] = useState('');
    const [selProduct, setSelProduct] = useState(null);
    const [addQty, setAddQty] = useState(1);
    const [stockSuccess, setStockSuccess] = useState('');

    useEffect(() => {
        getProducts().then(setProducts);
        getCategories().then(setCategories);

        socket.on('stock_update', (updatedProducts) => {
            setProducts(updatedProducts);
        });

        return () => socket.off('stock_update');
    }, []);

    const fetchSales = async () => {
        setIsLoadingSales(true);
        setSalesError('');
        try {
            const data = await getSales(filterDate);
            setSales(data);
        } catch (err) {
            setSalesError("Erreur lors de la récupération des ventes.");
            console.error(err);
        } finally {
            setIsLoadingSales(false);
        }
    };

    useEffect(() => {
        if (tab === 'sales') {
            fetchSales();
        }
    }, [tab, filterDate]);

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const product = {
            ...formData,
            id: editingProduct ? editingProduct.id : undefined,
            price: Number(formData.price),
            stock: Number(formData.stock),
            securityStock: Number(formData.securityStock || 0)
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
            setFormData({ name: '', price: '', stock: '', category: categories[0] || '', securityStock: '' });
        }
        setIsProdModalOpen(true);
    };

    const closeProdModal = () => {
        setIsProdModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'var(--color-gold)', fontFamily: 'Playfair Display' }}>M'NISE COSMETICS</h1>
                    <p style={{ color: '#888' }}>Dashboard Patronne</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <nav style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '10px' }}>
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
                        <button
                            onClick={() => setTab('stock')}
                            style={{ color: tab === 'stock' ? 'var(--color-gold)' : '#666', fontWeight: 'bold' }}
                        >
                            Stock +
                        </button>
                        <button
                            onClick={() => setTab('sales')}
                            style={{ color: tab === 'sales' ? 'var(--color-gold)' : '#666', fontWeight: 'bold' }}
                        >
                            Historique
                        </button>
                        <button
                            onClick={() => setTab('assistant')}
                            style={{ color: tab === 'assistant' ? 'var(--color-gold)' : '#666', fontWeight: 'bold' }}
                        >
                            Assistant ✨
                        </button>
                    </nav>
                    <button onClick={onLogout} style={{ color: '#888', textDecoration: 'underline' }}>Déconnexion</button>
                </div>
            </header>

            {tab === 'stock' && (
                <GlassCard style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
                    <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PlusCircle color="var(--color-gold)" /> Réapprovisionnement
                    </h2>
                    <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                        Utilisez ce formulaire pour ajouter de la quantité à un produit existant.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Catégorie</label>
                            <select
                                value={selCategory}
                                onChange={e => { setSelCategory(e.target.value); setSelProduct(null); }}
                                style={inputStyle}
                            >
                                <option value="">Choisir une catégorie...</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Produit</label>
                            <select
                                value={selProduct?.id || ''}
                                onChange={e => setSelProduct(products.find(p => p.id === e.target.value))}
                                style={inputStyle}
                                disabled={!selCategory}
                            >
                                <option value="">Choisir un produit...</option>
                                {products.filter(p => p.category === selCategory).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Stock actuel: {p.stock})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Quantité à ajouter</label>
                            <input
                                type="number" min="1"
                                value={addQty}
                                onChange={e => setAddQty(Number(e.target.value))}
                                style={inputStyle}
                            />
                        </div>

                        {stockSuccess && (
                            <div style={{ background: 'rgba(75, 201, 130, 0.2)', color: '#4bc982', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                {stockSuccess}
                            </div>
                        )}

                        <GoldButton
                            disabled={!selProduct || addQty <= 0}
                            onClick={async () => {
                                const newStock = selProduct.stock + addQty;
                                await saveProduct({ ...selProduct, stock: newStock });
                                setStockSuccess(`Stock mis à jour : ${selProduct.name} (+${addQty})`);
                                setAddQty(1);
                                setTimeout(() => setStockSuccess(''), 3000);
                            }}
                            style={{ marginTop: '10px' }}
                        >
                            Augmenter le stock
                        </GoldButton>
                    </div>
                </GlassCard>
            )}
            {tab === 'products' && (
                <>
                    <div className="product-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                        <GlassCard style={{ padding: '15px' }}>
                            <h3 style={{ color: '#888', fontSize: '0.8rem' }}>Total Produits</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{products.length}</p>
                        </GlassCard>
                        <GlassCard style={{ padding: '15px' }}>
                            <h3 style={{ color: '#888', fontSize: '0.8rem' }}>Valeur Stock</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>
                                {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()} FCFA
                            </p>
                        </GlassCard>
                        <GoldButton onClick={() => openProdModal()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <Plus size={20} /> Nouveau
                        </GoldButton>
                    </div>

                    <GlassCard style={{ overflowX: 'auto', padding: 0 }}>
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
                                        <td style={{ padding: '15px 24px' }}>{p.price.toLocaleString()} FCFA</td>
                                        <td style={{ padding: '15px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '10px', height: '10px', borderRadius: '50%',
                                                    background: p.stock === 0 ? '#ff4757' : (p.stock <= p.securityStock ? '#ffa502' : '#2ed573')
                                                }}></div>
                                                <span>{p.stock}</span>
                                                {p.stock <= p.securityStock && p.stock > 0 && <AlertTriangle size={14} color="#ffa502" />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 24px', display: 'flex', gap: '10px' }}>
                                            <button onClick={() => openProdModal(p)} style={{ color: 'var(--color-gold)' }} title="Modifier">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => { setSelCategory(p.category); setSelProduct(p); setTab('stock'); }} style={{ color: '#2ed573' }} title="Réapprovisionner">
                                                <PlusCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </>
            )}

            {tab === 'sales' && (
                <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label htmlFor="sales-date-picker" style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '0.9rem' }}>Choisir une date</label>
                            <input
                                id="sales-date-picker"
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)', borderColor: 'var(--color-gold)' }}
                            />
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
                                <button
                                    onClick={() => setFilterDate('')}
                                    style={{ fontSize: '0.8rem', color: 'var(--color-gold)', textDecoration: 'underline' }}
                                >
                                    Tout voir
                                </button>
                                <button
                                    onClick={fetchSales}
                                    style={{ fontSize: '0.8rem', color: '#888', textDecoration: 'underline' }}
                                >
                                    Actualiser
                                </button>
                            </div>
                        </div>
                        <GlassCard style={{ flex: 2, padding: '20px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--color-gold)' }}>
                            <h3 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Bilan de la journée</h3>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>
                                {sales.reduce((acc, s) => acc + s.totalPrice, 0).toLocaleString()} FCFA
                            </p>
                        </GlassCard>
                    </div>

                    <GlassCard style={{ overflow: 'hidden', padding: 0 }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History color="var(--color-gold)" />
                            <h2 style={{ fontSize: '1.2rem' }}>
                                Historique des Ventes
                                {filterDate ? ` (${new Date(filterDate).toLocaleDateString('fr-FR')})` : ' (Toutes les dates)'}
                            </h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                                    <tr>
                                        <th style={{ padding: '15px 24px' }}>Heure</th>
                                        <th style={{ padding: '15px 24px' }}>Client</th>
                                        <th style={{ padding: '15px 24px' }}>Articles</th>
                                        <th style={{ padding: '15px 24px' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingSales ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gold)' }}>Chargement des ventes...</td>
                                        </tr>
                                    ) : salesError ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#ff4757' }}>{salesError}</td>
                                        </tr>
                                    ) : sales.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Aucune vente ce jour-là.</td>
                                        </tr>
                                    ) : (
                                        sales.map(sale => (
                                            <tr key={sale._id} style={{ borderBottom: '1px solid #333' }}>
                                                <td style={{ padding: '15px 24px', fontSize: '0.9rem' }}>
                                                    {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: '15px 24px', fontWeight: 'bold' }}>{sale.clientNumber || 'Anonyme'}</td>
                                                <td style={{ padding: '15px 24px', color: '#888', fontSize: '0.9rem' }}>
                                                    {sale.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                                                </td>
                                                <td style={{ padding: '15px 24px', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                                                    {sale.totalPrice.toLocaleString()} FCFA
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </>
            )}
            {tab === 'assistant' && (
                <Assistant role="admin" />
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
                            <div>
                                <label style={labelStyle}>Nom du produit</label>
                                <input
                                    placeholder="Nom du produit"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={inputStyle} required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                                <div>
                                    <label style={labelStyle}>Prix (FCFA)</label>
                                    <input
                                        placeholder="Prix (FCFA)" type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        style={inputStyle} required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Stock</label>
                                    <input
                                        placeholder="Stock" type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        style={inputStyle} required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Seuil Sécurité</label>
                                    <input
                                        placeholder="Seuil Sécurité" type="number"
                                        value={formData.securityStock}
                                        onChange={e => setFormData({ ...formData, securityStock: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Catégorie</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={closeProdModal} style={{ color: '#888', padding: '10px' }}>Annuler</button>
                                <GoldButton type="submit">Valider</GoldButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div >
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

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    color: '#888',
    marginBottom: '8px'
};

export default AdminDashboard;
