import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  users: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusSteps = [
    {
      key: 'confirmed',
      title: 'Đã xác nhận',
      description: 'Đơn hàng đã được xác nhận',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      key: 'preparing',
      title: 'Đang chuẩn bị',
      description: 'Đang chuẩn bị sản phẩm',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      key: 'packed',
      title: 'Đã đóng gói',
      description: 'Sản phẩm đã được đóng gói',
      icon: Package,
      color: 'text-purple-600'
    },
    {
      key: 'shipped',
      title: 'Đang giao hàng',
      description: 'Đang trên đường giao đến bạn',
      icon: Truck,
      color: 'text-orange-600'
    },
    {
      key: 'delivered',
      title: 'Đã giao hàng',
      description: 'Đã giao hàng thành công',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  useEffect(() => {
    if (id && user) {
      fetchOrder();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getById(id!);

      if (response.error) {
        setError(response.error);
        return;
      }

      // Check if user owns this order
      if (response.data.user_id !== user?.id) {
        setError('Bạn không có quyền xem đơn hàng này');
        return;
      }

      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cần đăng nhập
          </h2>
          <p className="text-gray-600">
            Vui lòng đăng nhập để xem chi tiết đơn hàng
          </p>
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {error || 'Không tìm thấy đơn hàng'}
            </h1>
            <Link
              to="/order"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại đặt hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/order"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại đặt hàng
          </Link>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Chi tiết đơn hàng
              </h1>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {statusSteps.find(s => s.key === order.status)?.title || order.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Mã đơn: {order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Tổng tiền: {order.total_amount.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Tracking */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Theo dõi đơn hàng
              </h2>
              
              {/* Desktop Timeline */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between mb-8">
                  {statusSteps.map((step, index) => {
                    const status = getStepStatus(index);
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.key} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                              status === 'completed'
                                ? 'bg-green-500 border-green-500 text-white'
                                : status === 'current'
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'bg-gray-200 border-gray-300 text-gray-500'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-sm font-medium ${
                              status === 'completed' ? 'text-green-600' :
                              status === 'current' ? 'text-blue-600' :
                              'text-gray-400'
                            }`}>
                              {step.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {step.description}
                            </p>
                          </div>
                        </div>
                        
                        {index < statusSteps.length - 1 && (
                          <div className="flex-1 mx-4">
                            <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full transition-all duration-1000 ${
                                  getCurrentStepIndex() > index ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                                initial={{ width: '0%' }}
                                animate={{ 
                                  width: getCurrentStepIndex() > index ? '100%' : '0%'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Timeline */}
              <div className="md:hidden space-y-4">
                {statusSteps.map((step, index) => {
                  const status = getStepStatus(index);
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full border-4 flex items-center justify-center ${
                            status === 'completed'
                              ? 'bg-green-500 border-green-500 text-white'
                              : status === 'current'
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-gray-200 border-gray-300 text-gray-500'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        {index < statusSteps.length - 1 && (
                          <div className="w-1 h-12 bg-gray-300 mt-2">
                            <motion.div
                              className={`w-full transition-all duration-1000 ${
                                getCurrentStepIndex() > index ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              initial={{ height: '0%' }}
                              animate={{ 
                                height: getCurrentStepIndex() > index ? '100%' : '0%'
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 pb-8">
                        <h3 className={`font-semibold ${
                          status === 'completed' ? 'text-green-600' :
                          status === 'current' ? 'text-blue-600' :
                          'text-gray-400'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                        {status === 'current' && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                            <span className="text-blue-600 text-sm">Đang xử lý...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Sản phẩm đã đặt
              </h2>
              
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.products.image_url || 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'}
                      alt={item.products.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.products.name}</h3>
                      <p className="text-gray-600">Số lượng: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {item.price.toLocaleString()}đ
                      </p>
                      <p className="text-sm text-gray-500">
                        Tổng: {(item.price * item.quantity).toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {order.total_amount.toLocaleString()}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin khách hàng
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {order.users.full_name || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {order.users.phone || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <span className="text-gray-700">
                    {order.delivery_address || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Thời gian giao hàng dự kiến
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {order.status === 'delivered' ? 'Đã giao hàng' : '2-4 giờ'}
                  </span>
                </div>
                <p className="text-blue-700 text-sm">
                  {order.status === 'delivered' 
                    ? 'Đơn hàng đã được giao thành công'
                    : 'Giao hàng nhanh trong khu vực TP.HCM'
                  }
                </p>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cần hỗ trợ?
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 text-sm">Hotline: 1800 6821</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Liên hệ với chúng tôi nếu bạn có bất kỳ thắc mắc nào về đơn hàng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;