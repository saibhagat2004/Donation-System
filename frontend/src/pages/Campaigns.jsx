import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Campaigns() {
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

      const res = await axios.post("/api/campaigns/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Show success toast
      toast.success(`Campaign "${form.title}" created successfully! ID: ${res.data.campaign_id}`);
      
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
      let errorMsg = "Failed to create campaign";
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      // Show error toast
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
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
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
        </button>
      </form>
    </div>
  );
}
