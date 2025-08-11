import React from "react";
import { useState, useEffect } from "react";
import RoleSelector from "../components/RoleSelector";

const HomePage = ({ authUser, updateUserRole }) => {
  const [showRolePopup, setShowRolePopup] = useState(false);

  useEffect(() => {
    if (authUser && !authUser.role) {
      setShowRolePopup(true);
    }
  }, [authUser]);

    const handleRoleSelect = async (role) => {
      try {
        await fetch("/api/users/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }), // role is now a string, not an event
          credentials: "include",
        });

        authUser.role = role;
        setShowRolePopup(false);
        
      } catch (error) {
        console.error("Error updating role:", error);
      }
    };

  return (
    <div className="relative">
      {showRolePopup && <RoleSelector onSelect={handleRoleSelect} />}

      <h1 className="font-bold">{authUser?.role}</h1>
      <p className="text-red-400 font-extrabold">Home page</p>
      <h1 className="text-xl font-bold">{authUser?.fullName}</h1>
       <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Donation History</h1>
      <div className="bg-[rgb(240, 244, 247)] rounded shadow p-4">
        <p className="text-gray-500">There are no recurring donations created</p>
        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Organization Name</th>
              <th className="p-2 border">Method</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">USD Value</th>
              <th className="p-2 border">Tax Form</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-400">
                No data available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default HomePage;
