import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import DeliveryTracker from '../components/ui/DeliveryTracker';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Package,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart
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

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered'>('confirmed');
  const { addToCart } = useCart();

  const productImages = [
    'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg',
    'https://images.pexels.com/photos/3683077/pexels-photo-3683077.jpeg',
    'https://images.pexels.com/photos/3683073/pexels-photo-3683073.jpeg'
  ];

  const features = [
    {
      icon: Shield,
      title: 'Chất lượng đảm bảo',
      description: 'Sản phẩm chính hãng, đạt tiêu chuẩn chất lượng'
    },
    {
      icon: Clock,
      title: 'Giao hàng nhanh',
      description: 'Giao hàng trong 24h tại TP.HCM'
    },
    {
      icon: CheckCircle,
      title: 'Tư vấn miễn phí',
      description: 'Đội ngũ dược sĩ tư vấn 24/7'
    }
  ];

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.products.getById(id!);

      if (response.error) {
        if (response.error === 'Product not found') {
          setProduct(null);
          return;
        }
        throw new Error(response.error);
      }
      
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url
      });
    }
  };

  const getCurrentStep = () => {
    const steps = ['confirmed', 'preparing', 'shipped', 'delivered'];
    return steps.indexOf(orderStatus) + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Không tìm thấy sản phẩm
            </h1>
            <p className="text-gray-600 mb-6">
              Sản phẩm này có thể đã bị xóa hoặc không tồn tại
            </p>
            <Link
              to="/order"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/order"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại danh sách sản phẩm
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={product.image_url || productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {product.category}
                </span>
                {product.is_prescription_required && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    Cần đơn thuốc
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">(4.5 đánh giá)</span>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-blue-600">
                  {product.price.toLocaleString()}đ
                </span>
                <span className="text-gray-500 ml-2">
                  (Còn {product.stock_quantity} sản phẩm)
                </span>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description || `${product.name} là sản phẩm chất lượng cao được sản xuất theo tiêu chuẩn quốc tế. Sản phẩm đã được kiểm nghiệm và chứng nhận an toàn cho sức khỏe người dùng. Với công thức độc quyền và thành phần thiên nhiên, sản phẩm mang lại hiệu quả tối ưu và an toàn tuyệt đối.`}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <feature.icon className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 text-xs">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold inline-flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Thêm vào giỏ hàng
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {product.is_prescription_required && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">
                    Sản phẩm cần đơn thuốc
                  </span>
                </div>
                <p className="text-yellow-700 text-sm">
                  Sản phẩm này yêu cầu đơn thuốc từ bác sĩ. Vui lòng tải lên đơn thuốc tại trang Đơn thuốc.
                </p>
                <Link
                  to="/prescription"
                  className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Tải lên đơn thuốc →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Tracking Demo */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Theo dõi giao hàng (Demo)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DeliveryTracker 
              currentStep={getCurrentStep()} 
              orderStatus={orderStatus} 
            />
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Thay đổi trạng thái demo
              </h3>
              <div className="space-y-2">
                {['confirmed', 'preparing', 'shipped', 'delivered'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatus(status as any)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      orderStatus === status
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {status === 'confirmed' && 'Đã xác nhận'}
                    {status === 'preparing' && 'Đang chuẩn bị'}
                    {status === 'shipped' && 'Đang giao hàng'}
                    {status === 'delivered' && 'Đã giao hàng'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;