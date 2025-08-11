import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DefaultAvatar from "../../public/avatars/boy1.png";

const Navbar = ({ authUser, isGuest, setIsGuest }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Logout Mutatio n
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      toast.success("Logout successful");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login");
    },
    onError: () => {
      toast.error("Logout Failed");
    },
  });

  const handleLogout = () => {
    if (isGuest) {
      setIsGuest(false);
      navigate("/login");
    }
    logout();
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      {/* Logo */}
      <div className="text-lg font-semibold">
        <Link to="/">NavBar</Link>
      </div>

      {/* Navigation Links */}
      <div className="space-x-4 hidden md:flex">
        <Link to="/" className="hover:text-orange-400">Home</Link>

      </div>

      {/* Profile Dropdown */}
      <div className="relative">
        {authUser ? (
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="focus:outline-none">
            <img 
              src={authUser.profilePicture || DefaultAvatar} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-gray-300"
            />
          </button>
        ) : (
          <Link to="/login" className="hover:text-orange-400">Login</Link>
        )}

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-md shadow-lg z-50">
            <ul className="py-2">
              <li>
                <Link to="/DashBoardPage" className="block px-4 py-2 hover:bg-gray-200">Profile</Link>
              </li>
              <li>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-200">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
