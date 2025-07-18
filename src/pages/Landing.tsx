import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import InteractiveWorkflow from '../components/ui/InteractiveWorkflow';
import {
  Heart,
  ShoppingCart,
  FileText,
  Users,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  users: {
    full_name: string | null;
    username: string;
  };
  products: {
    name: string;
  };
}

const Landing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentReview, setCurrentReview] = useState(0);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: Heart },
    { id: 'Heart', name: 'Tim mạch', icon: Heart },
    { id: 'Skin', name: 'Da liễu', icon: Shield }
  ];

  const prescriptionSteps = [
    {
      id: 1,
      title: 'Tải lên đơn thuốc',
      description: 'Chụp ảnh hoặc nhập thông tin đơn thuốc',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2,
      title: 'Dược sĩ kiểm tra',
      description: 'Kiểm tra tương tác thuốc và an toàn',
      icon: Shield,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      title: 'Phê duyệt',
      description: 'Xác nhận và tạo đơn hàng tự động',
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 4,
      title: 'Giao hàng',
      description: 'Chuẩn bị và giao hàng tận nơi',
      icon: Package,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  useEffect(() => {
    // Use mock data instead of fetching from Supabase
    setProducts(mockProducts);
    setLoading(false);
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Hệ thống quản lý
              <span className="block text-yellow-300">Long Châu</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Nền tảng số hóa hiện đại hỗ trợ quản lý nhà thuốc, từ đơn thuốc đến giao hàng,
              đảm bảo an toàn và hiệu quả cho mọi vai trò.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/prescription"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                <FileText className="w-5 h-5 mr-2" />
                Tải đơn thuốc
              </Link>
              <Link
                to="/order"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Đặt hàng ngay
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Thống kê hoạt động
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hệ thống LC-PMS đã phục vụ hàng nghìn nhà thuốc trên toàn quốc
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard
              icon={<Users className="w-6 h-6 text-white" />}
              value="10,000+"
              label="Nhà thuốc phục vụ"
              color="bg-blue-500"
              delay={0}
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6 text-white" />}
              value="99%"
              label="Độ chính xác đơn thuốc"
              color="bg-green-500"
              delay={0.2}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-white" />}
              value="24/7"
              label="Hỗ trợ liên tục"
              color="bg-purple-500"
              delay={0.4}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-white" />}
              value="500,000+"
              label="Đơn hàng đã giao"
              color="bg-orange-500"
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sản phẩm phổ biến
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những sản phẩm được tin dùng nhất từ khách hàng
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-50'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={product.image_url || 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description || 'Sản phẩm chất lượng cao từ Long Châu'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.price.toLocaleString()}đ
                    </span>
                    <Link
                      to={`/order/details/${product.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prescription Validation Animation */}
      <InteractiveWorkflow />

      {/* Customer Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Đánh giá khách hàng
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những phản hồi tích cực từ khách hàng tin dùng
            </p>
          </div>

          {reviews.length > 0 && (
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={prevReview}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < reviews[currentReview].rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 text-lg mb-4">
                      "{reviews[currentReview].comment || 'Sản phẩm tuyệt vời, tôi rất hài lòng!'}"
                    </p>
                    <div className="text-sm text-gray-500">
                      <p className="font-semibold">
                        {reviews[currentReview].users.full_name || reviews[currentReview].users.username}
                      </p>
                      <p>Sản phẩm: {reviews[currentReview].products.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={nextReview}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;