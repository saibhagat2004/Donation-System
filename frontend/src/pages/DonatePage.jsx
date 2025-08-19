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
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Campaign not found');
      }

      const data = await response.json();
      setCampaign(data.campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign details');
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
      throw error;
    }
  };

  const verifyPayment = async (orderId) => {
    try {
      const response = await axios.post('/api/donations/verify-payment', {
        orderId: orderId
      }, {
        withCredentials: true
      });

      if (response.data) {
        const status = response.data.payment_status;
        
        if (status === "PAID") {
          toast.success("🎉 Donation successful! Thank you for your contribution.");
          // Redirect to success page or campaign details
          navigate(`/donation-success/${orderId}`);
        } else if (status === "PENDING") {
          toast.loading("Payment is being processed...");
        } else {
          toast.error("❌ Payment failed. Please try again.");
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
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
        
        // Verify payment after modal closes
        setTimeout(() => {
          verifyPayment(orderId);
        }, 2000);
      }).catch((error) => {
        console.error("Checkout error:", error);
        toast.error("Payment checkout failed");
      });

    } catch (error) {
      console.error('Donation process error:', error);
      toast.error(error.response?.data?.message || 'Failed to process donation');
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
                src={`http://localhost:5000/${campaign.logo}`} 
                alt={campaign.title}
                className="w-full h-full object-cover"
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
                <p className="text-2xl font-bold text-orange-600">{daysLeft}</p>
                <p className="text-sm text-gray-500">Days Left</p>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Donation Details</h2>
          
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
              disabled={isProcessing || !donationData.amount}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
                isProcessing || !donationData.amount
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
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
    </div>
  );
}