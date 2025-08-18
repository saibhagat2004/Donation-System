import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function CreateCampaign() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    goal_amount: "",
    current_amount: 0,
    category: "",
    start_date: "",
    end_date: "",
    location: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    beneficiary_details: "",
    campaign_status: "active",
    tags: "",
    // Image files
    logo: null,
    activity_photos: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

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

  // Check NGO verification status on component mount
  useEffect(() => {
    checkNGOVerification();
  }, []);

  const checkNGOVerification = async () => {
    try {
      setIsCheckingVerification(true);
      
      const response = await fetch("/api/ngo/verification-status", {
        method: "GET",
        credentials: "include", // This ensures cookies are sent
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please login to create campaigns");
          navigate("/login");
          return;
        } else if (response.status === 403) {
          toast.error("Only NGOs can create campaigns");
          navigate("/");
          return;
        } else {
          throw new Error("Failed to check verification status");
        }
      }

      const data = await response.json();
      const { verification } = data;
      
      console.log("Verification Response:", data);
      console.log("User can create campaigns:", verification.can_create_campaigns);
      
      setVerificationData(verification);

      // Show popup if NGO is not fully verified
      if (!verification.can_create_campaigns) {
        setShowVerificationPopup(true);
      }

    } catch (err) {
      console.error("Verification check error:", err);
      toast.error("Failed to check verification status");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleGoToNGOForm = () => {
    setShowVerificationPopup(false);
    navigate("/ngo-form");
  };

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    
    if (type === "file") {
      if (name === "activity_photos") {
        // Handle multiple files for activity photos
        setForm({
          ...form,
          [name]: Array.from(files)
        });
      } else {
        // Handle single file for logo
        setForm({
          ...form,
          [name]: files[0]
        });
      }
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }

    // Clear errors when user starts editing
    setErrors({
      ...errors,
      [name]: ""
    });
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = [
      "title", "description", "goal_amount", "category", 
      "start_date", "end_date", "contact_person", "contact_email", "contact_phone"
    ];
    
    requiredFields.forEach(field => {
      if (!form[field]) {
        newErrors[field] = "This field is required";
      }
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.contact_email && !emailRegex.test(form.contact_email)) {
      newErrors.contact_email = "Please enter a valid email address";
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (form.contact_phone && !phoneRegex.test(form.contact_phone)) {
      newErrors.contact_phone = "Please enter a valid 10-digit phone number";
    }

    // Validate goal amount
    if (form.goal_amount && (isNaN(form.goal_amount) || form.goal_amount <= 0)) {
      newErrors.goal_amount = "Please enter a valid amount greater than 0";
    }

    // Validate dates
    if (form.start_date && form.end_date && new Date(form.start_date) >= new Date(form.end_date)) {
      newErrors.end_date = "End date must be after start date";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(form).forEach(key => {
        if (key === "activity_photos") {
          // Append multiple activity photos
          form.activity_photos.forEach((file) => {
            formData.append("activity_photos", file);
          });
        } else if (key === "logo") {
          // Append logo file if it exists
          if (form[key]) {
            formData.append(key, form[key]);
          }
        } else {
          formData.append(key, form[key]);
        }
      });

      const res = await fetch("/api/campaigns/create", {
        method: "POST",
        credentials: "include", // Include cookies for authentication
        body: formData,
        // Don't set Content-Type header - let browser set it for multipart/form-data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      const data = await res.json();

      // Show success toast
      toast.success(`Campaign "${form.title}" created successfully! ID: ${data.campaign_id}`);
      
      // Reset form after successful submission
      setForm({
        title: "",
        description: "",
        goal_amount: "",
        current_amount: 0,
        category: "",
        start_date: "",
        end_date: "",
        location: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
        beneficiary_details: "",
        campaign_status: "active",
        tags: "",
        logo: null,
        activity_photos: []
      });

      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');

    } catch (err) {
      console.error(err);
      let errorMsg = err.message || "Failed to create campaign";
      // Show error toast
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verification Popup Component
  const VerificationPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            NGO Verification Required
          </h3>
          
          <div className="text-gray-600 mb-6">
            <p className="mb-3">
              You need to complete your NGO verification to create campaigns.
            </p>
            
            {verificationData?.missing_requirements && (
              <div className="text-left bg-red-50 p-4 rounded-lg">
                <p className="font-semibold text-red-800 mb-2">Missing Requirements:</p>
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {verificationData.missing_requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
                
                {verificationData.missing_ngo_details && (
                  <div className="mt-3">
                    <p className="font-semibold text-red-800 mb-1">Missing NGO Details:</p>
                    <ul className="list-disc list-inside text-red-700 text-sm">
                      {verificationData.missing_ngo_details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoToNGOForm}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Complete NGO Details
            </button>
            <button
              onClick={() => setShowVerificationPopup(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading spinner while checking verification
  if (isCheckingVerification) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Checking verification status...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Verification Popup */}
      {showVerificationPopup && <VerificationPopup />}
      
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl">{/* Prevent form interaction if not verified */}
        <div className={!verificationData?.can_create_campaigns ? "pointer-events-none opacity-50" : ""}>
          <h2 className="text-3xl font-bold mb-8 text-center text-blue-600">Create New Campaign</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Campaign Basic Info */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Campaign Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col md:col-span-2">
              <label className="font-medium text-gray-700 mb-1">
                Campaign Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                placeholder="Enter campaign title"
                value={form.title}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.title && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">e.g. "Help Build Schools in Rural Areas"</span>
              {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.category && "border-red-500"}`}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="text-red-500 text-sm mt-1">{errors.category}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                Goal Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                name="goal_amount"
                type="number"
                placeholder="100000"
                value={form.goal_amount}
                required
                min="1"
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.goal_amount && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">Target amount to raise</span>
              {errors.goal_amount && <span className="text-red-500 text-sm mt-1">{errors.goal_amount}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.start_date && "border-red-500"}`}
                onChange={handleChange}
              />
              {errors.start_date && <span className="text-red-500 text-sm mt-1">{errors.start_date}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.end_date && "border-red-500"}`}
                onChange={handleChange}
              />
              {errors.end_date && <span className="text-red-500 text-sm mt-1">{errors.end_date}</span>}
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Describe your campaign, its goals, and how donations will be used..."
                value={form.description}
                required
                rows="4"
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 resize-none ${errors.description && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">Provide detailed information about your campaign</span>
              {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">Location</label>
              <input
                name="location"
                placeholder="City, State"
                value={form.location}
                className="border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500"
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">Where will this campaign operate?</span>
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">Tags</label>
              <input
                name="tags"
                placeholder="education, children, rural (comma separated)"
                value={form.tags}
                className="border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500"
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">Comma separated tags for better discovery</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_person"
                placeholder="Full Name"
                value={form.contact_person}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.contact_person && "border-red-500"}`}
                onChange={handleChange}
              />
              {errors.contact_person && <span className="text-red-500 text-sm mt-1">{errors.contact_person}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_email"
                type="email"
                placeholder="contact@example.com"
                value={form.contact_email}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.contact_email && "border-red-500"}`}
                onChange={handleChange}
              />
              {errors.contact_email && <span className="text-red-500 text-sm mt-1">{errors.contact_email}</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="contact_phone"
                type="tel"
                placeholder="9876543210"
                value={form.contact_phone}
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 ${errors.contact_phone && "border-red-500"}`}
                onChange={handleChange}
              />
              {errors.contact_phone && <span className="text-red-500 text-sm mt-1">{errors.contact_phone}</span>}
            </div>
          </div>
        </div>

        {/* Beneficiary Details */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Beneficiary Information</h3>
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-1">Beneficiary Details</label>
            <textarea
              name="beneficiary_details"
              placeholder="Describe who will benefit from this campaign..."
              value={form.beneficiary_details}
              rows="3"
              className="border rounded-lg p-3 focus:outline-blue-500 focus:border-blue-500 resize-none"
              onChange={handleChange}
            />
            <span className="text-xs text-gray-500 mt-1">Information about who this campaign will help</span>
          </div>
        </div>

        {/* Images & Media */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Images & Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Logo Upload */}
            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-2">Campaign Logo</label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="border rounded-lg p-2 focus:outline-blue-500 focus:border-blue-500"
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">Upload your campaign/organization logo (PNG, JPG, JPEG)</span>
              {form.logo && (
                <div className="mt-2 text-sm text-green-600">
                  Selected: {form.logo.name}
                </div>
              )}
            </div>

            {/* Activity Photos Upload */}
            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-2">NGO Activity Photos</label>
              <input
                type="file"
                name="activity_photos"
                accept="image/*"
                multiple
                className="border rounded-lg p-2 focus:outline-blue-500 focus:border-blue-500"
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500 mt-1">Upload multiple photos showing your NGO's activities and impact (hold Ctrl/Cmd to select multiple)</span>
              {form.activity_photos.length > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  {form.activity_photos.length} photo(s) selected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !verificationData?.can_create_campaigns}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition ${
            isSubmitting || !verificationData?.can_create_campaigns
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? 'Creating Campaign...' : 
           !verificationData?.can_create_campaigns ? 'NGO Verification Required' : 
           'Create Campaign'}
        </button>
      </form>
        </div>
      </div>
    </>
  );
}
