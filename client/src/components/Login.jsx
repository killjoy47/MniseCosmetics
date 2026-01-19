import React, { useState } from 'react';
import GlassCard from './ui/GlassCard';
import GoldButton from './ui/GoldButton';
import { Crown, ShoppingBag, Lock, KeyRound } from 'lucide-react';
import { login, resetPassword } from '../services/api';

const Login = ({ onLogin }) => {
    const [view, setView] = useState('main'); // main, login-admin, login-seller, reset
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Reset State
    const [masterKey, setMasterKey] = useState('');
    const [newAdminPwd, setNewAdminPwd] = useState('');
    const [newSellerPwd, setNewSellerPwd] = useState('');
    const [resetMsg, setResetMsg] = useState('');

    const handleLogin = async (role) => {
        const res = await login(role, password);
        if (res.success) {
            onLogin(role);
        } else {
            setError(res.message);
        }
    };

    const handleReset = async () => {
        const res = await resetPassword(masterKey, newAdminPwd, newSellerPwd);
        if (res.success) {
            setResetMsg('Mots de passe mis à jour !');
            setTimeout(() => setView('main'), 2000);
        } else {
            setResetMsg(res.message);
        }
    };

    const renderReset = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ color: 'var(--color-gold)', marginBottom: '10px' }}>Réinitialisation Système</h3>
            <input
                type="password" placeholder="Code Master (Clé de secours)"
                value={masterKey} onChange={e => setMasterKey(e.target.value)}
                style={inputStyle}
            />
            <div style={{ borderTop: '1px solid #333', margin: '10px 0' }}></div>
            <input
                type="text" placeholder="Nouveau mot de passe Patronne"
                value={newAdminPwd} onChange={e => setNewAdminPwd(e.target.value)}
                style={inputStyle}
            />
            <input
                type="text" placeholder="Nouveau mot de passe Vendeur"
                value={newSellerPwd} onChange={e => setNewSellerPwd(e.target.value)}
                style={inputStyle}
            />

            {resetMsg && <p style={{ color: resetMsg.includes('jour') ? '#4bc982' : '#ff6b6b' }}>{resetMsg}</p>}

            <GoldButton onClick={handleReset}>Valider</GoldButton>
            <button onClick={() => setView('main')} style={{ color: '#888', textDecoration: 'underline' }}>Annuler</button>
        </div>
    );

    const renderLogin = (role) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: '#fff' }}>Connexion {role === 'admin' ? 'Patronne' : 'Vendeur'}</h3>
            <input
                type="password"
                placeholder="Entrez le mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</p>}
            <GoldButton onClick={() => handleLogin(role)}>Entrer</GoldButton>
            <button
                onClick={() => { setView('main'); setError(''); setPassword(''); }}
                style={{ color: '#888', fontSize: '0.9rem', marginTop: '10px' }}
            >
                Retour
            </button>
        </div>
    );

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 100%)'
        }}>
            <GlassCard className="login-card" style={{ width: '400px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '10px', color: 'var(--color-gold)', fontSize: '2.5rem', fontFamily: 'Playfair Display' }}>M'NISE</h1>
                <h2 style={{ marginBottom: '40px', color: '#fff', fontSize: '1.2rem', letterSpacing: '4px' }}>COSMETICS</h2>

                {view === 'main' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <GoldButton onClick={() => setView('login-admin')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Crown size={20} />
                            Accès Patronne
                        </GoldButton>

                        <button
                            onClick={() => setView('login-seller')}
                            style={{
                                border: '1px solid #444',
                                padding: '12px',
                                borderRadius: '8px',
                                color: '#fff',
                                background: 'rgba(255,255,255,0.02)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            <ShoppingBag size={20} />
                            Accès Vendeur
                        </button>

                        <button onClick={() => setView('reset')} style={{ marginTop: '20px', color: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem' }}>
                            <KeyRound size={14} /> Mot de passe oublié ?
                        </button>
                    </div>
                )}

                {view === 'login-admin' && renderLogin('admin')}
                {view === 'login-seller' && renderLogin('seller')}
                {view === 'reset' && renderReset()}

            </GlassCard>
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

export default Login;
