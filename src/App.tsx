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
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import PrescriptionHistory from './pages/PrescriptionHistory';
import Manager from './pages/Manager';
import Pharmacist from './pages/Pharmacist';
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
                <Route path="/order/tracking/:id" element={<OrderTracking />} />
                <Route path="/order/history" element={<OrderHistory />} />
                <Route path="/prescription/history" element={<PrescriptionHistory />} />
                <Route path="/manager" element={<Manager />} />
                <Route path="/pharmacist" element={<Pharmacist />} />
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