import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  comment: string;
  customerName: string;
  productName: string;
}

const Landing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Hard-coded reviews as requested
  const reviews: Review[] = [
    {
      id: '1',
      rating: 5,
      comment: 'Sản phẩm rất tốt, dùng được 2 tháng thấy tim mạch ổn định hơn nhiều. Sẽ tiếp tục sử dụng.',
      customerName: 'Lê Văn Khách',
      productName: 'Thuốc Tim Mạch Cardio Plus'
    },
    {
      id: '2',
      rating: 4,
      comment: 'Kem dưỡng da rất dịu nhẹ, không gây kích ứng. Da mình nhạy cảm mà dùng rất ổn.',
      customerName: 'Phạm Thị Hoa',
      productName: 'Kem Dưỡng Da Sensitive Care'
    },
    {
      id: '3',
      rating: 5,
      comment: 'Serum vitamin C này hiệu quả thật sự! Da sáng lên rõ rệt sau 3 tuần sử dụng.',
      customerName: 'Hoàng Minh Tuấn',
      productName: 'Serum Vitamin C Brightening'
    },
    {
      id: '4',
      rating: 4,
      comment: 'CoQ10 chất lượng tốt, cảm thấy có năng lượng hơn sau khi dùng. Giá cả hợp lý.',
      customerName: 'Nguyễn Thị Mai',
      productName: 'Viên Uống Hỗ Trợ Tim Mạch CoQ10'
    },
    {
      id: '5',
      rating: 5,
      comment: 'Sữa rửa mặt rất nhẹ nhàng, không làm khô da. Phù hợp với da nhạy cảm như mình.',
      customerName: 'Trần Văn Nam',
      productName: 'Sữa Rửa Mặt Gentle Cleanser'
    }
  ];
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
    fetchProducts();
  }, []);

  // Auto-slide reviews every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  const fetchProducts = async () => {
    try {
      // Mock products data for now - replace with actual Supabase call when configured
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Thuốc Tim Mạch Cardio Plus',
          description: 'Hỗ trợ tim mạch, giảm cholesterol xấu, tăng cường sức khỏe tim mạch. Thành phần thiên nhiên an toàn.',
          price: 250000,
          category: 'Heart',
          image_url: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'
        },
        {
          id: '2',
          name: 'Viên Uống Hỗ Trợ Tim Mạch CoQ10',
          description: 'Bổ sung CoQ10 tự nhiên, hỗ trợ chức năng tim, tăng cường năng lượng cho cơ thể.',
          price: 180000,
          category: 'Heart',
          image_url: 'https://images.pexels.com/photos/3683077/pexels-photo-3683077.jpeg'
        },
        {
          id: '3',
          name: 'Kem Dưỡng Da Sensitive Care',
          description: 'Kem dưỡng da nhạy cảm, không gây kích ứng, phù hợp cho mọi loại da.',
          price: 85000,
          category: 'Skin',
          image_url: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg'
        },
        {
          id: '4',
          name: 'Serum Vitamin C Brightening',
          description: 'Serum vitamin C tự nhiên, làm sáng da, chống lão hóa, giảm thâm nám hiệu quả.',
          price: 320000,
          category: 'Skin',
          image_url: 'https://images.pexels.com/photos/3762882/pexels-photo-3762882.jpeg'
        },
        {
          id: '5',
          name: 'Viên Uống Omega-3 Fish Oil',
          description: 'Bổ sung Omega-3 từ dầu cá tự nhiên, hỗ trợ não bộ và tim mạch.',
          price: 280000,
          category: 'Heart',
          image_url: 'https://images.pexels.com/photos/3683078/pexels-photo-3683078.jpeg'
        },
        {
          id: '6',
          name: 'Sữa Rửa Mặt Gentle Cleanser',
          description: 'Sữa rửa mặt dịu nhẹ, phù hợp cho da nhạy cảm, không làm khô da.',
          price: 65000,
          category: 'Skin',
          image_url: 'https://images.pexels.com/photos/3762888/pexels-photo-3762888.jpeg'
        }
      ];

      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);


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

          <div className="relative max-w-4xl mx-auto overflow-hidden">
            <div className="bg-white rounded-xl shadow-lg p-8 relative">
              <div 
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentReviewIndex * 100}%)` }}
              >
                {reviews.map((review, index) => (
                  <div key={review.id} className="w-full flex-shrink-0 text-center">
                    <div className="flex items-center justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 text-lg mb-4 max-w-2xl mx-auto">
                      "{review.comment}"
                    </p>
                    <div className="text-sm text-gray-500">
                      <p className="font-semibold">
                        {review.customerName}
                      </p>
                      <p>Sản phẩm: {review.productName}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Review indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentReviewIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentReviewIndex
                        ? 'bg-blue-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              {/* Navigation arrows */}
              <button
                onClick={() => setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors opacity-75 hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors opacity-75 hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;