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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-4">Sign Up</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} className="w-full p-2 border rounded" required />
          <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleInputChange} className="w-full p-2 border rounded" required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded" required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} className="w-full p-2 border rounded" required />
           <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="" disabled>Select Role</option>
              <option value="Donor">Donor</option>
              <option value="NGO">NGO</option>
            </select>
            <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Sign Up</button>

        </form>
        
        <div className="my-4 text-center">OR</div>
        
       <div className="flex justify-center">
          <GoogleLogin 
            onSuccess={handleGoogleSuccess} 
            onError={() => toast.error("Google login failed")} 
          />
        </div>
        <p className="text-center mt-4">
          Already have an account?
          <Link to="/login" className="text-blue-500 hover:underline"> Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
