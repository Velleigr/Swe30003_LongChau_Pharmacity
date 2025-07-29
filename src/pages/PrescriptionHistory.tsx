import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FileText,
  Calendar,
  User,
  Phone,
  MapPin,
  Eye,
  Clock,
  CheckCircle,
  Shield,
  AlertCircle,
  Camera,
  Filter,
  Search,
  Package
} from 'lucide-react';

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
  pharmacist?: {
    full_name: string | null;
    email: string;
  };
}

const PrescriptionHistory: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = [
    { value: 'all', label: 'Tất cả', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reviewed', label: 'Đã xem', color: 'bg-blue-100 text-blue-800' },
    { value: 'approved', label: 'Đã phê duyệt', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Từ chối', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.prescriptions.getAll({ user_id: user.id });

      if (response.error) {
        setError(response.error);
        return;
      }

      setPrescriptions(response.data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError('Không thể tải danh sách đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <Eye className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.prescription_text && prescription.prescription_text.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cần đăng nhập
          </h2>
          <p className="text-gray-600">
            Vui lòng đăng nhập để xem lịch sử đơn thuốc
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lỗi tải dữ liệu
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchPrescriptions}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lịch sử đơn thuốc
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi tất cả đơn thuốc của bạn
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hoặc nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {prescriptions.length === 0 ? 'Chưa có đơn thuốc nào' : 'Không tìm thấy đơn thuốc'}
            </h2>
            <p className="text-gray-600 mb-6">
              {prescriptions.length === 0 
                ? 'Hãy tải lên đơn thuốc đầu tiên của bạn'
                : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              }
            </p>
            {prescriptions.length === 0 && (
              <Link
                to="/prescription"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <FileText className="w-5 h-5 mr-2" />
                Tải lên đơn thuốc
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPrescriptions.map((prescription, index) => (
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
                          {prescription.pharmacist && (
                            <div className="flex items-center space-x-1">
                              <Shield className="w-4 h-4" />
                              <span>Dược sĩ: {prescription.pharmacist.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
                      {getStatusIcon(prescription.status)}
                      <span>
                        {statusOptions.find(s => s.value === prescription.status)?.label || prescription.status}
                      </span>
                    </span>
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

                  {/* Order Link */}
                  {prescription.order_id && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-900 font-medium">
                            Đã tạo đơn hàng từ đơn thuốc này
                          </span>
                        </div>
                        <Link
                          to={`/order/tracking/${prescription.order_id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem đơn hàng
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredPrescriptions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tổng kết
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredPrescriptions.length}
                </div>
                <div className="text-gray-600">Tổng đơn thuốc</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredPrescriptions.filter(p => p.status === 'approved').length}
                </div>
                <div className="text-gray-600">Đã phê duyệt</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredPrescriptions.filter(p => p.status === 'pending').length}
                </div>
                <div className="text-gray-600">Chờ duyệt</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredPrescriptions.filter(p => p.order_id).length}
                </div>
                <div className="text-gray-600">Đã tạo đơn hàng</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionHistory;