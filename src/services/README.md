# API Services Documentation

## Overview

This directory contains the API service layer for the HMS Frontend application, built with Redux Toolkit for state management and Axios for HTTP requests.

## Structure

```
src/services/
├── api/
│   ├── apiClient.js      # Axios configuration and interceptors
│   └── authAPI.js        # Authentication API endpoints
└── README.md            # This file
```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_API_BASE_URL=https://your-api-base-url.com/api
VITE_APP_NAME=HMS Frontend
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

### API Client

The `apiClient.js` file provides:

- Base URL configuration
- Request/response interceptors
- Automatic token management
- Token refresh handling
- Error handling

## Authentication Flow

1. **Login**: User credentials are sent to the API
2. **Token Storage**: JWT tokens are stored in Redux state and persisted
3. **Request Interceptor**: Automatically adds Bearer token to requests
4. **Token Refresh**: Automatically refreshes expired tokens
5. **Logout**: Clears tokens and redirects to login

## Usage Examples

### Using Redux Actions

```javascript
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser, logoutUser } from "../store/slices/authSlice";

const LoginComponent = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const handleLogin = async (credentials) => {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      // Login successful
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };
};
```

### Direct API Calls

```javascript
import { authAPI } from "../services/api/authAPI";

const response = await authAPI.login(credentials);
```

## State Management

The application uses Redux Toolkit with the following slices:

- `authSlice`: Authentication state and actions
- `userSlice`: User profile management
- `patientSlice`: Patient data management
- `appointmentSlice`: Appointment data management

## Error Handling

- API errors are automatically handled by interceptors
- Redux actions provide error states
- User-friendly error messages are displayed
- Automatic retry for token refresh failures

## Security Features

- JWT token storage in Redux with persistence
- Automatic token refresh
- Request/response interceptors
- Protected routes based on user roles
- Secure logout with token invalidation

## Next Steps

1. Update the `VITE_API_BASE_URL` in your `.env` file
2. Test the authentication flow
3. Implement additional API endpoints as needed
4. Add more Redux slices for other features

