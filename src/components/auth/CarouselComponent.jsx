/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { carouselImages } from '@/assets/login/imageConfig';
import { motion } from 'framer-motion';

const CarouselComponent = ({ autoRotateInterval = 4000 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images
  useEffect(() => {
    if (autoRotateInterval <= 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [autoRotateInterval]);

  const handleDotClick = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Images */}
      {carouselImages.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: index === currentImageIndex ? 1 : 0,
            scale: index === currentImageIndex ? 1 : 1.1
          }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={item.src}
            alt={item.alt}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </motion.div>
      ))}
      
      {/* Carousel Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex 
                ? 'bg-green-500' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselComponent;
