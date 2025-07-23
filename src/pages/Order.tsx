import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Search,
  Filter,
  ShoppingCart,
  Heart,
  Star,
  Package,
  Truck,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  is_prescription_required: boolean;
}

const Order: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const { addToCart } = useCart();

  const categories = [
    { id: 'all', name: 'Tất cả', icon: Package },
    { id: 'Heart', name: 'Tim mạch', icon: Heart },
    { id: 'Skin', name: 'Da liễu', icon: Star }
  ];

  const orderSteps = [
    {
      id: 1,
      title: 'Đã xác nhận',
      description: 'Đơn hàng được xác nhận',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 2,
      title: 'Kiểm tra chất lượng',
      description: 'Kiểm tra sản phẩm',
      icon: Star,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 3,
      title: 'Đóng gói',
      description: 'Đóng gói cẩn thận',
      icon: Package,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 4,
      title: 'Giao hàng',
      description: 'Giao cho đơn vị vận chuyển',
      icon: Truck,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.products.getAll({ sortBy: 'name' });

        if (response.error) {
          console.error('Error fetching products:', response.error);
          setProducts([]);
        } else {
          setProducts(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);


  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        return a.price - b.price;
      }
      return a.name.localeCompare(b.name);
    });

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sản phẩm của chúng tôi
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tìm kiếm và đặt hàng các sản phẩm chăm sóc sức khỏe chất lượng cao
            </p>
          </div>
        </div>
      </div>

      {/* Order Fulfillment Process */}
      <div className="bg-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quy trình xử lý đơn hàng
            </h2>
            <p className="text-gray-600">
              Cam kết chất lượng từ khâu nhận đơn đến giao hàng
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {orderSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 text-center shadow-md"
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${step.color}`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Tên A-Z</option>
                <option value="price">Giá thấp đến cao</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {product.category}
                  </span>
                </div>
                {product.is_prescription_required && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      Cần đơn
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description || 'Sản phẩm chất lượng cao'}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-600">
                    {product.price.toLocaleString()}đ
                  </span>
                  <span className="text-sm text-gray-500">
                    Còn {product.stock_quantity}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium inline-flex items-center justify-center"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Thêm vào giỏ
                  </button>
                  <Link
                    to={`/order/details/${product.id}`}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
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
  );
};

export default Order;