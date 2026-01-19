import React, { useEffect, useState } from 'react';
import GlassCard from './ui/GlassCard';
import GoldButton from './ui/GoldButton';
import { socket, getProducts, sellProducts } from '../services/api';
import { ShoppingCart, Check, Trash2, LogOut, Tags } from 'lucide-react';

const SellerDashboard = ({ onLogout }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');

    // Custom Price State
    const [customTotal, setCustomTotal] = useState('');
    const [isEditingPrice, setIsEditingPrice] = useState(false);

    useEffect(() => {
        getProducts().then(setProducts);
        socket.on('stock_update', setProducts);
        return () => socket.off('stock_update');
    }, []);

    const addToCart = (product) => {
        if (product.stock === 0) return;
        setCart(prev => {
            setCustomTotal(''); // Reset custom price on cart change
            setIsEditingPrice(false);
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => {
            setCustomTotal('');
            setIsEditingPrice(false);
            return prev.filter(item => item.product.id !== id);
        });
    };

    const calculatedTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const finalPrice = isEditingPrice && customTotal ? Number(customTotal) : calculatedTotal;

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const items = cart.map(item => ({ id: item.product.id, quantity: item.quantity }));
        const res = await sellProducts(items, finalPrice);

        if (res.success) {
            setCart([]);
            setCustomTotal('');
            setIsEditingPrice(false);
            setSuccessMsg('Vente effectuée !');
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            alert("Erreur: " + res.message);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Product Grid */}
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ color: 'var(--color-gold)', fontFamily: 'Playfair Display' }}>M'NISE COSMETICS</h1>
                        <p style={{ color: '#888' }}>Espace Vente</p>
                    </div>
                    <button onClick={onLogout} style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LogOut size={16} /> Quitter
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {products.map(p => (
                        <GlassCard
                            key={p.id}
                            onClick={() => addToCart(p)}
                            style={{
                                cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                                opacity: p.stock > 0 ? 1 : 0.5,
                                transition: 'transform 0.1s',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                            onMouseEnter={(e) => p.stock > 0 && (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => p.stock > 0 && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div style={{ height: '80px', background: '#222', borderRadius: '8px', marginBottom: '10px' }}></div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '5px' }}>{p.name}</h3>
                            <p style={{ color: '#888', fontSize: '0.8rem' }}>{p.category}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{p.price} €</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>Stock: {p.stock}</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <GlassCard style={{ width: '400px', margin: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShoppingCart /> Panier
                </h2>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cart.length === 0 && <p style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>Le panier est vide</p>}
                    {cart.map(item => (
                        <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div>
                                <p style={{ fontWeight: '500' }}>{item.product.name}</p>
                                <p style={{ fontSize: '0.8rem', color: '#888' }}>{item.quantity} x {item.product.price} €</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>{item.quantity * item.product.price} €</span>
                                <button onClick={() => removeFromCart(item.product.id)} style={{ color: '#ff6b6b' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1rem', color: '#888' }}>
                            <span>Total Calculé</span>
                            <span>{calculatedTotal} €</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.4rem', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Tags size={20} /> A Payer</span>
                            {isEditingPrice ? (
                                <input
                                    type="number" autoFocus
                                    value={customTotal}
                                    onChange={e => setCustomTotal(e.target.value)}
                                    onBlur={() => { if (!customTotal) setIsEditingPrice(false) }}
                                    style={{
                                        background: 'transparent', border: 'none', borderBottom: '2px solid var(--color-gold)',
                                        color: 'var(--color-gold)', fontSize: '1.4rem', width: '100px', textAlign: 'right', outline: 'none'
                                    }}
                                />
                            ) : (
                                <span onClick={() => setIsEditingPrice(true)} style={{ cursor: 'pointer', borderBottom: '1px dashed #666' }}>
                                    {finalPrice} €
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', textAlign: 'right' }}>
                            {isEditingPrice ? 'Entrez le montant final' : 'Cliquez sur le prix pour modifier'}
                        </p>
                    </div>

                    {successMsg && (
                        <div style={{ background: 'rgba(75, 201, 130, 0.2)', color: '#4bc982', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Check size={18} /> {successMsg}
                        </div>
                    )}

                    <GoldButton onClick={handleCheckout} disabled={cart.length === 0} style={{ width: '100%' }}>
                        Valider la vente
                    </GoldButton>
                </div>
            </GlassCard>
        </div>
    );
};

export default SellerDashboard;
