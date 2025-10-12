import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/login";
import SignUpPage from "./pages/auth/SignUpPage";
import LoadingSpinner from "./components/LoadingSpinner";
import AppLayout from "./components/AppLayout";
import PaymentVerificationPage from "./pages/PaymentVerificationPage";
import NgoForm from "./pages/NGO/AddNGOBeneficiary"; // Example extra page
import MyCampaigns from "./pages/MyCampaigns";
import CreateCampaign from "./pages/NGO/CreateCampaign";
import NGODashboard from "./pages/NGO/NGODashboard";
import Explore from "./pages/Donor/Explore";
import CampaignDetails from "./pages/Donor/CampaignDetails";
import DonatePage from "./pages/Donor/DonatePage";
import MyDonations from "./pages/Donor/MyDonations";
import DonationReceiptPage from "./pages/DonationReceiptPage";
import BlockchainTransactions from "./pages/Blockchain/BlockchainTransactions";
import NgoBlockchainDetails from "./pages/Blockchain/NgoBlockchainDetails";
import ErrorBoundary from "./components/ErrorBoundary";

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
      <ErrorBoundary>
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
            {/* Default page with role-based routing */}
            <Route index element={
              authUser?.role === "ngo" ? (
                <Navigate to="/ngo-dashboard" replace />
              ) : authUser?.role === "donor" ? (
                <Navigate to="/explore" replace />
              ) : (
                <HomePage />
              )
            } />

            {/* Example additional routes inside layout */}
            <Route path="explore" element={<Explore />} />
            <Route path="ngo-form" element={<NgoForm />} />
            <Route path="ngo-dashboard" element={<NGODashboard />} />
            <Route path="my-campaigns" element={<MyCampaigns />} />
            <Route path="create-campaign" element={<CreateCampaign />} />
            <Route path="campaign/:id" element={<CampaignDetails />} />
            <Route path="donate/:campaignId" element={<DonatePage />} />
            <Route path="my-donations" element={<MyDonations />} />
            <Route path="donation-receipt/:orderId" element={<DonationReceiptPage />} />
            <Route path="payment-verification" element={<PaymentVerificationPage />} />
            <Route path="blockchain" element={<BlockchainTransactions />} />
            <Route path="blockchain/ngo/:ngoId" element={<NgoBlockchainDetails />} />
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
      </ErrorBoundary>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
