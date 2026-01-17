import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import BlockchainService from '../services/BlockchainService';

// Utility function to copy to clipboard with toast feedback
const copyToClipboard = async (text, label = 'Text') => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  } catch (error) {
    toast.error('Failed to copy to clipboard');
  }
};

export default function BlockchainWidget({ ngoId = null, showAllTransactions = false }) {
  const [blockchainData, setBlockchainData] = useState({
    connected: false,
    totalDonations: 0,
    recentTransactions: [],
    ngoBalance: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('BlockchainWidget - ngoId:', ngoId, 'showAllTransactions:', showAllTransactions);

  useEffect(() => {
    initializeBlockchainWidget();
  }, [ngoId]);

  const initializeBlockchainWidget = async () => {
    try {
      setIsLoading(true);
      const initialized = await BlockchainService.initialize();
      
      if (initialized) {
        const connectionStatus = await BlockchainService.getConnectionStatus();
        let recentTx = [];
        let ngoBalance = null;

        if (ngoId) {
          // Get specific NGO data
          console.log('BlockchainWidget: Fetching data for NGO:', ngoId);
          
          try {
            const [ngoSummary, ngoTransactions] = await Promise.all([
              BlockchainService.getNgoData(ngoId),
              BlockchainService.getNgoTransactions(ngoId, 5) // Last 5 transactions
            ]);
            
            console.log('BlockchainWidget: NGO Summary:', ngoSummary);
            console.log('BlockchainWidget: NGO Transactions:', ngoTransactions);
            
            if (ngoSummary && (ngoSummary.hasTransactions || ngoTransactions.length > 0)) {
              ngoBalance = ngoSummary.balance;
              recentTx = ngoTransactions;
              console.log('BlockchainWidget: NGO data found, balance:', ngoBalance, 'transactions:', recentTx.length);
            } else {
              console.log('BlockchainWidget: NGO not found on blockchain or no transactions yet');
              ngoBalance = null;
              recentTx = [];
            }
          } catch (error) {
            console.error('BlockchainWidget: Error fetching NGO data:', error);
            ngoBalance = null;
            recentTx = [];
          }
        } else if (showAllTransactions) {
          // Get all recent transactions
          recentTx = await BlockchainService.getAllTransactions(5);
        }

        setBlockchainData({
          connected: connectionStatus.connected,
          totalDonations: connectionStatus.totalDonations || 0,
          recentTransactions: recentTx,
          ngoBalance
        });
      }
    } catch (error) {
      console.error('Blockchain widget initialization error:', error);
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Connecting to blockchain...</span>
        </div>
      </div>
    );
  }

  if (!blockchainData.connected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">Blockchain Offline</p>
            <p className="text-xs text-yellow-600">Transaction transparency temporarily unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <h3 className="text-sm font-semibold text-gray-800">Bank Account Transparency</h3>
        </div>
        <Link 
          to="/blockchain"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {ngoId && blockchainData.ngoBalance !== null ? (
          <>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-600">Bank Balance</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(blockchainData.ngoBalance)}</p>
            </div>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-600">Bank Transactions</p>
              <p className="text-sm font-bold text-blue-600">{blockchainData.recentTransactions.length}</p>
            </div>
          </>
        ) : ngoId && blockchainData.ngoBalance === null ? (
          <>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-600">NGO Status</p>
              <p className="text-sm font-bold text-yellow-600">Not Found</p>
            </div>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-600">Transactions</p>
              <p className="text-sm font-bold text-gray-400">0</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-600">Total Platform</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(blockchainData.totalDonations)}</p>
            </div>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-600">Recent Activity</p>
              <p className="text-sm font-bold text-blue-600">{blockchainData.recentTransactions.length}</p>
            </div>
          </>
        )}
      </div>

      {/* Recent Transactions */}
      {blockchainData.recentTransactions.length > 0 ? (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">
            {ngoId ? 'Recent Bank Activity' : 'Recent Transactions'}
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {blockchainData.recentTransactions.map((tx, index) => (
              <div key={`${tx.type}-${tx.id}`} className="bg-white rounded-md p-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      tx.type === 'incoming' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium">{formatCurrency(tx.amount)}</span>
                    {tx.type === 'outgoing' && tx.hasDocument && (
                      <svg className="w-3 h-3 ml-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Has receipt">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-500">{formatDate(tx.date)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-gray-600 truncate flex-1">{tx.cause}</div>
                  {tx.type === 'outgoing' && tx.hasDocument && tx.documentUrl && (
                    <a
                      href={tx.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 ml-2 flex-shrink-0"
                      title="View receipt"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                {/* Verification Hash - Commented out for better UX */}
                {/* {tx.type === 'outgoing' && tx.verificationHash && tx.verificationHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                  <div className="mt-1 pt-1 border-t border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-500 text-xs mr-1">Hash:</span>
                      <code className="text-xs bg-gray-100 px-1 rounded font-mono">
                        {tx.verificationHash.slice(0, 8)}...{tx.verificationHash.slice(-6)}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(tx.verificationHash)}
                        className="text-gray-400 hover:text-gray-600 ml-1"
                        title="Copy verification hash"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )} */}
              </div>
            ))}
          </div>
        </div>
      ) : ngoId && blockchainData.ngoBalance === null ? (
        <div className="bg-yellow-50 rounded-md p-2 text-xs">
          <p className="text-yellow-800 font-medium">No Bank Activity Found</p>
          <p className="text-yellow-600 text-xs">This NGO hasn't recorded any bank transactions on blockchain yet.</p>
        </div>
      ) : null}

      {/* Call to Action */}
      {ngoId && (
        <div className="mt-3 pt-3 border-t border-blue-100">
          <Link 
            to={`/blockchain/ngo/${encodeURIComponent(ngoId)}`}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Complete Bank Account History
          </Link>
        </div>
      )}
      
      {/* Clarification note */}
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <strong>Note:</strong> This shows NGO bank account activity, separate from individual campaign donation tracking.
      </div>
    </div>
  );
}