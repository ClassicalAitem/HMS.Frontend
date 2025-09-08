import React from 'react';
import CarouselComponent from './CarouselComponent';
import AuthLogo from './AuthLogo';

const AuthLayout = ({ 
  children, 
  title, 
  subtitle, 
  showCarousel = true,
  carouselAutoRotate = 4000 
}) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Carousel */}
      {showCarousel && (
        <div className="hidden lg:flex lg:w-1/2 relative bg-gray-100">
          <CarouselComponent autoRotateInterval={carouselAutoRotate} />
        </div>
      )}

      {/* Right Side - Content */}
      <div className={`${showCarousel ? 'w-full lg:w-1/2' : 'w-full'} flex items-center justify-center p-8 bg-white`}>
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-12">
            <AuthLogo className="mb-8" />
            
            {title && (
              <h1 className="text-3xl font-bold text-green-500 mb-2">
                {title}
              </h1>
            )}
            
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Content */}
          {children}

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              © Kolak Hospital Management System 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
