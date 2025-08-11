import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/login";
import SignUpPage from "./pages/auth/SignUpPage";
import Navbar from "./components/NavBar";
import LoadingSpinner from "./components/LoadingSpinner";
import AppLayout from "./components/AppLayout";


function App() {
  const [isGuest, setIsGuest] = useState(false);
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      if (isGuest) return null;
      try {
        const res = await fetch("/api/auth/me");
        // console.log(res)
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
    <>
      <Routes>
        <Route
          path="/"
          element={
            authUser || isGuest ? (
              <AppLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={!authUser && !isGuest ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
      </Routes>
    </>
      <Toaster />
    </>
  );
}

export default App;
