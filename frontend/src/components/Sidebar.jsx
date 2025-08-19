// import React from "react";
// import { Link } from "react-router-dom";
// import { useQueryClient } from "@tanstack/react-query";

// const menuItems = {
//   admin: [
//     { label: "Dashboard", path: "/admin" },
//     { label: "Manage Users", path: "/users" },
//     { label: "NGOs", path: "/ngos" },
//     { label: "Donations", path: "/donations" },
//     { label: "Settings", path: "/settings" },
//   ],
//   ngo: [
//     { label: "Dashboard", path: "/ngo" },
//     { label: "NGO Form", path: "/ngo-form" },
//     { label: "Campaigns", path: "/campaigns" },
//     { label: "Donations", path: "/donations" },
//     { label: "Reports", path: "/reports" },
//   ],
//   donor: [
//     { label: "Home", path: "/" },
//     { label: "Explore", path: "/explore" },
//     { label: "My Donations", path: "/donations" },
//   ],
// };

// export default function Sidebar({ isOpen, toggleSidebar }) {
//   const queryClient = useQueryClient();
//   const authUser = queryClient.getQueryData(["authUser"]);

//   const role = authUser?.role || "donor";
//   const items = menuItems[role] || [];
  

//   return (
//     <div
//       style={{
//         background: "linear-gradient(193deg,rgba(42, 27, 80, 1) 44%, rgba(60, 38, 117, 1) 58%, rgba(114, 87, 171, 1) 81%, rgba(242, 242, 242, 1) 100%)"
//       }}
//       className={`bg-[rgba(42,27,80)] text-white h-screen w-64 flex flex-col p-4 fixed top-0 left-0 transform 
//       ${isOpen ? "translate-x-0" : "-translate-x-full"} 
//       transition-transform duration-300 ease-in-out z-50`}
//     >
//       {/* Close button for mobile */}
//       <button
//         className="absolute top-4 right-4 md:hidden text-white text-2xl focus:outline-none"
//         onClick={toggleSidebar}
//         aria-label="Close sidebar"
//       >
//         &times;
//       </button>

//       <h2 className="text-2xl font-bold mb-6">Giving Block</h2>

//       <nav className="flex flex-col space-y-4">
//         {items.map((item) => (
//           <Link
//             key={item.path}
//             to={item.path}
//             className="hover:bg-gray-700 p-2 rounded"
//           >
//             {item.label}
//           </Link>
//         ))}
//       </nav>
//     </div>
//   );
// }



import React from "react";
import { NavLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const menuItems = {
  admin: [
    { label: "Dashboard", path: "/" },
    { label: "Manage Users", path: "/users" },
    { label: "NGOs", path: "/ngos" },
    { label: "Donations", path: "/donations" },
    { label: "Settings", path: "/settings" },
  ],
  ngo: [
    { label: "My Campaigns", path: "/my-campaigns" },
    { label: "Create Campaign", path: "/create-campaign" },
    { label: "NGO Form", path: "/ngo-form" }, // Matches nested route
    // { label: "Donations", path: "/donations" },
    { label: "Reports", path: "/reports" },
  ],
  donor: [
    { label: "Explore", path: "/explore" },
    { label: "My Donations", path: "/my-donations" },
    { label: "Home", path: "/" },
  ],
};

export default function Sidebar({ isOpen, toggleSidebar }) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const role = authUser?.role || "donor";
  const items = menuItems[role] || [];

  return (
    <div
      style={{
        background:
          "linear-gradient(193deg,rgba(42, 27, 80, 1) 44%, rgba(60, 38, 117, 1) 58%, rgba(114, 87, 171, 1) 81%, rgba(242, 242, 242, 1) 100%)",
      }}
      className={`text-white h-screen w-64 flex flex-col p-4 fixed top-0 left-0 transform 
      ${isOpen ? "translate-x-0" : "-translate-x-full"} 
      transition-transform duration-300 ease-in-out z-50`}
    >
      {/* Close button for mobile */}
      <button
        className="absolute top-4 right-4 md:hidden text-white text-2xl focus:outline-none"
        onClick={toggleSidebar}
        aria-label="Close sidebar"
      >
        &times;
      </button>

      <h2 className="text-2xl font-bold mb-6">Giving Block</h2>

      <nav className="flex flex-col space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `p-2 rounded transition-colors ${
                isActive ? "bg-gray-700 font-semibold" : "hover:bg-gray-700"
              }`
            }
            onClick={() => {
              if (window.innerWidth < 770) toggleSidebar(); // Close sidebar on mobile
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
