// src/components/ErrorBoundary.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowRoundBack } from 'react-icons/io';

const handleClick = () => {
  return (window.location.href = '/');
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <main className="h-screen w-screen bg-light-green/5 flex items-center justify-center overflow-hidden">
          <div className=" w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-light-green/10 rounded-full p-4 flex items-center justify-center ring-3 ring-light-green">
            <div className="bg-white w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-sm shadow-2xl flex flex-col items-center justify-center">
              <h1 className="text-[50px] font-extrabold text-dark-gray">Oops !!!</h1>
              <p className="font-bold my-2 text-danger">An Error occurred !</p>
              <p className="text-2xs md:text-sm">This isn't your fault, we will fix it shortly</p>
              <button
                onClick={handleClick}
                className="flex items-center mt-10 bg-green text-white rounded-sm py-2 px-3 transition-all duration-300 ease-in-out hover:bg-light-green text-sm"
              >
                <IoIosArrowRoundBack className="mr-1 text-lg" /> Go Back
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
