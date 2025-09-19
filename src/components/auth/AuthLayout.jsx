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
    <div className="flex min-h-screen">
      {/* Left Side - Image Carousel */}
      {showCarousel && (
        <div className="hidden relative bg-gray-100 lg:flex lg:w-1/2">
          <CarouselComponent autoRotateInterval={carouselAutoRotate} />
        </div>
      )}

      {/* Right Side - Content */}
      <div
        className={`${
          showCarousel ? "w-full lg:w-1/2" : "w-full"
        } flex items-center justify-center p-8 bg-base-100`}
      >
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="mb-12 text-center">
            <AuthLogo className="mb-8" />

            {title && (
              <h1 className="mb-2 text-2xl font-semibold tracking-wide 2xl:text-3xl text-primary">
                {title}
              </h1>
            )}

            {subtitle && <p className="text-sm text-base-content/70 2xl:text-base">{subtitle}</p>}
          </div>

          {/* Content */}
          {children}

          {/* Footer */}
          <div className="mt-12 text-center">
            <p
              className="text-xs text-base-content/80 2xl:text-base"
            >
              © Kolak Hospital Management System 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
