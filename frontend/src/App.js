// Purpose: Implement module logic for this feature.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ReviewerLogin from './pages/ReviewerLogin';
import CandidateInterview from './pages/CandidateInterview';
import ReviewerDashboard from './pages/ReviewerDashboard';
import VideoReview from './pages/VideoReview';
import HRDashboard from './pages/HRDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Main flow: Initialize dependencies and run module logic.

// Function: App - Handles app.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/reviewer/login" element={<ReviewerLogin />} />
          <Route path="/interview/:token" element={<CandidateInterview />} />
          <Route path="/reviewer" element={<ReviewerDashboard />} />
          <Route path="/review/:sessionId" element={<VideoReview />} />
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
