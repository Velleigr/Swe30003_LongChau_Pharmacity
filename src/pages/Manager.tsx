import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
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
  AlertCircle
} from 'lucide-react';

interface SalesAnalytics {
  id: string;
  date: string;
  total_sales: number;
  total_orders: number;
  total_customers: number;
  popular_category: string | null;
}

interface LoginForm {
  username: string;
  password: string;
}

const Manager: React.FC = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SalesAnalytics[]>([]);
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
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
    
    // Title
    doc.setFontSize(20);
    doc.text('Báo cáo bán hàng - Long Châu', 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`, 20, 35);
    
    // Summary statistics
    const totalSales = analytics.reduce((sum, item) => sum + item.total_sales, 0);
    const totalOrders = analytics.reduce((sum, item) => sum + item.total_orders, 0);
    const totalCustomers = analytics.reduce((sum, item) => sum + item.total_customers, 0);
    
    doc.setFontSize(14);
    doc.text('Tổng quan:', 20, 55);
    doc.setFontSize(12);
    doc.text(`Tổng doanh thu: ${totalSales.toLocaleString()}đ`, 20, 70);
    doc.text(`Tổng đơn hàng: ${totalOrders.toLocaleString()}`, 20, 85);
    doc.text(`Tổng khách hàng: ${totalCustomers.toLocaleString()}`, 20, 100);
    
    // Daily breakdown
    doc.setFontSize(14);
    doc.text('Chi tiết theo ngày:', 20, 125);
    
    let yPosition = 140;
    doc.setFontSize(10);
    
    analytics.slice(0, 15).forEach((item, index) => {
      const date = new Date(item.date).toLocaleDateString('vi-VN');
      doc.text(`${date}: ${item.total_sales.toLocaleString()}đ - ${item.total_orders} đơn`, 20, yPosition);
      yPosition += 15;
    });
    
    doc.save('bao-cao-ban-hang.pdf');
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Thông tin demo:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Tên đăng nhập: <code className="bg-blue-100 px-1 rounded">manager</code></p>
              <p>• Mật khẩu: <code className="bg-blue-100 px-1 rounded">123</code></p>
            </div>
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
  const totalOrders = analytics.reduce((sum, item) => sum + item.total_orders, 0);
  const totalCustomers = analytics.reduce((sum, item) => sum + item.total_customers, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

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
                <p className="text-sm text-gray-600 mb-1">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSales.toLocaleString()}đ
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
                <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalOrders.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
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
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Doanh thu theo ngày</h2>
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              {analytics.slice(0, 7).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.total_orders} đơn hàng
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {item.total_sales.toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Danh mục phổ biến</h2>
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            
            <div className="space-y-4">
              {['Heart', 'Skin'].map((category, index) => {
                const categoryData = analytics.filter(item => item.popular_category === category);
                const categoryTotal = categoryData.reduce((sum, item) => sum + item.total_sales, 0);
                const percentage = totalSales > 0 ? (categoryTotal / totalSales) * 100 : 0;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        {category === 'Heart' ? 'Tim mạch' : 'Da liễu'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          category === 'Heart' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {categoryTotal.toLocaleString()}đ
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Hoạt động gần đây
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Doanh thu</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Đơn hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Danh mục phổ biến</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(item.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {item.total_sales.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {item.total_orders}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {item.total_customers}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.popular_category === 'Heart'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.popular_category === 'Heart' ? 'Tim mạch' : 'Da liễu'}
                      </span>
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