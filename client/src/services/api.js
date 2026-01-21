import { io } from 'socket.io-client';

let base_url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
if (base_url.endsWith('/')) base_url = base_url.slice(0, -1);
if (!base_url.endsWith('/api')) base_url += '/api';

const API_URL = base_url;
const SOCKET_URL = API_URL.replace('/api', '');

console.log('API_URL target:', API_URL);
console.log('SOCKET_URL target:', SOCKET_URL);

export const getApiUrl = () => API_URL;

export const socket = io(SOCKET_URL);

// --- UTILS ---
const getHeaders = () => {
    const role = localStorage.getItem('userRole') || 'guest';
    return {
        'Content-Type': 'application/json',
        'x-role': role
    };
};

// --- PRODUCTS ---
export const getProducts = async () => {
    const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
    return res.json();
};

export const saveProduct = async (product) => {
    const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(product),
    });
    return res.json();
};

// --- CATEGORIES ---
export const getCategories = async () => {
    const res = await fetch(`${API_URL}/categories`, { headers: getHeaders() });
    return res.json();
};

export const saveCategories = async (categories) => {
    const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ categories }),
    });
    return res.json();
};

// --- SALES ---
export const sellProducts = async (items, totalPrice, clientNumber) => {
    try {
        const res = await fetch(`${API_URL}/sell`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ items, totalPrice, clientNumber }),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || `Erreur serveur (${res.status})` };
        }
        return await res.json();
    } catch (err) {
        console.error('Checkout error:', err);
        return { success: false, message: "Erreur réseau lors de la vente. Vérifiez votre connexion." };
    }
};

export const getSales = async (date = '') => {
    const url = date ? `${API_URL}/sales?date=${date}` : `${API_URL}/sales`;
    console.log(`[API] Fetching sales from: ${url}`);
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.json();
};

// --- AUTH ---
export const login = async (role, password) => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, password }),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || `Erreur serveur (${res.status})` };
        }
        return await res.json();
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, message: "Impossible de contacter le serveur. Vérifiez votre connexion." };
    }
};

export const resetPassword = async (masterKey, newAdminPwd, newSellerPwd) => {
    const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ masterKey, newAdminPwd, newSellerPwd }),
    });
    return res.json();
};

export const askAssistant = async (query, role) => {
    const res = await fetch(`${API_URL}/assistant`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query, role }),
    });
    return res.json();
};
