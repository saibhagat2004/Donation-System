import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Explore() {
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [watchlist, setWatchlist] = useState(new Set());
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    tags: "",
    sortBy: "newest",
    page: 1
  });
  const [searchInput, setSearchInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Helper function to safely parse tags
  const parseTags = (tags) => {
    if (!tags || typeof tags !== 'string' || !tags.trim()) {
      return [];
    }
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

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

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "goal_high", label: "Highest Goal" },
    { value: "goal_low", label: "Lowest Goal" },
    { value: "progress_high", label: "Most Progress" },
    { value: "progress_low", label: "Least Progress" },
    { value: "ending_soon", label: "Ending Soon" }
  ];

  // Fetch campaigns on component mount and when filters change
  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  // Debounced search effect
  useEffect(() => {
    if (searchInput === "") {
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
        page: 1
      }));
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Debounced tags effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        tags: tagsInput,
        page: 1
      }));
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [tagsInput]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters for all active campaigns (not filtering by user)
      const queryParams = new URLSearchParams({
        status: "active", // Only show active campaigns for donation
        page: filters.page,
        limit: 9
      });
      
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.tags) queryParams.append("tags", filters.tags);
      if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);

      const response = await fetch(`/api/campaigns?${queryParams}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setPagination(data.pagination || {});

    } catch (err) {
      console.error("Fetch campaigns error:", err);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === "search") {
      setSearchInput(value);
    } else if (key === "tags") {
      setTagsInput(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: 1
      }));
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = { category: "", search: "", tags: "", sortBy: "newest", page: 1 };
    setFilters(clearedFilters);
    setSearchInput("");
    setTagsInput("");
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleDonate = (campaignId) => {
    navigate(`/donate/${campaignId}`);
  };

  const handleViewDetails = (campaignId) => {
    navigate(`/campaign/${campaignId}`);
  };

  const handleWatchlistToggle = (campaignId) => {
    // TODO: Implement backend API call to add/remove from watchlist
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(campaignId)) {
      newWatchlist.delete(campaignId);
      toast.success("Removed from watchlist");
    } else {
      newWatchlist.add(campaignId);
      toast.success("Added to watchlist");
    }
    setWatchlist(newWatchlist);
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

  const getDaysLeft = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 7) return "text-red-600";
    if (daysLeft <= 30) return "text-orange-600";
    return "text-green-600";
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Campaigns</h1>
        <p className="text-gray-600 text-lg">Discover meaningful causes and make a difference today</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Campaigns</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchInput}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 pl-10 focus:outline-none focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
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

          {/* Tags Filter */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              type="text"
              placeholder="education, health, rural..."
              value={tagsInput}
              onChange={(e) => handleFilterChange("tags", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div> */}

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.category || filters.search || filters.tags || filters.sortBy !== "newest") && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.category && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Category: {filters.category}
              </span>
            )}
            {filters.search && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Search: "{filters.search}"
              </span>
            )}
            {filters.tags && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Tags: {filters.tags}
              </span>
            )}
            {filters.sortBy !== "newest" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Sort: {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          {pagination.total_campaigns ? `Showing ${campaigns.length} of ${pagination.total_campaigns} campaigns` : "No campaigns found"}
        </p>
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
            Try adjusting your filters to discover more campaigns.
          </p>
          <button
            onClick={handleClearFilters}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Campaign Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {campaigns.map((campaign) => {
              const daysLeft = getDaysLeft(campaign.end_date);
              const progressPercentage = campaign.progress_percentage || 0;
              
              return (
                <div key={campaign._id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Campaign Image */}
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                    {campaign.logo ? (
                      <img 
                        src={`http://localhost:5000/${campaign.logo}`} 
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white text-2xl font-bold">
                        {campaign.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Watchlist Button */}
                    <button
                      onClick={() => handleWatchlistToggle(campaign._id)}
                      className={`absolute top-4 right-4 p-2 rounded-full transition-all ${
                        watchlist.has(campaign._id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={watchlist.has(campaign._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Urgency Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white ${getUrgencyColor(daysLeft)}`}>
                        {daysLeft === 0 ? 'Last day!' : `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {campaign.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {campaign.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[4.5rem]">
                      {campaign.description}
                    </p>

                    {/* Progress Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-500">{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {/* Campaign Stats */}
                    <div className="space-y-2 mb-4">
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

                      {campaign.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {campaign.location}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {parseTags(campaign.tags).length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {parseTags(campaign.tags).slice(0, 3).map((tag, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                          {parseTags(campaign.tags).length > 3 && (
                            <span className="text-xs text-gray-400">+{parseTags(campaign.tags).length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDonate(campaign._id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Donate
                      </button>
                      <button 
                        onClick={() => handleViewDetails(campaign._id)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
              
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium ${
                        pageNum === pagination.current_page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
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


