import React from 'react';
import { FaRedoAlt, FaExclamationTriangle } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);

    // If chunk loading failed (e.g. new deployment or stale dev chunk), reload page
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Importing a module script failed") ||
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Cannot read properties of null (reading 'useContext')");

    if (isChunkError) {
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem("chunk_reload_time") || "0", 10);
      if (now - lastReload > 8000) {
        sessionStorage.setItem("chunk_reload_time", String(now));
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem("chunk_reload_time");
    sessionStorage.removeItem("chunk_reload_attempted");
    // Cache-bust reload to ensure latest bundles are fetched from server
    const url = new URL(window.location.href);
    url.searchParams.set('_r', Date.now().toString());
    window.location.replace(url.toString());
  };

  handleGoLogin = () => {
    sessionStorage.removeItem("chunk_reload_time");
    sessionStorage.removeItem("chunk_reload_attempted");
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-base-100 p-8 rounded-2xl shadow-xl max-w-md w-full border border-base-300">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-base-content mb-2">Something went wrong</h2>
            <p className="text-sm text-base-content/70 mb-6">
              A temporary interface loading issue occurred. Please refresh the page to continue working.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="btn btn-primary flex-1 gap-2 text-white font-medium shadow-sm"
              >
                <FaRedoAlt className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoLogin}
                className="btn btn-ghost flex-1 text-base-content/70"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
