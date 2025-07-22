import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Prescription from './pages/Prescription';
import Order from './pages/Order';
import Cart from './pages/Cart';
import OrderDetails from './pages/OrderDetails';
import Manager from './pages/Manager';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/prescription" element={<Prescription />} />
                <Route path="/order" element={<Order />} />
                <Route path="/order/cart" element={<Cart />} />
                <Route path="/order/details/:id" element={<OrderDetails />} />
                <Route path="/manager" element={<Manager />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;