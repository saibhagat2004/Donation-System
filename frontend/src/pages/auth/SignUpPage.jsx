import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: ""

  });

  const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const response = await res.json();
      if (!res.ok) throw new Error(response.error || "Signup failed");
      return response;
    },
    onSuccess: () => {
      toast.success("Account created successfully!");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signupMutation.mutate(formData);
  };

  

  const handleGoogleSuccess = (credentialResponse) => {
    const credentialResponseDecode = jwtDecode(credentialResponse.credential);
    console.log(credentialResponseDecode)
    const googleUser = {
      fullName: credentialResponseDecode.name,
      email: credentialResponseDecode.email,
      googleId: credentialResponseDecode.sub,
      profilePicture: credentialResponseDecode.picture,
    };
    signupMutation.mutate(googleUser);
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(42, 27, 80, 0.9) 0%, rgba(60, 38, 117, 0.8) 50%, rgba(114, 87, 171, 0.7) 100%)'
      }}
    >
      {/* Yellow accent circles */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(253, 224, 71, 0.4) 0%, transparent 70%)',
          transform: 'translate(20%, -20%)'
        }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(253, 224, 71, 0.3) 0%, transparent 70%)',
          transform: 'translate(-20%, 20%)'
        }}
      ></div>

      <div className="w-full max-w-6xl mx-auto p-8 grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Auth Banner and Content */}
        <div className="text-white space-y-6">
          <div className="flex justify-center md:justify-start">
            <img 
              src="/Auth Banner.png" 
              alt="Auth Banner" 
              className="w-full max-w-lg h-auto object-contain"
            />
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Transparent Donations, Real Impact
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              Every contribution is securely tracked using blockchain, ensuring trust between donors and NGOs. Together, let's build a future of accountability and impact.
            </p>
          </div>
        </div>

        {/* Right side - SignUp Form */}
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Join Hope Chain</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              name="fullName" 
              placeholder="Full Name" 
              value={formData.fullName} 
              onChange={handleInputChange} 
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors" 
              required 
            />
            <input 
              type="text" 
              name="username" 
              placeholder="Username" 
              value={formData.username} 
              onChange={handleInputChange} 
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors" 
              required 
            />
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={formData.email} 
              onChange={handleInputChange} 
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors" 
              required 
            />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleInputChange} 
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors" 
              required 
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              required
            >
              <option value="" disabled>Select Role</option>
              <option value="donor">Donor</option>
              <option value="ngo">NGO</option>
            </select>
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          
          <div className="flex justify-center mb-4">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => toast.error("Google login failed")} 
            />
          </div>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
