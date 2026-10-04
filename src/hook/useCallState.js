import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';

export const useCallState = () => {
  const user = useAppSelector((state) => state.auth.user);
  const currentUserId = user?.id || user?._id;

  const isLockedForMe = useCallback((data) => {
    if (!data?.isCalled || !data?.calledByUserId) return false;
    return String(data.calledByUserId) !== String(currentUserId);
  }, [currentUserId]);

  return { isLockedForMe };
};
