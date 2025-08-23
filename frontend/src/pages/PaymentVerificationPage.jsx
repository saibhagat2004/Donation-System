import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PaymentVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);

  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  useEffect(() => {
    if (orderId) {
      verifyPayment();
    } else if (status) {
      setPaymentStatus(status);
    }
  }, [orderId, status]);

  const verifyPayment = async () => {
    try {
      const response = await axios.post('/api/cashfreepg/verify-order', {
        orderId: orderId
      });

      if (response.data) {
        setPaymentDetails(response.data);
        if (response.data.order_status === 'PAID') {
          setPaymentStatus('success');
          // Redirect to donation receipt after 2 seconds
          setTimeout(() => {
            navigate(`/donation-receipt/${orderId}`);
          }, 2000);
        } else {
          setPaymentStatus('failed');
        }
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setPaymentStatus('error');
    }
  };

  const getStatusContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return {
          icon: '⏳',
          title: 'Verifying Payment...',
          message: 'Please wait while we verify your payment.',
          color: 'text-blue-600'
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          color: 'text-green-600'
        };
      case 'failed':
        return {
          icon: '❌',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          color: 'text-red-600'
        };
      case 'error':
        return {
          icon: '⚠️',
          title: 'Verification Error',
          message: 'There was an error verifying your payment. Please contact support.',
          color: 'text-yellow-600'
        };
      default:
        return {
          icon: '❓',
          title: 'Unknown Status',
          message: 'Payment status could not be determined.',
          color: 'text-gray-600'
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">{statusContent.icon}</div>
        
        <h1 className={`text-2xl font-bold mb-4 ${statusContent.color}`}>
          {statusContent.title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {statusContent.message}
        </p>

        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">Payment Details:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono">{paymentDetails.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>₹{paymentDetails.order_amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={paymentDetails.order_status === 'PAID' ? 'text-green-600' : 'text-red-600'}>
                  {paymentDetails.order_status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {paymentStatus === 'success' && (
            <button
              onClick={() => navigate(`/donation-receipt/${orderId}`)}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              View Donation Receipt
            </button>
          )}
          
          {(paymentStatus === 'failed' || paymentStatus === 'error') && (
            <button
              onClick={() => navigate('/payment')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Go to Home
          </button>
        </div>

        {orderId && (
          <p className="text-xs text-gray-500 mt-4">
            Reference: {orderId}
          </p>
        )}
      </div>
    </div>
  );
}
