import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DeliveryTracker from '../components/ui/DeliveryTracker';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FileText,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Phone,
  MapPin
} from 'lucide-react';

interface PrescriptionForm {
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  branch: string;
  pharmacist: string;
  doctorName: string;
  hospitalName: string;
  prescriptionText: string;
  prescriptionImage: File | null;
}

const Prescription: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [pharmacists, setPharmacists] = useState<Array<{id: string, full_name: string | null, branch: string | null}>>([]);
  const [loadingPharmacists, setLoadingPharmacists] = useState(false);
  const [form, setForm] = useState<PrescriptionForm>({
    patientName: '',
    patientPhone: '',
    patientAddress: '',
    branch: '',
    pharmacist: '',
    doctorName: '',
    hospitalName: '',
    prescriptionText: '',
    prescriptionImage: null
  });

  const branches = [
    { id: 'hcm-district1', name: 'Long Châu Quận 1 - TP.HCM' },
    { id: 'hcm-district3', name: 'Long Châu Quận 3 - TP.HCM' },
    { id: 'hcm-district5', name: 'Long Châu Quận 5 - TP.HCM' },
    { id: 'hcm-district7', name: 'Long Châu Quận 7 - TP.HCM' },
    { id: 'hcm-tanbinh', name: 'Long Châu Tân Bình - TP.HCM' },
    { id: 'hcm-binhthanh', name: 'Long Châu Bình Thạnh - TP.HCM' }
  ];

  // Fetch pharmacists from database based on selected branch
  const fetchPharmacists = async (branchId: string) => {
    if (!branchId) {
      setPharmacists([]);
      return;
    }

    setLoadingPharmacists(true);
    console.log('Fetching pharmacists for branch:', branchId);
    
    try {
      // First, let's check all pharmacists to debug
      const { data: allPharmacists, error: allError } = await supabase
        .from('users')
        .select('id, full_name, branch, username')
        .eq('role', 'pharmacist');
      
      console.log('All pharmacists in database:', allPharmacists);
      
      // Map frontend branch IDs to database branch values
      const branchMapping: { [key: string]: string } = {
        'hcm-district1': 'hcm-district1',
        'hcm-district3': 'hcm-district3', 
        'hcm-district5': 'hcm-district5',
        'hcm-district7': 'hcm-district7',
        'hcm-tanbinh': 'hcm-tanbinh',
        'hcm-binhthanh': 'hcm-binhthanh'
      };
      
      const dbBranchValue = branchMapping[branchId];
      console.log('Looking for branch value:', dbBranchValue);
      
      if (!dbBranchValue) {
        console.log('No mapping found for branch:', branchId);
        setPharmacists([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, branch')
        .eq('role', 'pharmacist')
        .eq('branch', dbBranchValue)
        .order('full_name');

      if (error) {
        console.error('Error fetching pharmacists:', error);
        setPharmacists([]);
      } else {
        console.log('Fetched pharmacists for branch:', dbBranchValue, data);
        setPharmacists(data || []);
      }
    } catch (error) {
      console.error('Error fetching pharmacists:', error);
      setPharmacists([]);
    } finally {
      setLoadingPharmacists(false);
    }
  };

  useEffect(() => {
    // Fetch pharmacists when branch changes
    fetchPharmacists(form.branch);
    
    // Reset pharmacist selection when branch changes
    if (form.pharmacist) {
      setForm(prev => ({ ...prev, pharmacist: '' }));
    }
  }, [form.branch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prev => ({ ...prev, prescriptionImage: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = null;
      
      // If image is uploaded, you would upload it to Supabase storage here
      // For demo purposes, we'll use a placeholder URL
      if (form.prescriptionImage) {
        imageUrl = 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg';
      }

      const response = await api.prescriptions.create({
        user_id: user.id,
        prescription_text: form.prescriptionText || undefined,
        image_url: imageUrl || undefined,
        status: 'pending'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setPrescriptionId(response.data.id);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting prescription:', error);
    } finally {
      setLoading(false);
    }
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
            Vui lòng đăng nhập để sử dụng dịch vụ đơn thuốc
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đơn thuốc đã được gửi thành công!
            </h1>
            <p className="text-gray-600">
              Mã đơn thuốc: <span className="font-mono text-blue-600">{prescriptionId}</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DeliveryTracker currentStep={1} orderStatus="pending" />
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Thông tin liên hệ
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{form.patientName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{form.patientPhone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{form.patientAddress}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  Thông tin chi nhánh:
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Chi nhánh: {branches.find(b => b.id === form.branch)?.name}</p>
                  <p>• Dược sĩ phụ trách: {pharmacists.find(p => p.id === form.pharmacist)?.full_name}</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Quy trình tiếp theo:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Dược sĩ sẽ kiểm tra đơn thuốc</li>
                  <li>• Xác nhận tương tác thuốc</li>
                  <li>• Tạo đơn hàng tự động khi được phê duyệt</li>
                  <li>• Giao hàng tận nơi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tải lên đơn thuốc
          </h1>
          <p className="text-gray-600">
            Gửi đơn thuốc để dược sĩ kiểm tra và xử lý
          </p>
        </motion.div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'text'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1" />
                Nhập văn bản
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'image'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Camera className="w-5 h-5 mx-auto mb-1" />
                Tải ảnh lên
              </button>
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Patient Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin bệnh nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="patientPhone"
                    value={form.patientPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ giao hàng *
                </label>
                <input
                  type="text"
                  name="patientAddress"
                  value={form.patientAddress}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ giao hàng"
                />
              </div>
            </div>

            {/* Doctor Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin bác sĩ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên bác sĩ
                  </label>
                  <input
                    type="text"
                    name="doctorName"
                    value={form.doctorName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên bác sĩ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bệnh viện/Phòng khám
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={form.hospitalName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên bệnh viện"
                  />
                </div>
              </div>
            </div>

            {/* Branch and Pharmacist Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chọn chi nhánh và dược sĩ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi nhánh *
                  </label>
                  <select
                    name="branch"
                    value={form.branch}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dược sĩ phụ trách *
                  </label>
                  <select
                    name="pharmacist"
                    value={form.pharmacist}
                    onChange={handleSelectChange}
                    required
                    disabled={!form.branch || loadingPharmacists}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!form.branch 
                        ? 'Vui lòng chọn chi nhánh trước'
                        : loadingPharmacists 
                        ? 'Đang tải dược sĩ...'
                        : pharmacists.length === 0
                        ? 'Không có dược sĩ tại chi nhánh này'
                        : 'Chọn dược sĩ'
                      }
                    </option>
                    {pharmacists.map((pharmacist) => (
                      <option key={pharmacist.id} value={pharmacist.id}>
                        {pharmacist.full_name || 'Dược sĩ'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Prescription Content */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nội dung đơn thuốc
              </h3>
              
              {activeTab === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhập đơn thuốc *
                  </label>
                  <textarea
                    name="prescriptionText"
                    value={form.prescriptionText}
                    onChange={handleInputChange}
                    required
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập chi tiết đơn thuốc bao gồm:
- Tên thuốc
- Liều lượng
- Cách dùng
- Số lượng
- Ghi chú đặc biệt"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tải ảnh đơn thuốc *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Chọn ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">hoặc kéo thả</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG tối đa 10MB
                      </p>
                      {form.prescriptionImage && (
                        <p className="text-sm text-green-600 mt-2">
                          Đã chọn: {form.prescriptionImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Gửi đơn thuốc
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Prescription;