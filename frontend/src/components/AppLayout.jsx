//  import React from "react";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
// import HomePage from "../pages/HomePage";
// import { useState,useEffect } from "react";

// export default function AppLayout() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 770);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsSidebarOpen(window.innerWidth >= 770);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   return (
//     <div className="flex">
//       {/* Sidebar */}
//       <Sidebar
//         isOpen={isSidebarOpen}
//         toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
//       />

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col md:ml-64">
//         <Topbar
//           name="John Doe"
//           role="Admin"
//           profileImage="https://via.placeholder.com/150"
//           toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
//         />

//         <div className="bg-gray-50 min-h-screen p-6">
//           <HomePage />
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 770);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 770);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        <Topbar
          name="John Doe"
          role="Admin"
          profileImage="https://via.placeholder.com/150"
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="bg-gray-50 min-h-screen p-6">
          <Outlet /> {/* Dynamic page content goes here */}
        </div>
      </div>
    </div>
  );
}
