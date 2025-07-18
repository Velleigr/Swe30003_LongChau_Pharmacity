import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  CheckCircle, 
  Package, 
  Truck, 
  Clock,
  User,
  Shield,
  MapPin,
  Bell
} from 'lucide-react';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'active' | 'pending';
  details: string[];
  estimatedTime: string;
}

const InteractiveWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: "Tải lên đơn thuốc",
      description: "Khách hàng tải lên đơn thuốc qua ứng dụng di động hoặc website",
      icon: <Upload className="w-6 h-6" />,
      status: activeStep > 1 ? 'completed' : activeStep === 1 ? 'active' : 'pending',
      details: [
        "Tải ảnh bảo mật với tự động tăng cường chất lượng",
        "Nhận dạng văn bản OCR để đảm bảo độ chính xác",
        "Xác nhận ngay lập tức và cấp mã theo dõi"
      ],
      estimatedTime: "2 phút"
    },
    {
      id: 2,
      title: "Xác thực & Phê duyệt",
      description: "Dược sĩ kiểm tra và xác thực đơn thuốc",
      icon: <CheckCircle className="w-6 h-6" />,
      status: activeStep > 2 ? 'completed' : activeStep === 2 ? 'active' : 'pending',
      details: [
        "Kiểm tra tương tác thuốc",
        "Xác minh bảo hiểm y tế",
        "Kiểm tra liều lượng và an toàn"
      ],
      estimatedTime: "15 phút"
    },
    {
      id: 3,
      title: "Đóng gói đơn hàng",
      description: "Thuốc được chuẩn bị và đóng gói để giao hàng",
      icon: <Package className="w-6 h-6" />,
      status: activeStep > 3 ? 'completed' : activeStep === 3 ? 'active' : 'pending',
      details: [
        "Kiểm tra chất lượng sản phẩm",
        "Đóng gói bảo mật với kiểm soát nhiệt độ",
        "Dán nhãn với thông tin bệnh nhân"
      ],
      estimatedTime: "30 phút"
    },
    {
      id: 4,
      title: "Giao hàng cho khách",
      description: "Đơn hàng được vận chuyển và giao đến khách hàng",
      icon: <Truck className="w-6 h-6" />,
      status: activeStep > 4 ? 'completed' : activeStep === 4 ? 'active' : 'pending',
      details: [
        "Theo dõi GPS thời gian thực",
        "Thông báo SMS cập nhật tình trạng giao hàng",
        "Tùy chọn giao hàng không tiếp xúc"
      ],
      estimatedTime: "2-4 giờ"
    }
  ];

  const playAnimation = () => {
    setIsPlaying(true);
    setActiveStep(1);
    
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsPlaying(false);
          return 4;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'active':
        return 'bg-blue-500 border-blue-500 text-white';
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500';
    }
  };

  const getConnectorColor = (stepIndex: number) => {
    return activeStep > stepIndex + 1 ? 'bg-green-500' : 'bg-gray-300';
  };

  return (
    <div className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Quy trình tương tác</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Trải nghiệm quy trình được tối ưu hóa từ tải lên đơn thuốc đến giao hàng tận nhà
          </p>
          <button
            onClick={playAnimation}
            disabled={isPlaying}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
              isPlaying
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            }`}
          >
            {isPlaying ? 'Đang phát hoạt ảnh...' : 'Phát hoạt ảnh quy trình'}
          </button>
        </motion.div>

        {/* Workflow Steps */}
        <div className="relative">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between mb-16">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  onClick={() => !isPlaying && setActiveStep(step.id)}
                  className={`relative cursor-pointer transition-all duration-500 ${
                    !isPlaying ? 'hover:scale-105' : ''
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${getStepColor(step.status)}`}
                  >
                    {step.status === 'completed' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle className="w-8 h-8" />
                      </motion.div>
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  {step.status === 'active' && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-blue-300"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full transition-all duration-1000 ${getConnectorColor(index)}`}
                        initial={{ width: '0%' }}
                        animate={{ 
                          width: activeStep > index + 1 ? '100%' : '0%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-6 mb-16">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => !isPlaying && setActiveStep(step.id)}
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${getStepColor(step.status)}`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <div className="w-1 h-16 bg-gray-300 mt-2">
                      <motion.div
                        className={`w-full transition-all duration-1000 ${getConnectorColor(index)}`}
                        initial={{ height: '0%' }}
                        animate={{ 
                          height: activeStep > index + 1 ? '100%' : '0%'
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${getStepColor(steps[activeStep - 1].status)}`}>
                      {steps[activeStep - 1].icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {steps[activeStep - 1].title}
                      </h3>
                      <p className="text-gray-600">{steps[activeStep - 1].description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {steps[activeStep - 1].details.map((detail, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-gray-700">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Thời gian ước tính</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {steps[activeStep - 1].estimatedTime}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Bell className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Cập nhật thời gian thực</span>
                    </div>
                    <p className="text-gray-600">
                      Nhận thông báo ngay lập tức qua SMS và email tại mỗi bước
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-900">Theo dõi trực tiếp</span>
                    </div>
                    <p className="text-gray-600">
                      Theo dõi đơn hàng của bạn theo thời gian thực từ chuẩn bị đến giao hàng
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InteractiveWorkflow;