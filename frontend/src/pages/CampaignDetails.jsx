import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function to safely parse tags
  const parseTags = (tags) => {
    if (!tags || typeof tags !== 'string' || !tags.trim()) {
      return [];
    }
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/campaigns/${id}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch campaign details");
      }

      const data = await response.json();
      setCampaign(data);
    } catch (err) {
      console.error("Fetch campaign details error:", err);
      toast.error("Failed to load campaign details");
      navigate("/explore");
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
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

  const handleDonate = () => {
    navigate(`/donate/${id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading campaign details...</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h2>
          <button
            onClick={() => navigate("/explore")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = campaign.progress_percentage || 0;
  const daysLeft = getDaysLeft(campaign.end_date);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Campaign Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium mb-2">
                  {campaign.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
                <div className="flex items-center text-gray-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {campaign.location || "Location not specified"}
                </div>
              </div>
            </div>

            {/* Campaign Image */}
            {campaign.logo && (
              <div className="mb-6">
                <img 
                  src={`http://localhost:5000/${campaign.logo}`} 
                  alt={campaign.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "updates", label: "Updates" },
                  { id: "donors", label: "Donors" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this campaign</h3>
                  <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
                </div>

                {campaign.beneficiary_details && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Beneficiary Information</h3>
                    <p className="text-gray-700 leading-relaxed">{campaign.beneficiary_details}</p>
                  </div>
                )}

                {campaign.activity_photos && campaign.activity_photos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Photos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaign.activity_photos.map((photo, index) => (
                        <img
                          key={index}
                          src={`http://localhost:5000/${photo}`}
                          alt={`Activity ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Contact Person:</span> {campaign.contact_person}</p>
                    <p><span className="font-medium">Email:</span> {campaign.contact_email}</p>
                    <p><span className="font-medium">Phone:</span> {campaign.contact_phone}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "updates" && (
              <div className="text-center py-8">
                <p className="text-gray-500">No updates available yet.</p>
              </div>
            )}

            {activeTab === "donors" && (
              <div className="text-center py-8">
                <p className="text-gray-500">Donor information will be displayed here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Donation Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(campaign.current_amount || 0)}
              </div>
              <div className="text-gray-600 text-sm">
                raised of {formatCurrency(campaign.goal_amount)} goal
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{progressPercentage}% funded</span>
                <span>{campaign.total_donors || 0} donors</span>
              </div>
            </div>

            {/* Time Left */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {daysLeft}
              </div>
              <div className="text-gray-600 text-sm">
                {daysLeft === 1 ? "day left" : "days left"}
              </div>
            </div>

            {/* Donate Button */}
            <button
              onClick={handleDonate}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Donate Now
            </button>

            {/* Share Button */}
            <button className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition">
              Share Campaign
            </button>
          </div>

          {/* Campaign Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{formatDate(campaign.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">{formatDate(campaign.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{campaign.campaign_status}</span>
              </div>
              {parseTags(campaign.tags).length > 0 && (
                <div>
                  <span className="text-gray-600 block mb-2">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {parseTags(campaign.tags).map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}