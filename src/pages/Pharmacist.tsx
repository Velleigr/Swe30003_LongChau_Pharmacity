import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Package,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Shield,
  Camera,
  Save,
  X
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
    is_prescription_required: boolean;
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

interface Prescription {
  id: string;
  user_id: string;
  pharmacist_id: string | null;
  prescription_text: string | null;
  image_url: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  order_id: string | null;
  created_at: string;
  updated_at: string;
  users: {
    full_name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
  };
}

const Pharmacist: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'prescriptions'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>('');

  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Đang chuẩn bị', color: 'bg-purple-100 text-purple-800' },
    { value: 'packed', label: 'Đã đóng gói', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'shipped', label: 'Đang giao hàng', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: 'Đã giao hàng', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
  ];

  const prescriptionStatusOptions = [
    { value: 'pending', label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reviewed', label: 'Đã xem', color: 'bg-blue-100 text-blue-800' },
    { value: 'approved', label: 'Đã phê duyệt', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Từ chối', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    if (user && user.role === 'pharmacist') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch orders using direct Supabase query since pharmacists can see all orders
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        // Fetch orders
        const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=*,order_items(*,products(id,name,image_url,is_prescription_required)),users(full_name,email,phone)&order=created_at.desc&limit=50`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData || []);
        }

        // Fetch prescriptions assigned to this pharmacist only
        const prescriptionsResponse = await fetch(`${supabaseUrl}/rest/v1/prescriptions?select=*,users(full_name,email,phone,address)&pharmacist_id=eq.${user.id}&order=created_at.desc&limit=50`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (prescriptionsResponse.ok) {
          const prescriptionsData = await prescriptionsResponse.json();
          setPrescriptions(prescriptionsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await api.orders.updateStatus(orderId, status);
      if (!response.error) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: status as any } : order
        ));
        setEditingOrder(null);
        setNewStatus('');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleReviewPrescription = async (prescriptionId: string, status: string) => {
    if (!user) return;
    
    try {
      const response = await api.prescriptions.review(prescriptionId, {
        pharmacist_id: user.id,
        status,
        notes: prescriptionNotes
      });
      
      if (!response.error) {
        setPrescriptions(prev => prev.map(prescription => 
          prescription.id === prescriptionId 
            ? { ...prescription, status: status as any, pharmacist_id: user.id }
            : prescription
        ));
        setEditingPrescription(null);
        setPrescriptionNotes('');
      }
    } catch (error) {
      console.error('Error reviewing prescription:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'packed':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string, isOrder: boolean = true) => {
    const options = isOrder ? statusOptions : prescriptionStatusOptions;
    const statusOption = options.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  if (!user || user.role !== 'pharmacist') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600">
            Trang này chỉ dành cho dược sĩ
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bảng điều khiển dược sĩ
          </h1>
          <p className="text-gray-600">
            Quản lý đơn hàng và xem xét đơn thuốc - Bạn sẽ nhận email thông báo khi có đơn thuốc mới
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-5 h-5 mx-auto mb-1" />
                Quản lý đơn hàng ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'prescriptions'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1" />
                Đơn thuốc ({prescriptions.filter(p => p.status === 'pending').length} chờ duyệt)
              </button>
            </nav>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Đơn hàng #{order.id.slice(0, 8)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{order.total_amount.toLocaleString()}đ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {editingOrder === order.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Chọn trạng thái</option>
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, newStatus)}
                            disabled={!newStatus}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm inline-flex items-center"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingOrder(null);
                              setNewStatus('');
                            }}
                            className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm inline-flex items-center"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>
                              {statusOptions.find(s => s.value === order.status)?.label || order.status}
                            </span>
                          </span>
                          
                          <button
                            onClick={() => {
                              setEditingOrder(order.id);
                              setNewStatus(order.status);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center text-sm"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Cập nhật
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{order.users.full_name || 'Khách hàng'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{order.users.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{order.delivery_address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Sản phẩm ({order.order_items.length})
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <img
                          src={item.products.image_url || 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'}
                          alt={item.products.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">
                            {item.products.name}
                          </h5>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>SL: {item.quantity}</span>
                            <span className="font-medium text-blue-600">
                              {item.price.toLocaleString()}đ
                            </span>
                          </div>
                          {item.products.is_prescription_required && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                              Cần đơn thuốc
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            {prescriptions.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Prescription Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Đơn thuốc #{prescription.id.slice(0, 8)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(prescription.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {editingPrescription === prescription.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Chọn trạng thái</option>
                            {prescriptionStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleReviewPrescription(prescription.id, newStatus)}
                            disabled={!newStatus}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm inline-flex items-center"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingPrescription(null);
                              setNewStatus('');
                              setPrescriptionNotes('');
                            }}
                            className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm inline-flex items-center"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status, false)}`}>
                            <Shield className="w-4 h-4" />
                            <span>
                              {prescriptionStatusOptions.find(s => s.value === prescription.status)?.label || prescription.status}
                            </span>
                          </span>
                          
                          <button
                            onClick={() => {
                              setEditingPrescription(prescription.id);
                              setNewStatus(prescription.status);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center text-sm"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Xem xét
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{prescription.users.full_name || 'Bệnh nhân'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{prescription.users.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{prescription.users.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                {/* Prescription Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Prescription Text */}
                    {prescription.prescription_text && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Nội dung đơn thuốc
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {prescription.prescription_text}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Prescription Image */}
                    {prescription.image_url && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Hình ảnh đơn thuốc
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <img
                            src={prescription.image_url}
                            alt="Đơn thuốc"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review Notes */}
                  {editingPrescription === prescription.id && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú đánh giá
                      </label>
                      <textarea
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập ghi chú về đơn thuốc..."
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {prescriptions.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Chưa có đơn thuốc nào
                </h2>
                <p className="text-gray-600">
                  Các đơn thuốc từ khách hàng sẽ hiển thị ở đây
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pharmacist;