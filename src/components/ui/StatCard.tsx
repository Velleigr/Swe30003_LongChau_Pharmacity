import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const targetValue = parseInt(value.replace(/[^0-9]/g, ''));

  useEffect(() => {
    const timer = setTimeout(() => {
      const increment = targetValue / 100;
      let current = 0;
      const counter = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
          setCount(targetValue);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, 20);
    }, delay);

    return () => clearTimeout(timer);
  }, [targetValue, delay]);

  const formatValue = (num: number) => {
    if (value.includes('%')) return `${num}%`;
    if (value.includes('+')) return `${num.toLocaleString()}+`;
    return num.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatValue(count)}
          </div>
          <div className="text-gray-600 text-sm">{label}</div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;