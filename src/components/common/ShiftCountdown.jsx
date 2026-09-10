import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ShiftCountdown = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user || !user.shift) {
      setTimeLeft(null);
      return;
    }
    
    // Ignore superadmin and medical-director
    if (user.accountType === 'super-admin' || user.accountType === 'medical-director') {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      let endHour = 0;
      if (user.shift === 'morning') {
        endHour = 20; // 20:00
      } else if (user.shift === 'night') {
        endHour = 8; // 08:00
      }

      // Find the next occurrence of endHour
      const endTime = new Date();
      endTime.setHours(endHour, 0, 0, 0);
      
      if (now >= endTime) {
        // If current time is past the end hour for today, the shift ends tomorrow
        endTime.setDate(endTime.getDate() + 1);
      }
      
      const diffMs = endTime - now;
      
      if (diffMs <= 0) {
        toast.error('Your shift has ended. Logging you out.');
        dispatch(logoutUser());
        navigate('/login');
        return null;
      }
      
      return diffMs;
    };

    const timer = setInterval(() => {
      const remainingMs = calculateTimeLeft();
      if (remainingMs !== null) {
        setTimeLeft(remainingMs);
      }
    }, 1000);

    // Initial calc
    const initialRemaining = calculateTimeLeft();
    if (initialRemaining !== null) {
      setTimeLeft(initialRemaining);
    }

    return () => clearInterval(timer);
  }, [user, isAuthenticated, dispatch, navigate]);

  if (!timeLeft) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  // Only show when there is less than 1 hour left
  if (hours >= 1) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] bg-error text-white px-4 py-2 rounded-lg shadow-xl font-bold flex items-center space-x-2 animate-pulse">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      <span>
        Shift ends in: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default ShiftCountdown;
