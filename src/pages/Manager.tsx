import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RevenueChart from '../components/ui/RevenueChart';
import {
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  Lock,
  AlertCircle,
  Package
} from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
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
  };
}

interface LoginForm {
  username: string;
  password: string;
}

interface ChartData {
  date: string;
  revenue: number;
}

const Manager: React.FC = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: '',
    password: ''
  });
  const [selectedMonth, setSelectedMonth] = useState('2025-08'); // Default to August 2025
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (user && user.role === 'manager') {
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Aggregate daily revenue from orders for the selected month
    const aggregateDailyRevenue = () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1); // First day of the month
      const endDate = new Date(year, month, 0); // Last day of the month

      // Filter orders for the selected month
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Group by day and sum revenue
      const dailyRevenue: Record<string, number> = {};
      filteredOrders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total_amount;
      });

      // Convert to chart data format
      const data: ChartData[] = [];
      for (let day = 1; day <= endDate.getDate(); day++) {
        const dateStr = new Date(year, month - 1, day).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        data.push({ date: dateStr, revenue: dailyRevenue[dateStr] || 0 });
      }

      setChartData(data);
    };

    if (orders.length > 0) {
      aggregateDailyRevenue();
    }
  }, [orders, selectedMonth]);

  const fetchOrders = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      // Calculate date range for the selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/orders?select=*,order_items(*,products(name)),users(full_name,email)&created_at=gte.${startDate}&created_at=lte.${endDate}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setOrders(data || []);

      // Calculate totals
      const total = data.reduce((sum: number, order: Order) => sum + order.total_amount, 0);
      setTotalRevenue(total);
      setTotalOrders(data.length);
      setTotalCustomers(new Set(data.map((order: Order) => order.user_id)).size);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setFetchError('Failed to fetch orders data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const success = await login(loginForm.username, loginForm.password);
    if (success) {
      setTimeout(() => {
        const storedUser = localStorage.getItem('pharmacy_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'manager') {
            setIsAuthenticated(true);
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

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
    setLoading(true);
    fetchOrders();
  };

  const statusTranslations: Record<string, string> = {
    pending: 'Chờ xử lý',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

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

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Management Dashboard
              </h1>
              <p className="text-gray-600">
                Long Chau business performance overview
              </p>
            </div>
            <Link
              to="/inventory"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Quản lý kho hàng
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm">{fetchError}</span>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                <p className="text-sm text-gray-600 mb-1">Revenue ({selectedMonth})</p>
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
                <p className="text-sm text-gray-600 mb-1">Orders ({selectedMonth})</p>
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
                <p className="text-sm text-gray-600 mb-1">Customers ({selectedMonth})</p>
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
          {/* Revenue Chart */}
          {chartData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <p className="text-gray-600">No revenue data available for {selectedMonth}.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Daily Revenue - {new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <RevenueChart data={chartData} loading={loading} />
            </motion.div>
          )}

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
                      {statusTranslations[order.status] || order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* All Orders Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              All Orders ({selectedMonth})
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
                          {statusTranslations[order.status] || order.status}
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