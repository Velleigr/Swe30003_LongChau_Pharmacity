import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Truck, Package, Home } from 'lucide-react';

interface DeliveryTrackerProps {
  currentStep: number;
  orderStatus: string;
}

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ currentStep, orderStatus }) => {
  const steps = [
    {
      id: 1,
      title: 'Đã xác nhận',
      description: 'Đơn hàng đã được xác nhận',
      icon: CheckCircle,
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Đang chuẩn bị',
      description: 'Đang chuẩn bị sản phẩm',
      icon: Package,
      status: 'preparing'
    },
    {
      id: 3,
      title: 'Đang giao hàng',
      description: 'Đang trên đường giao đến bạn',
      icon: Truck,
      status: 'shipped'
    },
    {
      id: 4,
      title: 'Đã giao hàng',
      description: 'Đã giao hàng thành công',
      icon: Home,
      status: 'delivered'
    }
  ];

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">Trạng thái đơn hàng</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-4"
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : status === 'current'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4
                    className={`font-medium ${
                      status === 'completed'
                        ? 'text-green-600'
                        : status === 'current'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {status === 'current' && (
                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
              
              {status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryTracker;