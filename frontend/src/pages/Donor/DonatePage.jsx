import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { load } from '@cashfreepayments/cashfree-js';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function DonatePage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [cashfree, setCashfree] = useState(null);
  
  // Donation form state
  const [donationData, setDonationData] = useState({
    amount: '',
    anonymous: false,
    showAmount: true,
    donorMessage: '',
    donorName: '',
    donorEmail: '',
    donorPhone: ''
  });

  // Predefined amounts
  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  // Initialize Cashfree SDK
  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const cf = await load({
          mode: "sandbox" // Change to "production" for live
        });
        setCashfree(cf);
      } catch (error) {
        console.error('Failed to initialize Cashfree:', error);
        toast.error('Payment system initialization failed');
      }
    };

    initializeCashfree();
  }, []);

  // Fetch campaign details
  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching campaign with ID:', campaignId);
      
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        credentials: 'include'
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Campaign not found (${response.status})`);
      }

      const data = await response.json();
      console.log('Campaign data received:', data);
      
      // Handle both response formats - backend now returns campaign directly
      const campaignData = data.campaign || data;
      
      if (!campaignData || !campaignData._id) {
        console.error('No valid campaign data found in response:', data);
        throw new Error('Campaign data not found in response');
      }
      
      setCampaign(campaignData);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error(`Failed to load campaign: ${error.message}`);
      navigate('/explore');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setDonationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickAmount = (amount) => {
    setDonationData(prev => ({
      ...prev,
      amount: amount.toString()
    }));
  };

  const validateForm = () => {
    if (!donationData.amount || parseFloat(donationData.amount) < 1) {
      toast.error('Please enter a valid donation amount (minimum ₹1)');
      return false;
    }

    if (!donationData.donorName.trim()) {
      toast.error('Please enter your name');
      return false;
    }

    if (!donationData.donorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.donorEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!donationData.donorPhone.trim() || !/^[0-9]{10}$/.test(donationData.donorPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  };

  const createDonationOrder = async () => {
    try {
      const response = await axios.post('/api/donations/create-order', {
        campaignId: campaignId,
        amount: parseFloat(donationData.amount),
        donorInfo: {
          name: donationData.donorName,
          email: donationData.donorEmail,
          phone: donationData.donorPhone
        },
        preferences: {
          anonymous: donationData.anonymous,
          showAmount: donationData.showAmount,
          donorMessage: donationData.donorMessage
        }
      }, {
        withCredentials: true
      });

      if (response.data && response.data.payment_session_id) {
        return {
          sessionId: response.data.payment_session_id,
          orderId: response.data.order_id
        };
      }
      
      throw new Error('Failed to create payment order');
    } catch (error) {
      console.error('Create order error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error;
        if (errorMessage?.includes('ended') || errorMessage?.includes('expired')) {
          throw new Error('🕐 This campaign has ended. Donations are no longer accepted.');
        } else if (errorMessage?.includes('beneficiary')) {
          throw new Error('⚠️ Campaign setup incomplete. Please contact the organizer.');
        } else if (errorMessage?.includes('minimum')) {
          throw new Error('💰 Minimum donation amount is ₹1.');
        } else {
          throw new Error(errorMessage || 'Unable to process donation. Please check campaign details.');
        }
      } else if (error.response?.status === 404) {
        throw new Error('❌ Campaign not found. It may have been removed.');
      } else {
        throw new Error(error.response?.data?.error || 'Failed to create payment order');
      }
    }
  };

  const verifyPayment = async (orderId) => {
    try {
      const response = await axios.post('/api/donations/verify-payment', {
        orderId: orderId
      }, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        const status = response.data.payment_status;
        
        if (status === "PAID") {
          setVerificationStatus('success');
          toast.success("🎉 Donation successful! Thank you for your contribution.");
          
          // Navigate to receipt page
          setTimeout(() => {
            navigate(`/donation-receipt/${orderId}`);
          }, 1500);
        } else if (status === "PENDING") {
          // Keep the loading animation for pending payments
          toast.loading("Payment is being processed...");
          // Check again after a delay
          setTimeout(() => verifyPayment(orderId), 3000);
        } else {
          // Payment failed - hide success animation
          setVerificationStatus('failed');
          setIsPaymentSuccess(false);
          toast.error("❌ Payment failed. Please try again.");
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
      setIsPaymentSuccess(false);
      toast.error("Error verifying payment. Please contact support if amount was deducted.");
    }
  };

  const handleDonate = async () => {
    if (!validateForm()) return;
    if (!cashfree) {
      toast.error('Payment system not ready. Please refresh and try again.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create donation order
      const { sessionId, orderId } = await createDonationOrder();
      
      // Configure checkout options
      const checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: "_modal"
      };

      // Launch Cashfree checkout
      cashfree.checkout(checkoutOptions).then((result) => {
        console.log("Payment modal closed:", result);
        
        // Show success animation immediately when modal closes
        setIsPaymentSuccess(true);
        
        // Verify payment after modal closes
        setTimeout(() => {
          verifyPayment(orderId);
        }, 2000);
      }).catch((error) => {
        console.error("Checkout error:", error);
        toast.error("Payment checkout failed");
        setIsPaymentSuccess(false);
      });

    } catch (error) {
      console.error('Donation process error:', error);
      
      // Show specific error message
      const errorMessage = error.message || error.response?.data?.error || 'Failed to process donation';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysLeft = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading campaign details...</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/explore')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Explore Other Campaigns
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = campaign.progress_percentage || 0;
  const daysLeft = getDaysLeft(campaign.end_date);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Success Loading Overlay */}
      {isPaymentSuccess && (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-green-400 rounded-full animate-bounce opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-md w-full text-center shadow-2xl transform animate-scale-in">
            {/* Success Animation */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center animate-enhanced-bounce shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Multiple ripple effects */}
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-green-300 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-green-400 rounded-full animate-ping opacity-20" style={{animationDelay: '0.5s'}}></div>
            </div>
            
            {/* Success Message */}
            {verificationStatus === 'verifying' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🔄 Processing Payment...</h2>
                <p className="text-gray-600 mb-6">Please wait while we verify your payment</p>
              </>
            )}
            {verificationStatus === 'success' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Payment Successful!</h2>
                <p className="text-gray-600 mb-6">Thank you for your generous donation</p>
              </>
            )}
            {verificationStatus === 'failed' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">❌ Payment Failed</h2>
                <p className="text-gray-600 mb-6">Please try again or contact support</p>
              </>
            )}
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%', animation: 'progress 2.5s ease-in-out'}}></div>
            </div>
            
            {/* Loading Dots */}
            <div className="flex justify-center space-x-1 mb-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            
            <p className="text-sm text-gray-500">
              {verificationStatus === 'verifying' && 'Verifying your payment...'}
              {verificationStatus === 'success' && 'Redirecting to receipt...'}
              {verificationStatus === 'failed' && 'Payment verification failed'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content with conditional blur */}
      <div className={isPaymentSuccess ? 'blur-sm pointer-events-none' : ''}>
        {/* Header */}
        <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Campaign
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Make a Donation</h1>
        <p className="text-gray-600 mt-2">Your contribution can make a real difference</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Summary</h2>
          
          {/* Campaign Image */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 overflow-hidden">
            {campaign.logo ? (
              <img 
                src={campaign.logo} 
                alt={campaign.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-3xl font-bold">
                {campaign.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium mb-2">
                {campaign.category}
              </span>
              <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
              <p className="text-gray-600 text-sm mt-2 line-clamp-3">{campaign.description}</p>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Raised</p>
                  <p className="font-semibold text-green-600 text-lg">
                    {formatCurrency(campaign.current_amount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Goal</p>
                  <p className="font-semibold text-gray-900 text-lg">
                    {formatCurrency(campaign.goal_amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{campaign.total_donors || 0}</p>
                <p className="text-sm text-gray-500">Donors</p>
              </div>
              <div className="text-center">
                {daysLeft > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-orange-600">{daysLeft}</p>
                    <p className="text-sm text-gray-500">Days Left</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-red-600">Ended</p>
                    <p className="text-sm text-gray-500">Campaign Closed</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Donation Details</h2>
          
          {/* Campaign Ended Warning */}
          {daysLeft <= 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Campaign Has Ended</h3>
                  <p className="text-sm text-red-700 mt-1">
                    This campaign ended on {new Date(campaign.end_date).toLocaleDateString('en-IN')}. 
                    Donations are no longer being accepted.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Donation Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Donation Amount (INR) *
              </label>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      donationData.amount === amount.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))}
              </div>
              
              {/* Custom Amount Input */}
              <input
                type="number"
                placeholder="Enter custom amount"
                value={donationData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-lg"
                min="1"
              />
            </div>

            {/* Donor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Your Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={donationData.donorName}
                  onChange={(e) => handleInputChange('donorName', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={donationData.donorEmail}
                  onChange={(e) => handleInputChange('donorEmail', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={donationData.donorPhone}
                  onChange={(e) => handleInputChange('donorPhone', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Enter 10-digit phone number"
                  maxLength="10"
                />
              </div>
            </div>

            {/* Optional Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={donationData.donorMessage}
                onChange={(e) => handleInputChange('donorMessage', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                rows="3"
                placeholder="Leave a message of support..."
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {donationData.donorMessage.length}/500 characters
              </p>
            </div>

            {/* Privacy Options */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Privacy Preferences</h3>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={donationData.anonymous}
                  onChange={(e) => handleInputChange('anonymous', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make this donation anonymous
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={donationData.showAmount}
                  onChange={(e) => handleInputChange('showAmount', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show donation amount publicly
                </span>
              </label>
            </div>

            {/* Donation Summary */}
            {donationData.amount && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Donation Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Donation Amount:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(donationData.amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Gateway Fee:</span>
                    <span className="font-medium">Included</span>
                  </div>
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">{formatCurrency(parseFloat(donationData.amount) || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Donate Button */}
            <button
              onClick={handleDonate}
              disabled={isProcessing || !donationData.amount || daysLeft <= 0}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
                isProcessing || !donationData.amount || daysLeft <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {daysLeft <= 0 ? (
                'Campaign Has Ended'
              ) : isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Donate ${donationData.amount ? formatCurrency(parseFloat(donationData.amount)) : '₹0'}`
              )}
            </button>

            {/* Security Notice */}
            <div className="text-xs text-gray-500 text-center">
              <p>🔒 Secure payment powered by Cashfree</p>
              <p>Your payment information is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>
      </div> {/* Close blur wrapper */}
    </div>
  );
}