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

  handleGoDashboard = () => {
    sessionStorage.removeItem("chunk_reload_time");
    sessionStorage.removeItem("chunk_reload_attempted");
    window.location.href = "/";
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
            <p className="text-sm text-base-content/70 mb-4">
              A temporary interface loading issue occurred. Please refresh the page to continue working.
            </p>

            {this.state.error && (
              <details className="text-left mb-6 bg-base-200/80 p-3 rounded-xl border border-base-300">
                <summary className="text-[11px] font-semibold text-base-content/60 cursor-pointer select-none">
                  Technical Details
                </summary>
                <div className="mt-2 text-[10px] font-mono text-error break-all max-h-32 overflow-y-auto">
                  {this.state.error.toString()}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={this.handleReload}
                className="btn btn-primary flex-1 gap-2 text-white font-medium text-xs shadow-sm"
              >
                <FaRedoAlt className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoDashboard}
                className="btn btn-outline btn-primary flex-1 text-xs"
              >
                Dashboard
              </button>
              <button
                onClick={this.handleGoLogin}
                className="btn btn-ghost flex-1 text-xs text-base-content/70"
              >
                Login
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
