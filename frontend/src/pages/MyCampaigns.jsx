import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Campaigns() {
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    category: "",
    status: "active",
    search: "",
    page: 1
  });
  const [searchInput, setSearchInput] = useState(""); // Separate state for search input

  const categories = [
    "Education",
    "Healthcare", 
    "Disaster Relief",
    "Child Welfare",
    "Women Empowerment",
    "Environment",
    "Animal Welfare",
    "Poverty Alleviation",
    "Elderly Care",
    "Other"
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "paused", label: "Paused" },
    { value: "all", label: "All Campaigns" }
  ];

  // Fetch campaigns on component mount and when filters change
  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  // Debounced search effect - updates filters.search after user stops typing
  useEffect(() => {
    if (searchInput === "") {
      // If search is cleared, update immediately
      setFilters(prev => ({
        ...prev,
        search: "",
        page: 1
      }));
      return;
    }

    const debounceTimer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput,
        page: 1 // Reset to first page when search changes
      }));
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      
      // Get current user ID for filtering
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include"
      });
      
      if (!userResponse.ok) {
        toast.error("Please login to view campaigns");
        navigate("/login");
        return;
      }
      
      const userData = await userResponse.json();
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        created_by: userData._id, // Filter by current user's campaigns
        page: filters.page,
        limit: 6
      });
      
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.search) queryParams.append("search", filters.search);

      const response = await fetch(`/api/campaigns?${queryParams}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }

      const data = await response.json();
      setCampaigns(data.campaigns);
      setPagination(data.pagination);

    } catch (err) {
      console.error("Fetch campaigns error:", err);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === "search") {
      setSearchInput(value); // Update search input state immediately for UI responsiveness
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: 1 // Reset to first page when filters change
      }));
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = { category: "", status: "active", search: "", page: 1 };
    setFilters(clearedFilters);
    setSearchInput(""); // Also clear the search input
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      paused: "bg-yellow-100 text-yellow-800",
      ended: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading campaigns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Campaigns</h1>
          <p className="text-gray-600">Manage and track your campaign performance</p>
        </div>
        <button
          onClick={() => navigate("/create-campaign")}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchInput}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500 mb-6">
            {searchInput || filters.category || (filters.status !== "active") 
              ? "Try adjusting your filters to see more campaigns." 
              : "You haven't created any campaigns yet."}
          </p>
          <button
            onClick={() => navigate("/create-campaign")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create Your First Campaign
          </button>
        </div>
      ) : (
        <>
          {/* Campaign Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                {/* Campaign Image */}
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl relative overflow-hidden">
                  {campaign.logo ? (
                    <img 
                      src={campaign.logo} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                      {campaign.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(campaign.campaign_status)}
                  </div>
                </div>

                {/* Campaign Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {campaign.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">{campaign.progress_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(campaign.progress_percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Raised</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(campaign.current_amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Goal</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(campaign.goal_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {campaign.category}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {campaign.total_donors || 0} donors
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ends {formatDate(campaign.end_date)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate(`/campaign/${campaign._id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    <button 
                      // onClick={() => navigate(`/campaign/${campaign._id}/edit`)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className={`px-4 py-2 rounded-lg font-medium ${
                  pagination.current_page <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition`}
              >
                Previous
              </button>
              
              <span className="text-gray-600">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className={`px-4 py-2 rounded-lg font-medium ${
                  pagination.current_page >= pagination.total_pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
