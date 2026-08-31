import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { store, persistor } from './store';
import AppRoutes from './routes/AppRoutes';
import TokenExpirationHandler from './components/common/TokenExpirationHandler';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <ThemeProvider>
          <Router>
            <NotificationProvider>
              <div className="App">
                <AppRoutes />

                {/* Global Token Expiration Handler */}
                <TokenExpirationHandler />

                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />

              </div>
            </NotificationProvider>
          </Router>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;