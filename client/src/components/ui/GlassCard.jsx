import React from 'react';

const GlassCard = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`glass-card ${className}`}
            style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                borderRadius: '16px',
                padding: '24px',
                color: 'var(--color-text)'
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export default GlassCard;
