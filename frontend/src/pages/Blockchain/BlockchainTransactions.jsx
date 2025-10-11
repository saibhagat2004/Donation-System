import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BlockchainService from '../../services/BlockchainService';

export default function BlockchainTransactions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [incomingTransactions, setIncomingTransactions] = useState([]);
  const [outgoingTransactions, setOutgoingTransactions] = useState([]);
  const [activeNgos, setActiveNgos] = useState([]);
  const [blockchainStatus, setBlockchainStatus] = useState({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNgo, setSelectedNgo] = useState('');

  useEffect(() => {
    initializeBlockchain();
  }, []);

  const initializeBlockchain = async () => {
    try {
      setIsLoading(true);
      const initialized = await BlockchainService.initialize();
      
      if (initialized) {
        await Promise.all([
          fetchBlockchainStatus(),
          fetchAllTransactions(),
          fetchActiveNgos()
        ]);
        toast.success('Connected to blockchain successfully!');
      } else {
        toast.error('Failed to connect to blockchain. Please check if Ganache is running.');
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      toast.error('Blockchain connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockchainStatus = async () => {
    try {
      const status = await BlockchainService.getConnectionStatus();
      setBlockchainStatus(status);
    } catch (error) {
      console.error('Error fetching blockchain status:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const [allTx, incoming, outgoing] = await Promise.all([
        BlockchainService.getAllTransactions(100),
        BlockchainService.getAllIncomingTransactions(50),
        BlockchainService.getAllOutgoingTransactions(50)
      ]);
      
      setTransactions(allTx);
      setIncomingTransactions(incoming);
      setOutgoingTransactions(outgoing);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    }
  };

  const fetchActiveNgos = async () => {
    try {
      const ngos = await BlockchainService.getActiveNgos();
      setActiveNgos(ngos);
    } catch (error) {
      console.error('Error fetching active NGOs:', error);
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
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type) => {
    return type === 'incoming' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getTransactionTypeIcon = (type) => {
    return type === 'incoming' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    );
  };

  const filteredTransactions = () => {
    let txs = transactions;
    
    if (activeTab === 'incoming') {
      txs = incomingTransactions;
    } else if (activeTab === 'outgoing') {
      txs = outgoingTransactions;
    }

    if (selectedNgo) {
      txs = txs.filter(tx => tx.ngoId === selectedNgo);
    }

    return txs;
  };

  const handleNgoSelect = (ngoId) => {
    setSelectedNgo(ngoId);
  };

  const clearNgoFilter = () => {
    setSelectedNgo('');
  };

  const viewNgoDetails = (ngoId) => {
    navigate(`/blockchain/ngo/${encodeURIComponent(ngoId)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Connecting to blockchain...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blockchain Transparency</h1>
            <p className="text-gray-600 mt-2">Complete transparent view of all NGO donations and spending across the platform</p>
          </div>
          
          {/* Blockchain Status */}
          <div className={`flex items-center px-4 py-2 rounded-lg ${
            blockchainStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              blockchainStatus.connected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {blockchainStatus.connected ? 'Connected to Blockchain' : 'Blockchain Disconnected'}
          </div>
        </div>

        {/* Stats Cards */}
        {blockchainStatus.connected && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(blockchainStatus.totalDonations || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Incoming</p>
                  <p className="text-2xl font-bold text-gray-900">{incomingTransactions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outgoing</p>
                  <p className="text-2xl font-bold text-gray-900">{outgoingTransactions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active NGOs</p>
                  <p className="text-2xl font-bold text-gray-900">{activeNgos.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Tabs */}
            <div className="flex space-x-1">
              {[
                { id: 'all', label: 'All Transactions', count: transactions.length },
                { id: 'incoming', label: 'Incoming', count: incomingTransactions.length },
                { id: 'outgoing', label: 'Outgoing', count: outgoingTransactions.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* NGO Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by NGO:</label>
              <select
                value={selectedNgo}
                onChange={(e) => handleNgoSelect(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All NGOs ({activeNgos.length} total)</option>
                {activeNgos.map((ngoId) => (
                  <option key={ngoId} value={ngoId}>{ngoId}</option>
                ))}
              </select>
              
              {selectedNgo && (
                <button
                  onClick={clearNgoFilter}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="Clear filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="overflow-hidden">
          {filteredTransactions().length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-lg">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NGO ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor/Receiver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cause
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions().map((transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {getTransactionTypeIcon(transaction.type)}
                            <span className="ml-1 capitalize">{transaction.type}</span>
                          </span>
                          <span className="ml-2 text-sm text-gray-500">#{transaction.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewNgoDetails(transaction.ngoId)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {transaction.ngoId}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.donorId || transaction.receiverId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.cause}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => viewNgoDetails(transaction.ngoId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View NGO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Active NGOs Section */}
      {activeNgos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active NGOs on Blockchain</h2>
            <p className="text-sm text-gray-600 mt-1">NGOs with recorded transactions</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeNgos.map((ngoId) => (
                <div
                  key={ngoId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
                  onClick={() => viewNgoDetails(ngoId)}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">{ngoId}</div>
                  <div className="text-xs text-blue-600 mt-1">View Details →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}