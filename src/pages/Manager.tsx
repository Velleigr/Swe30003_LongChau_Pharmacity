import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RevenueChart from '../components/ui/RevenueChart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Lock,
  AlertCircle,
  FileText,
  TrendingDown,
  Users2,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SalesAnalytics {
  id: string;
  date: string;
  total_sales: number;
  total_orders: number;
  total_customers: number;
  popular_category: string | null;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
    };
  }>;
  users: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

interface LoginForm {
  username: string;
  password: string;
}

const Manager: React.FC = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SalesAnalytics[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: '',
    password: ''
  });

  useEffect(() => {
    if (user && user.role === 'manager') {
      setIsAuthenticated(true);
      fetchAnalytics();
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Use direct Supabase query for analytics since it's manager-specific
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase not configured');
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/sales_analytics?select=*&order=date.desc&limit=30`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics([]);
    }
  };

  const fetchOrders = async () => {
    try {
      // Fetch recent orders for all users (manager can see all)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase not configured');
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*,order_items(*,products(name)),users(full_name,email,phone)&order=created_at.desc&limit=50`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setOrders(data || []);
      
      // Calculate totals
      const total = data.reduce((sum: number, order: Order) => sum + order.total_amount, 0);
      setTotalRevenue(total);
      setTotalOrders(data.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const success = await login(loginForm.username, loginForm.password);
    if (success) {
      // Re-fetch user data to check role
      setTimeout(() => {
        const storedUser = localStorage.getItem('pharmacy_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'manager') {
            setIsAuthenticated(true);
            fetchAnalytics();
            fetchOrders();
          } else {
            setLoginError('Bạn không có quyền truy cập trang này');
          }
        }
      }, 100);
    } else {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Set font to Arial which supports both English and Vietnamese characters
    doc.setFont('arial', 'normal');
    
    // Header
    doc.setFontSize(20);
    doc.text('COMPREHENSIVE REPORT - LONG CHAU PHARMACY', 20, 20);
    
    // Report info
    doc.setFontSize(12);
    doc.text(`Created by: ${user?.full_name || user?.username}`, 20, 35);
    doc.text(`Export date: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}`, 20, 45);
    doc.text(`Period: ${orders.length > 0 ? `${new Date(orders[orders.length - 1].created_at).toLocaleDateString('en-US')} - ${new Date(orders[0].created_at).toLocaleDateString('en-US')}` : 'No data available'}`, 20, 55);
    
    // Executive Summary - Use actual order data
    const actualTotalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const actualTotalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.user_id)).size;
    const avgOrderValue = actualTotalOrders > 0 ? actualTotalRevenue / actualTotalOrders : 0;
    
    // Calculate daily averages from actual orders
    const orderDates = orders.map(order => new Date(order.created_at).toDateString());
    const uniqueDays = new Set(orderDates).size;
    const avgDailyRevenue = uniqueDays > 0 ? actualTotalRevenue / uniqueDays : 0;
    const avgDailyOrders = uniqueDays > 0 ? actualTotalOrders / uniqueDays : 0;
    
    doc.setFontSize(14);
    doc.text('1. BUSINESS OVERVIEW', 20, 75);
    doc.setFontSize(12);
    doc.text(`• Total Revenue: $${actualTotalRevenue.toLocaleString('en-US')}`, 25, 90);
    doc.text(`• Total Orders: ${actualTotalOrders.toLocaleString('en-US')} orders`, 25, 100);
    doc.text(`• Total Customers: ${uniqueCustomers.toLocaleString('en-US')} customers`, 25, 110);
    doc.text(`• Average Order Value: $${avgOrderValue.toLocaleString('en-US')}`, 25, 120);
    doc.text(`• Daily Average Revenue: $${avgDailyRevenue.toLocaleString('en-US')}`, 25, 130);
    doc.text(`• Daily Average Orders: ${avgDailyOrders.toFixed(1)} orders`, 25, 140);
    
    // Order Status Analysis
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    doc.setFontSize(14);
    doc.text('2. ORDER STATUS ANALYSIS', 20, 160);
    doc.setFontSize(12);
    let yPos = 175;
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / actualTotalOrders) * 100).toFixed(1);
      const statusEN = status === 'pending' ? 'Pending' :
                      status === 'confirmed' ? 'Confirmed' :
                      status === 'preparing' ? 'Preparing' :
                      status === 'packed' ? 'Packed' :
                      status === 'shipped' ? 'Shipped' :
                      status === 'delivered' ? 'Delivered' :
                      status === 'cancelled' ? 'Cancelled' : status;
      doc.text(`• ${statusEN}: ${count} orders (${percentage}%)`, 25, yPos);
      yPos += 10;
    });
    
    // Recent Performance Analysis
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentOrders = orders.filter(order => new Date(order.created_at) >= last7Days);
    const recentRevenue = recentOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    doc.setFontSize(14);
    doc.text('3. LAST 7 DAYS PERFORMANCE', 20, yPos + 10);
    doc.setFontSize(12);
    doc.text(`• Orders last 7 days: ${recentOrders.length} orders`, 25, yPos + 25);
    doc.text(`• Revenue last 7 days: $${recentRevenue.toLocaleString('en-US')}`, 25, yPos + 35);
    doc.text(`• Average orders/day: ${(recentOrders.length / 7).toFixed(1)} orders`, 25, yPos + 45);
    
    // New page for detailed data
    doc.addPage();
    doc.setFontSize(14);
    doc.text('4. RECENT ORDER DETAILS', 20, 20);
    
    let yPosition = 40;
    doc.setFontSize(10);
    doc.text('Order ID', 20, yPosition);
    doc.text('Customer', 60, yPosition);
    doc.text('Total', 110, yPosition);
    doc.text('Status', 150, yPosition);
    doc.text('Date', 180, yPosition);
    yPosition += 10;
    
    // Draw line
    doc.line(20, yPosition - 5, 200, yPosition - 5);
    
    orders.slice(0, 25).forEach((order, index) => {
      const orderId = order.id.slice(0, 8);
      const customerName = order.users.full_name || 'Customer';
      const amount = `$${order.total_amount.toLocaleString('en-US')}`;
      const statusEN = order.status === 'pending' ? 'Pending' :
                      order.status === 'confirmed' ? 'Confirmed' :
                      order.status === 'preparing' ? 'Preparing' :
                      order.status === 'packed' ? 'Packed' :
                      order.status === 'shipped' ? 'Shipped' :
                      order.status === 'delivered' ? 'Delivered' :
                      order.status === 'cancelled' ? 'Cancelled' : order.status;
      const date = new Date(order.created_at).toLocaleDateString('en-US');
      
      doc.setFontSize(8);
      doc.text(orderId, 20, yPosition);
      doc.text(customerName.length > 15 ? customerName.substring(0, 15) + '...' : customerName, 60, yPosition);
      doc.text(amount, 110, yPosition);
      doc.text(statusEN, 150, yPosition);
      doc.text(date, 180, yPosition);
      yPosition += 10;
      
      // Add new page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i}/${pageCount} - Long Chau Pharmacy Management System`, 20, 285);
      doc.text(`Report generated on ${new Date().toLocaleString('en-US')}`, 20, 290);
    }
    
    const fileName = `long-chau-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generateCustomerReport = () => {
    const doc = new jsPDF();
    
    doc.setFont('arial', 'normal');
    doc.setFontSize(20);
    doc.text('CUSTOMER REPORT - LONG CHAU', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Created by: ${user?.full_name || user?.username}`, 20, 35);
    doc.text(`Export date: ${new Date().toLocaleDateString('en-US')}`, 20, 45);
    
    // Use actual order data for customer analysis
    const uniqueCustomers = new Set(orders.map(order => order.user_id)).size;
    const totalOrdersCount = orders.length;
    const avgOrdersPerCustomer = uniqueCustomers > 0 ? totalOrdersCount / uniqueCustomers : 0;
    
    // Customer with most orders
    const customerOrderCounts = orders.reduce((acc, order) => {
      const customerId = order.user_id;
      acc[customerId] = (acc[customerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCustomer = Object.entries(customerOrderCounts).reduce((max, [id, count]) => 
      count > max.count ? { id, count } : max, { id: '', count: 0 });
    
    const topCustomerInfo = orders.find(order => order.user_id === topCustomer.id)?.users;
    
    doc.setFontSize(14);
    doc.text('CUSTOMER STATISTICS', 20, 65);
    doc.setFontSize(12);
    doc.text(`• Total customers: ${uniqueCustomers} customers`, 25, 80);
    doc.text(`• Total orders: ${totalOrdersCount} orders`, 25, 90);
    doc.text(`• Average orders per customer: ${avgOrdersPerCustomer.toFixed(1)} orders`, 25, 100);
    doc.text(`• Most active customer: ${topCustomerInfo?.full_name || 'N/A'} (${topCustomer.count} orders)`, 25, 110);
    
    doc.save(`customer-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateTrendReport = () => {
    const doc = new jsPDF();
    
    doc.setFont('arial', 'normal');
    doc.setFontSize(20);
    doc.text('TREND REPORT - LONG CHAU', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Created by: ${user?.full_name || user?.username}`, 20, 35);
    doc.text(`Export date: ${new Date().toLocaleDateString('en-US')}`, 20, 45);
    
    // Calculate trends from actual orders
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(order => new Date(order.created_at) >= last7Days);
    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previous7Days && orderDate < last7Days;
    });
    
    const recentRevenue = recentOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : '0';
    const orderGrowth = previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length * 100).toFixed(1) : '0';
    
    doc.setFontSize(14);
    doc.text('7-DAY TREND ANALYSIS', 20, 65);
    doc.setFontSize(12);
    doc.text(`• Revenue growth: ${revenueGrowth}%`, 25, 80);
    doc.text(`• Order growth: ${orderGrowth}%`, 25, 90);
    doc.text(`• Last 7 days: ${recentOrders.length} orders, $${recentRevenue.toLocaleString('en-US')}`, 25, 100);
    doc.text(`• Previous 7 days: ${previousOrders.length} orders, $${previousRevenue.toLocaleString('en-US')}`, 25, 110);
    doc.text(`• Assessment: ${parseFloat(revenueGrowth) > 5 ? 'Strong growth' : parseFloat(revenueGrowth) > 0 ? 'Stable growth' : 'Needs improvement'}`, 25, 120);
    
    doc.save(`trend-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đăng nhập quản lý
            </h1>
            <p className="text-gray-600">
              Chỉ dành cho người quản lý hệ thống
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                name="username"
                value={loginForm.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mật khẩu"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 text-sm">{loginError}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Đăng nhập
            </button>
          </form>
          <div className="flex space-x-3 mt-4">
                <button
                  onClick={generatePDFReport}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Comprehensive Report
                </button>
                <button
                  onClick={generateCustomerReport}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center text-sm"
                >
                  <Users2 className="w-4 h-4 mr-2" />
                  Customer Report
                </button>
                <button
                  onClick={generateTrendReport}
                  className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center text-sm"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Trend Report
                </button>
              </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalSales = analytics.reduce((sum, item) => sum + item.total_sales, 0);
  const totalCustomers = analytics.reduce((sum, item) => sum + item.total_customers, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Management Dashboard
              </h1>
              <p className="text-gray-600">
                Long Chau business performance overview
              </p>
            </div>
            
            <button
              onClick={generatePDFReport}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Export PDF Report
            </button>
            
            <Link
              to="/inventory"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Quản lý kho hàng
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Actual Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Actual Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalOrders.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCustomers.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgOrderValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Analytics */}
        <div className="space-y-8">
          {/* Revenue Analytics Chart */}
          <RevenueChart 
            data={analytics} 
            loading={loading}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.users.full_name || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.order_items.length} products • {new Date(order.created_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      ${order.total_amount.toLocaleString()}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'pending' ? 'Chờ xử lý' :
                       order.status === 'confirmed' ? 'Confirmed' :
                       order.status === 'preparing' ? 'Preparing' :
                       order.status === 'packed' ? 'Packed' :
                       order.status === 'shipped' ? 'Shipped' :
                       order.status === 'delivered' ? 'Delivered' :
                       order.status === 'cancelled' ? 'Cancelled' : order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sales Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Analysis</h2>
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            
            <div className="space-y-4">
              {analytics.slice(0, 7).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(item.date).toLocaleDateString('en-US')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.total_orders} orders • {item.total_customers} customers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ${item.total_sales.toLocaleString()}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      item.popular_category === 'Heart' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.popular_category === 'Heart' ? 'Heart Care' : 'Skin Care'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* All Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            All Orders
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Products</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {order.id.slice(0, 8)}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div>
                        <p className="font-medium">{order.users.full_name || 'Customer'}</p>
                        <p className="text-sm text-gray-500">{order.users.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div>
                        <p className="font-medium">{order.order_items.length} products</p>
                        <p className="text-sm text-gray-500">
                          {order.order_items.slice(0, 2).map(item => item.products.name).join(', ')}
                          {order.order_items.length > 2 && '...'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      ${order.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? 'Chờ xử lý' :
                         order.status === 'confirmed' ? 'Confirmed' :
                         order.status === 'preparing' ? 'Preparing' :
                         order.status === 'packed' ? 'Packed' :
                         order.status === 'shipped' ? 'Shipped' :
                         order.status === 'delivered' ? 'Delivered' :
                         order.status === 'cancelled' ? 'Cancelled' : order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Manager;