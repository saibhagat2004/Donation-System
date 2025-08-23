import React from 'react';
import { useNavigate } from 'react-router-dom';

const RouteErrorFallback = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    resetError();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔗</div>
        
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Page Load Error
        </h1>
        
        <p className="text-gray-600 mb-6">
          There was an error loading this page. This might be due to a missing component or routing issue.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left bg-gray-100 p-4 rounded-lg mb-4">
            <summary className="cursor-pointer font-semibold text-red-600 mb-2">
              Error Details (Development)
            </summary>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 bg-red-50 p-2 rounded">
              {error.toString()}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorFallback;
