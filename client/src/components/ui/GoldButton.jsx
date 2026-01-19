import React from 'react';

const GoldButton = ({ children, onClick, className = '', type = 'button', disabled = false, ...props }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`gold-btn ${className}`}
            style={{
                background: disabled ? '#555' : 'linear-gradient(135deg, var(--color-gold) 0%, #b5952f 100%)',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                border: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: disabled ? 'none' : '0 4px 15px rgba(212, 175, 55, 0.3)'
            }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
            {...props}
        >
            {children}
        </button>
    );
};

export default GoldButton;
