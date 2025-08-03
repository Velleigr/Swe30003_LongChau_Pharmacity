import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  Edit,
  CheckCircle,
  X,
  DollarSign,
  BarChart3,
  Shield,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface InventoryItem {
  id: string;
  product_id: string;
  branch: string;
  quantity: number;
  min_threshold: number;
  max_threshold: number;
  last_updated: string;
  updated_by: string | null;
  created_at: string;
  products: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    is_prescription_required: boolean;
  };
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);

  const branches = [
    { id: 'all', name: 'Tất cả chi nhánh' },
    { id: 'hcm-district1', name: 'Long Châu Quận 1 - TP.HCM' },
    { id: 'hcm-district2', name: 'Long Châu Quận 2 - TP.HCM' },
    { id: 'hcm-district3', name: 'Long Châu Quận 3 - TP.HCM' },
    { id: 'hcm-district4', name: 'Long Châu Quận 4 - TP.HCM' },
    { id: 'hcm-district5', name: 'Long Châu Quận 5 - TP.HCM' },
    { id: 'hcm-district6', name: 'Long Châu Quận 6 - TP.HCM' },
    { id: 'hcm-district7', name: 'Long Châu Quận 7 - TP.HCM' },
    { id: 'hcm-tanbinh', name: 'Long Châu Tân Bình - TP.HCM' },
    { id: 'hcm-binhthanh', name: 'Long Châu Bình Thạnh - TP.HCM' },
    { id: 'hcm-govap', name: 'Long Châu Gò Vấp - TP.HCM' },
    { id: 'hcm-thuduc', name: 'Long Châu Thủ Đức - TP.HCM' }
  ];

  const categories = [
    { id: 'all', name: 'Tất cả danh mục' },
    { id: 'Heart', name: 'Tim mạch' },
    { id: 'Skin', name: 'Da liễu' },
    { id: 'Vitamins', name: 'Vitamin' },
    { id: 'Pain Relief', name: 'Giảm đau' },
    { id: 'Antibiotics', name: 'Kháng sinh' }
  ];

  // Check if user is manager or pharmacist
  if (!user || (user.role !== 'manager' && user.role !== 'pharmacist')) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchInventory();
  }, [selectedBranch]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('inventory')
        .select(`
          *,
          products (
            id,
            name,
            description,
            price,
            category,
            image_url,
            is_prescription_required
          )
        `);
      
      // Filter by branch if not 'all'
      if (selectedBranch !== 'all') {
        query = query.eq('branch', selectedBranch);
      }
      
      // If user is pharmacist, only show their branch
      if (user.role === 'pharmacist' && user.branch) {
        query = query.eq('branch', user.branch);
        setSelectedBranch(user.branch);
      }
      
      query = query.order('last_updated', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inventory:', error);
        setInventory([]);
      } else {
        setInventory(data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (inventoryId: string, newStock: number) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newStock,
          last_updated: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', inventoryId)
        .select(`
          *,
          products (
            id,
            name,
            description,
            price,
            category,
            image_url,
            is_prescription_required
          )
        `)
        .single();

      if (error) {
        console.error('Error updating inventory:', error);
        return;
      }

      if (data) {
        setInventory(prev => prev.map(item => 
          item.id === inventoryId ? data : item
        ));
        setEditingStock(null);
        setNewStockValue(0);
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const filteredInventory = inventory
    .filter(item => {
      const product = item.products;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.products.name.localeCompare(b.products.name);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'price':
          comparison = a.products.price - b.products.price;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const lowStockItems = filteredInventory.filter(item => item.quantity <= item.min_threshold);
  const outOfStockItems = filteredInventory.filter(item => item.quantity === 0);

  const totalProducts = filteredInventory.length;
  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
  const lowStockCount = lowStockItems.length;
  const outOfStockCount = outOfStockItems.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const InventoryRow: React.FC<{ item: InventoryItem; isLowStock?: boolean }> = ({ item, isLowStock = false }) => (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-b border-gray-200 hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}
    >
      <td className="py-4 px-6">
        <div className="flex items-center space-x-3">
          <img
            src={item.products.image_url || 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'}
            alt={item.products.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{item.products.name}</h3>
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {item.products.description || 'Không có mô tả'}
            </p>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item.products.category}
        </span>
      </td>
      
      <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {branches.find(b => b.id === item.branch)?.name.split(' - ')[0].replace('Long Châu ', '') || item.branch}
        </span>
      </td>
      
      <td className="py-4 px-6">
        <span className="font-medium text-gray-900">
          {item.products.price.toLocaleString()}đ
        </span>
      </td>
      
      <td className="py-4 px-6">
        {editingStock === item.id ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={newStockValue}
              onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              placeholder="Số lượng"
            />
            <button
              onClick={() => handleStockUpdate(item.id, newStockValue)}
              className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingStock(null);
                setNewStockValue(0);
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${
              item.quantity === 0 ? 'text-red-600' :
              item.quantity <= item.min_threshold ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {item.quantity}
            </span>
            <span className="text-xs text-gray-500">
              (Min: {item.min_threshold})
            </span>
            <button
              onClick={() => {
                setEditingStock(item.id);
                setNewStockValue(item.quantity);
              }}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
      
      <td className="py-4 px-6">
        <span className="font-medium text-gray-900">
          {(item.products.price * item.quantity).toLocaleString()}đ
        </span>
      </td>
      
      <td className="py-4 px-6">
        <div className="flex items-center space-x-2">
          {item.products.is_prescription_required && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <Shield className="w-3 h-3 mr-1" />
              Cần đơn
            </span>
          )}
          {item.quantity === 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Hết hàng
            </span>
          )}
          {item.quantity > 0 && item.quantity <= item.min_threshold && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Sắp hết
            </span>
          )}
        </div>
      </td>
    </motion.tr>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý kho hàng theo chi nhánh
          </h1>
          <p className="text-gray-600">
            Theo dõi và quản lý tồn kho sản phẩm tại các chi nhánh
          </p>
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
                <p className="text-sm text-gray-600 mb-1">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-gray-600 mb-1">Giá trị tồn kho</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalValue.toLocaleString()}đ
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
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
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
                <p className="text-sm text-gray-600 mb-1">Hết hàng</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Branch Filter - Only show for managers */}
            {user.role === 'manager' && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'price')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Tên sản phẩm</option>
                <option value="quantity">Số lượng tồn</option>
                <option value="price">Giá bán</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Items Section */}
        {lowStockItems.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-bold text-red-900">
                    Sản phẩm sắp hết hàng ({lowStockItems.length})
                  </h2>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Các sản phẩm có số lượng tồn kho dưới ngưỡng tối thiểu
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi nhánh
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá bán
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá trị
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockItems.map((item) => (
                      <InventoryRow key={item.id} item={item} isLowStock={true} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Inventory Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Tồn kho {selectedBranch !== 'all' ? `- ${branches.find(b => b.id === selectedBranch)?.name}` : 'tất cả chi nhánh'} ({filteredInventory.length})
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>Quản lý tồn kho theo chi nhánh</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi nhánh
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <InventoryRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-600">
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
