import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function DonationSuccessPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [donation, setDonation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchDonationDetails();
    }
  }, [orderId]);

  const fetchDonationDetails = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/donations/details/${orderId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setDonation(response.data.donation);
      }
    } catch (error) {
      console.error('Error fetching donation details:', error);
      toast.error('Failed to load donation details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const downloadReceipt = () => {
    if (donation?.receipt_number) {
      // Implement receipt download functionality
      toast.success('Receipt download feature coming soon!');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading donation details...</span>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Donation Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the donation details you're looking for.</p>
          <button
            onClick={() => navigate('/explore')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Explore Campaigns
          </button>
        </div>
      </div>
    );
  }

  const isSuccessful = donation.status === 'PAID';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        {/* Header */}
        <div className={`text-center py-8 ${isSuccessful ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
            isSuccessful ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isSuccessful ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h1 className={`text-3xl font-bold mb-2 ${isSuccessful ? 'text-green-800' : 'text-red-800'}`}>
            {isSuccessful ? 'Donation Successful!' : 'Donation Failed'}
          </h1>
          
          <p className={`text-lg ${isSuccessful ? 'text-green-600' : 'text-red-600'}`}>
            {isSuccessful 
              ? 'Thank you for your generous contribution!' 
              : 'Your donation could not be processed'
            }
          </p>
        </div>

        {/* Donation Details */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Amount and Campaign */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Donation Amount</h3>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(donation.amount)}</p>
                </div>
                {donation.receipt_number && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Receipt Number</p>
                    <p className="font-medium text-gray-900">{donation.receipt_number}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Campaign</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{donation.campaign.title}</p>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                        {donation.campaign.category}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/campaigns/${donation.campaign.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Campaign →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="border-b pb-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Transaction Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-medium text-gray-900">{donation.order_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    isSuccessful 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {donation.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(donation.paid_at || donation.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                {donation.fees && (
                  <div>
                    <p className="text-gray-500">Net Amount to NGO</p>
                    <p className="font-medium text-gray-900">{formatCurrency(donation.fees.net_amount)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Breakdown */}
            {donation.fees && isSuccessful && (
              <div className="border-b pb-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Fee Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Donation Amount:</span>
                    <span className="font-medium">{formatCurrency(donation.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="font-medium">-{formatCurrency(donation.fees.platform_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gateway Fee:</span>
                    <span className="font-medium">-{formatCurrency(donation.fees.gateway_fee)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Amount to NGO:</span>
                    <span className="text-green-600">{formatCurrency(donation.fees.net_amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Donor Information */}
            {donation.donor && (
              <div className="border-b pb-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Donor Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{donation.donor.name}</p>
                  {donation.donor.message && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Message:</p>
                      <p className="text-sm text-gray-700 italic">"{donation.donor.message}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {isSuccessful && donation.receipt_number && (
              <button
                onClick={downloadReceipt}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Receipt
              </button>
            )}
            
            <button
              onClick={() => navigate('/explore')}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Explore More Campaigns
            </button>
            
            <button
              onClick={() => navigate('/my-donations')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              View Donation History
            </button>
          </div>

          {/* Thank You Message */}
          {isSuccessful && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-800 font-medium">
                🎉 Your contribution makes a real difference! 
              </p>
              <p className="text-blue-600 text-sm mt-1">
                You'll receive an email confirmation shortly with your donation receipt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
