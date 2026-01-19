import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3001';

export const socket = io(SOCKET_URL);

// --- PRODUCTS ---
export const getProducts = async () => {
    const res = await fetch(`${API_URL}/products`);
    return res.json();
};

export const saveProduct = async (product) => {
    const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    return res.json();
};

// --- CATEGORIES ---
export const getCategories = async () => {
    const res = await fetch(`${API_URL}/categories`);
    return res.json();
};

export const saveCategories = async (categories) => {
    const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
    });
    return res.json();
};

// --- SALES ---
export const sellProducts = async (items, totalPrice) => {
    const res = await fetch(`${API_URL}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, totalPrice }),
    });
    return res.json();
};

// --- AUTH ---
export const login = async (role, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password }),
    });
    return res.json();
};

export const resetPassword = async (masterKey, newAdminPwd, newSellerPwd) => {
    const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterKey, newAdminPwd, newSellerPwd }),
    });
    return res.json();
};
