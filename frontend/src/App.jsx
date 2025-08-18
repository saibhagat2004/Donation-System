import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/login";
import SignUpPage from "./pages/auth/SignUpPage";
import LoadingSpinner from "./components/LoadingSpinner";
import AppLayout from "./components/AppLayout";
import PaymentPage from "./pages/PaymentPage";
import NgoForm from "./pages/NGO/AddNGOBeneficiary"; // Example extra page

function App() {
  const [isGuest, setIsGuest] = useState(false);

  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      if (isGuest) return null;
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    enabled: !isGuest,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Protected routes with AppLayout */}
        <Route
          path="/"
          element={
            authUser || isGuest ? (
              <AppLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          {/* Default page */}
          <Route index element={<HomePage />} />

          {/* Example additional routes inside layout */}
          <Route path="ngo-form" element={<NgoForm />} />
          <Route path="payment" element={<PaymentPage />} />
        </Route>

        {/* Public routes */}
        <Route
          path="/login"
          element={!authUser && !isGuest ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
