import React, { useEffect, useState } from 'react';
import GlassCard from './ui/GlassCard';
import GoldButton from './ui/GoldButton';
import { socket, getProducts, sellProducts } from '../services/api';
import { ShoppingCart, Check, Trash2, LogOut, Tags, AlertTriangle } from 'lucide-react';

const SellerDashboard = ({ onLogout }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');

    // Custom Price & Client State
    const [customTotal, setCustomTotal] = useState('');
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [clientNumber, setClientNumber] = useState('');
    const [mobileTab, setMobileTab] = useState('products'); // 'products' | 'cart'

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
        if (!clientNumber) {
            alert("Veuillez entrer le numéro du client avant de valider la vente.");
            return;
        }

        const items = cart.map(item => ({ id: item.product.id, quantity: item.quantity }));
        const res = await sellProducts(items, finalPrice, clientNumber);

        if (res.success) {
            setCart([]);
            setCustomTotal('');
            setClientNumber('');
            setIsEditingPrice(false);
            setSuccessMsg('Vente effectuée !');
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            alert("Erreur: " + res.message);
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Main Content (Products) */}
            <div className="main-content" style={{ display: (window.innerWidth > 1024 || mobileTab === 'products') ? 'block' : 'none' }}>
                <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ color: 'var(--color-gold)', fontFamily: 'Playfair Display' }}>M'NISE COSMETICS</h1>
                        <p style={{ color: '#888' }}>Espace Vente</p>
                    </div>
                    <button onClick={onLogout} style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LogOut size={16} /> Quitter
                    </button>
                </header>

                <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {products.map(p => (
                        <GlassCard
                            key={p.id}
                            className="premium-card"
                            onClick={() => addToCart(p)}
                            style={{
                                cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                                opacity: p.stock > 0 ? 1 : 0.5,
                                transition: 'all 0.2s ease',
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '16px'
                            }}
                            onMouseEnter={(e) => p.stock > 0 && (e.currentTarget.style.transform = 'translateY(-5px)')}
                            onMouseLeave={(e) => p.stock > 0 && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div style={{ flex: 1 }}></div>
                            <div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '2px', color: '#fff' }}>{p.name}</h3>
                                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '8px' }}>{p.category}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold', fontSize: '1rem' }}>{p.price} FCFA</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: p.stock === 0 ? '#ff4757' : (p.stock <= p.securityStock ? '#ffa502' : '#2ed573')
                                        }}></div>
                                        <span style={{ fontSize: '0.7rem', color: '#888' }}>{p.stock}</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <GlassCard className="sidebar-container" style={{ display: (window.innerWidth > 1024 || mobileTab === 'cart') ? 'flex' : 'none', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <ShoppingCart /> Panier
                    </h2>
                    {window.innerWidth <= 1024 && (
                        <button onClick={() => setMobileTab('products')} style={{ color: 'var(--color-gold)', fontSize: '0.9rem' }}>Retour</button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cart.length === 0 && <p style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>Le panier est vide</p>}
                    {cart.map(item => (
                        <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div>
                                <p style={{ fontWeight: '500' }}>{item.product.name}</p>
                                <p style={{ fontSize: '0.8rem', color: '#888' }}>{item.quantity} x {item.product.price} FCFA</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>{item.quantity * item.product.price} FCFA</span>
                                <button onClick={() => removeFromCart(item.product.id)} style={{ color: '#ff6b6b' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1rem', color: '#888' }}>
                            <span>Total Calculé</span>
                            <span>{calculatedTotal} FCFA</span>
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
                                    {finalPrice} FCFA
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Numéro du client"
                            value={clientNumber}
                            onChange={e => setClientNumber(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid #444',
                                borderRadius: '8px', color: '#fff', padding: '10px',
                                marginTop: '15px', width: '100%', outline: 'none'
                            }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px', textAlign: 'right' }}>
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

            {/* Mobile Bottom Navigation Bar */}
            {window.innerWidth <= 1024 && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'rgba(26,26,26,0.95)', borderTop: '1px solid #333',
                    padding: '10px 20px', display: 'flex', justifyContent: 'space-around',
                    backdropFilter: 'blur(10px)', zIndex: 1000
                }}>
                    <button
                        onClick={() => setMobileTab('products')}
                        style={{ color: mobileTab === 'products' ? 'var(--color-gold)' : '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                    >
                        <ShoppingCart size={20} />
                        <span style={{ fontSize: '0.7rem' }}>Boutique</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('cart')}
                        style={{ color: mobileTab === 'cart' ? 'var(--color-gold)' : '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', position: 'relative' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <Tags size={20} />
                            {cart.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-5px', right: '-10px',
                                    background: 'var(--color-gold)', color: '#000',
                                    fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold'
                                }}>{cart.length}</span>
                            )}
                        </div>
                        <span style={{ fontSize: '0.7rem' }}>Panier</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
