import React, { useState, useRef, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GoldButton from './ui/GoldButton';
import { askAssistant } from '../services/api';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const Assistant = ({ role }) => {
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Bonjour ! Je suis votre assistant M'NISE. Comment puis-je vous aider aujourd'hui ?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const data = await askAssistant(userMsg, role);
            setMessages(prev => [...prev, { role: 'bot', text: data.response || "Désolé, j'ai rencontré un problème." }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: "Erreur de connexion avec l'IA." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        "Stock du produit ?",
        "Stocks bas ?",
        "Bilan aujourd'hui",
        "Quelle vente hier ?"
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)', minHeight: '500px' }}>
            <GlassCard style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {/* Chat Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #333', background: 'rgba(212, 175, 55, 0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: 'var(--color-gold)', borderRadius: '50%', color: '#000' }}>
                        <Bot size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', color: 'var(--color-gold)' }}>M'NISE Assistant</h2>
                        <p style={{ fontSize: '0.75rem', color: '#888' }}>En ligne • Intelligence de gestion</p>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {messages.map((m, idx) => (
                        <div key={idx} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                            gap: '5px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#666',
                                fontSize: '0.7rem',
                                flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
                            }}>
                                {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                <span>{m.role === 'user' ? 'Vous' : 'M\'NISE AI'}</span>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '15px',
                                borderTopRightRadius: m.role === 'user' ? '0' : '15px',
                                borderTopLeftRadius: m.role === 'bot' ? '0' : '15px',
                                background: m.role === 'user' ? 'var(--color-gold)' : 'rgba(255,255,255,0.05)',
                                color: m.role === 'user' ? '#000' : '#f9f9f9',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '15px', display: 'flex', gap: '5px' }}>
                            <div className="dot-typing"></div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Quick Actions */}
                <div style={{ padding: '10px 20px', display: 'flex', gap: '10px', overflowX: 'auto', borderTop: '1px solid #333' }}>
                    {quickActions.map(act => (
                        <button
                            key={act}
                            onClick={() => setInput(act)}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid #444',
                                borderRadius: '20px',
                                color: '#888',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--color-gold)'}
                            onMouseOut={e => e.currentTarget.style.color = '#888'}
                        >
                            {act}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} style={{ padding: '20px', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
                    <input
                        placeholder="Posez votre question ici..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid #444',
                            padding: '12px 20px',
                            borderRadius: '25px',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: 'var(--color-gold)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: (!input.trim() || isLoading) ? 0.5 : 1
                        }}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </GlassCard>

            <style>{`
                .dot-typing {
                    width: 4px; height: 4px; border-radius: 50%; background: var(--color-gold);
                    box-shadow: 10px 0 0 var(--color-gold), 20px 0 0 var(--color-gold);
                    animation: dotTyping 1.5s infinite linear;
                    margin-left: 5px; margin-top: 10px; opacity: 0.6;
                }
                @keyframes dotTyping {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Assistant;
