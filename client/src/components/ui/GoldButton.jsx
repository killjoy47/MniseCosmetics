import React from 'react';

const GoldButton = ({ children, onClick, className = '', type = 'button', disabled = false, style, ...props }) => {
    // We strictly use the .gold-btn class for coloring (see index.css).
    // The style prop here is allowed for layout overrides (margin, width, etc),
    // but colors are locked by the CSS class.

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`gold-btn ${className}`}
            style={{
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                ...style
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default GoldButton;
