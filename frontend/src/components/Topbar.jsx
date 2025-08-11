import React, { useState } from "react";
import { HiMenu } from "react-icons/hi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DefaultAvatar from "../../public/avatars/boy1.png";
import { Link, useNavigate } from "react-router-dom";


export default function Topbar({toggleSidebar , isGuest, setIsGuest}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const role = authUser?.role || "donor";
  const name=authUser?.fullName
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
    <div className="bg-white shadow px-6 py-3 flex justify-between items-center sticky top-0 z-40">
      {/* Left: Hamburger + Name */}
      <div className="flex items-center space-x-4">
        {/* Hamburger for Mobile */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded hover:bg-gray-100"
        >
          <HiMenu size={24} />
        </button>
        <div >
          <p className="font-semibold text-lg">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
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
    </div>
  );
}
