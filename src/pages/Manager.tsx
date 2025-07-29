import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
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
    
    // Header
    doc.setFontSize(20);
    doc.text('BÁO CÁO TỔNG HỢP - LONG CHÂU', 20, 20);
    
    // Report info
    doc.setFontSize(12);
    doc.text(`Người tạo: ${user?.full_name || user?.username}`, 20, 35);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`, 20, 45);
    doc.text(`Thời gian báo cáo: ${analytics.length > 0 ? `${analytics[analytics.length - 1].date} - ${analytics[0].date}` : 'N/A'}`, 20, 55);
    
    // Executive Summary
    const totalSales = analytics.reduce((sum, item) => sum + item.total_sales, 0);
    const totalOrders = analytics.reduce((sum, item) => sum + item.total_orders, 0);
    const totalCustomers = analytics.reduce((sum, item) => sum + item.total_customers, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const avgDailySales = analytics.length > 0 ? totalSales / analytics.length : 0;
    
    doc.setFontSize(14);
    doc.text('1. TỔNG QUAN KINH DOANH', 20, 75);
    doc.setFontSize(12);
    doc.text(`• Tổng doanh thu: ${totalSales.toLocaleString('vi-VN')}đ`, 25, 90);
    doc.text(`• Tổng đơn hàng: ${totalOrders.toLocaleString('vi-VN')} đơn`, 25, 100);
    doc.text(`• Tổng khách hàng: ${totalCustomers.toLocaleString('vi-VN')} khách`, 25, 110);
    doc.text(`• Giá trị trung bình/đơn: ${avgOrderValue.toLocaleString('vi-VN')}đ`, 25, 120);
    doc.text(`• Doanh thu trung bình/ngày: ${avgDailySales.toLocaleString('vi-VN')}đ`, 25, 130);
    
    // Category Analysis
    const heartSales = analytics.filter(item => item.popular_category === 'Heart').reduce((sum, item) => sum + item.total_sales, 0);
    const skinSales = analytics.filter(item => item.popular_category === 'Skin').reduce((sum, item) => sum + item.total_sales, 0);
    const heartPercentage = totalSales > 0 ? (heartSales / totalSales * 100).toFixed(1) : '0';
    const skinPercentage = totalSales > 0 ? (skinSales / totalSales * 100).toFixed(1) : '0';
    
    doc.setFontSize(14);
    doc.text('2. PHÂN TÍCH DANH MỤC SẢN PHẨM', 20, 150);
    doc.setFontSize(12);
    doc.text(`• Tim mạch: ${heartSales.toLocaleString('vi-VN')}đ (${heartPercentage}%)`, 25, 165);
    doc.text(`• Da liễu: ${skinSales.toLocaleString('vi-VN')}đ (${skinPercentage}%)`, 25, 175);
    
    // Trend Analysis
    const recentSales = analytics.slice(0, 7).reduce((sum, item) => sum + item.total_sales, 0);
    const olderSales = analytics.slice(7, 14).reduce((sum, item) => sum + item.total_sales, 0);
    const growthRate = olderSales > 0 ? ((recentSales - olderSales) / olderSales * 100).toFixed(1) : '0';
    
    doc.setFontSize(14);
    doc.text('3. PHÂN TÍCH XU HƯỚNG', 20, 195);
    doc.setFontSize(12);
    doc.text(`• Tăng trưởng 7 ngày gần nhất: ${growthRate}%`, 25, 210);
    doc.text(`• Xu hướng: ${parseFloat(growthRate) > 0 ? 'Tăng trưởng tích cực' : parseFloat(growthRate) < 0 ? 'Giảm so với tuần trước' : 'Ổn định'}`, 25, 220);
    
    // New page for detailed data
    doc.addPage();
    doc.setFontSize(14);
    doc.text('4. CHI TIẾT THEO NGÀY', 20, 20);
    
    let yPosition = 35;
    doc.setFontSize(10);
    doc.text('Ngày', 20, yPosition);
    doc.text('Doanh thu', 70, yPosition);
    doc.text('Đơn hàng', 120, yPosition);
    doc.text('Khách hàng', 160, yPosition);
    yPosition += 10;
    
    // Draw line
    doc.line(20, yPosition - 5, 190, yPosition - 5);
    
    analytics.slice(0, 20).forEach((item, index) => {
      const date = new Date(item.date).toLocaleDateString('vi-VN');
      doc.text(date, 20, yPosition);
      doc.text(`${item.total_sales.toLocaleString('vi-VN')}đ`, 70, yPosition);
      doc.text(`${item.total_orders}`, 120, yPosition);
      doc.text(`${item.total_customers}`, 160, yPosition);
      yPosition += 12;
      
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
      doc.text(`Trang ${i}/${pageCount} - Long Châu Pharmacy Management System`, 20, 285);
      doc.text(`Báo cáo được tạo tự động vào ${new Date().toLocaleString('vi-VN')}`, 20, 290);
    }
    
    const fileName = `bao-cao-long-chau-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generateCustomerReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('BÁO CÁO KHÁCH HÀNG - LONG CHÂU', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Người tạo: ${user?.full_name || user?.username}`, 20, 35);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 20, 45);
    
    const totalCustomers = analytics.reduce((sum, item) => sum + item.total_customers, 0);
    const avgCustomersPerDay = analytics.length > 0 ? totalCustomers / analytics.length : 0;
    const totalOrders = analytics.reduce((sum, item) => sum + item.total_orders, 0);
    const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
    
    doc.setFontSize(14);
    doc.text('THỐNG KÊ KHÁCH HÀNG', 20, 65);
    doc.setFontSize(12);
    doc.text(`• Tổng số khách hàng: ${totalCustomers.toLocaleString('vi-VN')}`, 25, 80);
    doc.text(`• Khách hàng trung bình/ngày: ${avgCustomersPerDay.toFixed(1)}`, 25, 90);
    doc.text(`• Đơn hàng trung bình/khách: ${avgOrdersPerCustomer.toFixed(1)}`, 25, 100);
    
    doc.save(`bao-cao-khach-hang-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateTrendReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('BÁO CÁO XU HƯỚNG - LONG CHÂU', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Người tạo: ${user?.full_name || user?.username}`, 20, 35);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 20, 45);
    
    // Calculate trends
    const recentWeek = analytics.slice(0, 7);
    const previousWeek = analytics.slice(7, 14);
    
    const recentSales = recentWeek.reduce((sum, item) => sum + item.total_sales, 0);
    const previousSales = previousWeek.reduce((sum, item) => sum + item.total_sales, 0);
    const salesGrowth = previousSales > 0 ? ((recentSales - previousSales) / previousSales * 100).toFixed(1) : '0';
    
    const recentOrders = recentWeek.reduce((sum, item) => sum + item.total_orders, 0);
    const previousOrders = previousWeek.reduce((sum, item) => sum + item.total_orders, 0);
    const ordersGrowth = previousOrders > 0 ? ((recentOrders - previousOrders) / previousOrders * 100).toFixed(1) : '0';
    
    doc.setFontSize(14);
    doc.text('PHÂN TÍCH XU HƯỚNG 7 NGÀY', 20, 65);
    doc.setFontSize(12);
    doc.text(`• Tăng trưởng doanh thu: ${salesGrowth}%`, 25, 80);
    doc.text(`• Tăng trưởng đơn hàng: ${ordersGrowth}%`, 25, 90);
    doc.text(`• Đánh giá: ${parseFloat(salesGrowth) > 5 ? 'Tăng trưởng mạnh' : parseFloat(salesGrowth) > 0 ? 'Tăng trưởng ổn định' : 'Cần cải thiện'}`, 25, 100);
    
    doc.save(`bao-cao-xu-huong-${new Date().toISOString().split('T')[0]}.pdf`);
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
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Báo cáo tổng hợp
                </button>
                <button
                  onClick={generateCustomerReport}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center text-sm"
                >
                  <Users2 className="w-4 h-4 mr-2" />
                  Báo cáo khách hàng
                </button>
                <button
                  onClick={generateTrendReport}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center text-sm"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Báo cáo xu hướng
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
                Bảng điều khiển quản lý
              </h1>
              <p className="text-gray-600">
                Tổng quan hiệu suất kinh doanh Long Châu
              </p>
            </div>
            
            <button
              onClick={generatePDFReport}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Xuất báo cáo PDF
            </button>
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
                <p className="text-sm text-gray-600 mb-1">Doanh thu thực tế</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRevenue.toLocaleString()}đ
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
                <p className="text-sm text-gray-600 mb-1">Đơn hàng thực tế</p>
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
                <p className="text-sm text-gray-600 mb-1">Tổng khách hàng</p>
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
                <p className="text-sm text-gray-600 mb-1">Giá trị TB/Đơn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {avgOrderValue.toLocaleString()}đ
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
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
                        {order.users.full_name || 'Khách hàng'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.order_items.length} sản phẩm • {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {order.total_amount.toLocaleString()}đ
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'pending' ? 'Chờ xử lý' :
                       order.status === 'confirmed' ? 'Đã xác nhận' :
                       order.status === 'preparing' ? 'Đang chuẩn bị' :
                       order.status === 'packed' ? 'Đã đóng gói' :
                       order.status === 'shipped' ? 'Đang giao' :
                       order.status === 'delivered' ? 'Đã giao' :
                       order.status === 'cancelled' ? 'Đã hủy' : order.status}
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
              <h2 className="text-xl font-bold text-gray-900">Phân tích doanh thu</h2>
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
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.total_orders} đơn hàng • {item.total_customers} khách
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {item.total_sales.toLocaleString()}đ
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      item.popular_category === 'Heart' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.popular_category === 'Heart' ? 'Tim mạch' : 'Da liễu'}
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
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Tất cả đơn hàng
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mã đơn</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Sản phẩm</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tổng tiền</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày đặt</th>
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
                        <p className="font-medium">{order.users.full_name || 'Khách hàng'}</p>
                        <p className="text-sm text-gray-500">{order.users.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div>
                        <p className="font-medium">{order.order_items.length} sản phẩm</p>
                        <p className="text-sm text-gray-500">
                          {order.order_items.slice(0, 2).map(item => item.products.name).join(', ')}
                          {order.order_items.length > 2 && '...'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {order.total_amount.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? 'Chờ xử lý' :
                         order.status === 'confirmed' ? 'Đã xác nhận' :
                         order.status === 'preparing' ? 'Đang chuẩn bị' :
                         order.status === 'packed' ? 'Đã đóng gói' :
                         order.status === 'shipped' ? 'Đang giao' :
                         order.status === 'delivered' ? 'Đã giao' :
                         order.status === 'cancelled' ? 'Đã hủy' : order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Manager;