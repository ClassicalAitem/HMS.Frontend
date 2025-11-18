import React from 'react';
import { useAppSelector } from '../../store/hooks';

const TokenDebug = () => {
  const { token, refreshToken, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Get tokens from localStorage
  const localToken = localStorage.getItem('token');
  const localRefreshToken = localStorage.getItem('refreshToken');

  const testTokenRetrieval = () => {
    console.log('🧪 TokenDebug: Testing token retrieval...');
    const directToken = localStorage.getItem('token');
    console.log('🧪 TokenDebug: Direct localStorage token:', directToken);
    
    if (directToken) {
      const cleanToken = directToken.replace(/^["']|["']$/g, '').trim();
      const jwtParts = cleanToken.split('.');
      console.log('🧪 TokenDebug: JWT parts count:', jwtParts.length);
      console.log('🧪 TokenDebug: JWT parts:', jwtParts);
      console.log('🧪 TokenDebug: Is valid JWT:', jwtParts.length === 3);
    }
    
    console.log('🧪 TokenDebug: All localStorage keys:', Object.keys(localStorage));
    
    const persistRoot = localStorage.getItem('persist:root');
    if (persistRoot) {
      try {
        const parsed = JSON.parse(persistRoot);
        console.log('🧪 TokenDebug: Parsed persist:root:', parsed);
        console.log('🧪 TokenDebug: Auth from persist:root:', parsed?.auth);
      } catch (error) {
        console.error('🧪 TokenDebug: Error parsing persist:root:', error);
      }
    }
  };

  return (
    <div className="p-4 max-w-md bg-orange-100 rounded-lg">
      <h3 className="mb-2 text-lg font-semibold">Token Debug</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Redux Token:</strong> {token ? 'Present' : 'Missing'}</div>
        <div><strong>Redux Refresh Token:</strong> {refreshToken ? 'Present' : 'Missing'}</div>
        <div><strong>LocalStorage Token:</strong> {localToken ? 'Present' : 'Missing'}</div>
        <div><strong>LocalStorage Refresh Token:</strong> {localRefreshToken ? 'Present' : 'Missing'}</div>
        <div><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        
        {localToken && (
          <div>
            <strong>JWT Valid:</strong> {localToken.split('.').length === 3 ? 'Yes' : 'No'}
            {localToken.split('.').length !== 3 && (
              <span className="ml-2 text-red-600">⚠️ Malformed JWT</span>
            )}
          </div>
        )}
        
        <button
          onClick={testTokenRetrieval}
          className="mt-2 btn btn-sm btn-outline"
        >
          Test Token Retrieval
        </button>
        
        {token && (
          <div className="p-2 mt-2 text-xs bg-gray-200 rounded">
            <strong>Redux Token Preview:</strong><br/>
            {token.substring(0, 20)}...
          </div>
        )}
        
        {localToken && (
          <div className="p-2 mt-2 text-xs bg-gray-200 rounded">
            <strong>LocalStorage Token Preview:</strong><br/>
            {localToken.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDebug;
