import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DocumentUploadForm from '../../components/DocumentUploadForm';

export default function NGODashboard() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  useEffect(() => {
    if (authUser && authUser.role === 'ngo') {
      checkVerificationStatus();
      loadPendingTransactions();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadPendingTransactions();
      }, 30000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [authUser]);

  const checkVerificationStatus = async () => {
    try {
      setIsCheckingVerification(true);
      const response = await fetch("/api/ngo/verification-status", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setVerificationStatus(result.verification);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const loadPendingTransactions = async () => {
    try {
      if (!authUser) return;
      
      const response = await fetch(`/api/bank/pending-transactions/${authUser._id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setPendingTransactions(result.data || []);
      } else {
        console.error('Failed to load pending transactions');
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    loadPendingTransactions();
    toast.success('Refreshed pending transactions');
  };

  if (authUser?.role !== 'ngo') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This dashboard is only available for NGO accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {authUser?.fullName || 'NGO User'}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Verification Status Banner */}
      {!isCheckingVerification && verificationStatus && (
        <>
          {/* NGO has submitted form - show verification status */}
          {verificationStatus.has_ngo_details ? (
            <div className={`mb-6 p-6 rounded-xl border-2 ${
              verificationStatus.is_verified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  verificationStatus.is_verified 
                    ? 'bg-green-100' 
                    : 'bg-yellow-100'
                }`}>
                  {verificationStatus.is_verified ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    verificationStatus.is_verified ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {verificationStatus.is_verified 
                      ? '✓ Your NGO is Verified!' 
                      : '⏳ Verification Status: Under Admin Review'}
                  </h3>
                  <p className={`mt-1 ${
                    verificationStatus.is_verified ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {verificationStatus.is_verified 
                      ? 'You can now create campaigns and receive donations.' 
                      : 'Your verification request has been submitted and is being reviewed by our admin team.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* NGO has NOT submitted form yet - show action required */
            <div className="mb-6 p-6 rounded-xl border-2 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800">
                    📝 Action Required: Complete Your NGO Profile
                  </h3>
                  <p className="mt-1 text-blue-700">
                    To create campaigns and receive donations, you need to submit your NGO beneficiary details for verification.
                  </p>
                  {verificationStatus.missing_ngo_details && verificationStatus.missing_ngo_details.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-blue-800 mb-2">Required Information:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        {verificationStatus.missing_ngo_details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link 
                    to="/add-ngo-beneficiary" 
                    className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Submit NGO Details Now →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/my-campaigns" className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">My Campaigns</h3>
              <p className="text-gray-600">Manage your active campaigns</p>
            </div>
          </div>
        </Link>

        <Link to="/create-campaign" className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Campaign</h3>
              <p className="text-gray-600">Start a new fundraising campaign</p>
            </div>
          </div>
        </Link>

        <Link to="/blockchain" className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Transparency</h3>
              <p className="text-gray-600">View blockchain records</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Pending Transactions Alert */}
      {pendingTransactions.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-orange-800">
                🚨 Action Required: {pendingTransactions.length} Pending Transaction{pendingTransactions.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                You have bank withdrawals that require document uploads. Please provide supporting documents within the time limit to ensure blockchain recording.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Transactions Section */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">🏦 Pending Bank Withdrawals</h2>
              <p className="text-gray-600 mt-1">
                Withdrawals requiring document uploads for blockchain transparency
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Auto-refreshes every 30s
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading pending transactions...</span>
            </div>
          ) : pendingTransactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-600">No pending transactions requiring attention.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransactions.map((transaction) => (
                <PendingTransactionCard 
                  key={transaction._id} 
                  transaction={transaction} 
                  onTransactionUpdate={loadPendingTransactions}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for individual pending transaction cards
function PendingTransactionCard({ transaction, onTransactionUpdate }) {
  const [timeRemaining, setTimeRemaining] = useState(transaction.time_remaining || 0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Update countdown timer
  useEffect(() => {
    if (timeRemaining > 0 && transaction.status === 'PENDING') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeRemaining, transaction.status]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (transaction.status === 'EXPIRED') return 'red';
    if (transaction.status === 'DOCUMENT_UPLOADED') return 'green';
    if (timeRemaining <= 60) return 'red'; // Last minute
    if (timeRemaining <= 300) return 'orange'; // Last 5 minutes
    return 'blue';
  };

  const getStatusText = () => {
    if (transaction.status === 'EXPIRED') return 'EXPIRED';
    if (transaction.status === 'DOCUMENT_UPLOADED') return 'DOCUMENT UPLOADED';
    if (timeRemaining <= 0) return 'TIME UP';
    return `${formatTime(timeRemaining)} REMAINING`;
  };

  const handleUploadDocument = async (documentData) => {
    try {
      setIsUploading(true);
      
      let response, result;
      
      // Check if this is a file upload or URL upload
      if (documentData._uploadMethod === 'file' && documentData._file) {
        // File upload - use multipart backend endpoint
        const formData = new FormData();
        formData.append('document', documentData._file);
        if (documentData.ngo_notes) {
          formData.append('ngo_notes', documentData.ngo_notes);
        }
        
        response = await fetch(`/api/bank/upload-document-file/${transaction.transaction_id}`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      } else {
        // URL upload - use existing JSON endpoint
        response = await fetch(`/api/bank/upload-document/${transaction.transaction_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            document_url: documentData.document_url,
            document_hash: documentData.document_hash,
            ngo_notes: documentData.ngo_notes
          })
        });
      }

      result = await response.json();
      
      if (result.success) {
        toast.success('Document uploaded successfully!');
        setShowUploadForm(false);
        if (onTransactionUpdate) onTransactionUpdate();
      } else {
        toast.error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Network error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const statusColor = getStatusColor();
  const canUpload = transaction.status === 'PENDING' && timeRemaining > 0;

  return (
    <div className={`border-l-4 p-4 rounded-r-lg transition-all ${
      statusColor === 'red' ? 'border-red-500 bg-red-50' :
      statusColor === 'orange' ? 'border-orange-500 bg-orange-50' :
      statusColor === 'green' ? 'border-green-500 bg-green-50' :
      'border-blue-500 bg-blue-50'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ₹{transaction.amount.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">
                {transaction.cause || 'Bank Withdrawal'}
              </p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColor === 'red' ? 'bg-red-100 text-red-800' :
                statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                statusColor === 'green' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {getStatusText()}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">Transaction ID:</span>
              <div className="font-mono">{transaction.transaction_id}</div>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <div>{transaction.withdrawal_type.replace('_', ' ')}</div>
            </div>
            <div>
              <span className="font-medium">Account:</span>
              <div>{transaction.ngo_account_number}</div>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <div>{new Date(transaction.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {transaction.description && (
            <p className="text-sm text-gray-700 mb-4">
              <span className="font-medium">Description:</span> {transaction.description}
            </p>
          )}

          {/* Document Status */}
          {transaction.status === 'DOCUMENT_UPLOADED' ? (
            <div className="bg-green-100 p-3 rounded-lg mb-4">
              <div className="flex items-center text-green-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Document Uploaded Successfully</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Document: <a href={transaction.document_url} target="_blank" rel="noopener noreferrer" className="underline">View Document</a>
              </p>
              {transaction.ngo_notes && (
                <p className="text-green-700 text-sm mt-1">
                  Notes: {transaction.ngo_notes}
                </p>
              )}
            </div>
          ) : canUpload ? (
            <div>
              {!showUploadForm ? (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Supporting Document
                </button>
              ) : (
                <DocumentUploadForm 
                  onUpload={handleUploadDocument}
                  onCancel={() => setShowUploadForm(false)}
                  isUploading={isUploading}
                />
              )}
            </div>
          ) : (
            <div className="bg-red-100 p-3 rounded-lg">
              <div className="flex items-center text-red-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {transaction.status === 'EXPIRED' ? 'Document Upload Deadline Expired' : 'Upload Window Closed'}
                </span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                This transaction will be recorded on blockchain without supporting documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}