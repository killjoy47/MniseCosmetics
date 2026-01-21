import React, { useState } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';

function App() {
  const [role, setRole] = useState(null); // 'admin' | 'seller' | null

  const handleLogin = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole'); // Clear security headers
    setRole(null);
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  return role === 'admin' ? (
    <AdminDashboard onLogout={handleLogout} />
  ) : (
    <SellerDashboard onLogout={handleLogout} />
  );
}

export default App;
