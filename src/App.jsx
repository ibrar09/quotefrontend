// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// 🔹 Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

// 🔹 Lazy Load Pages for Performance
const DashboardLayout = lazy(() => import("./pages/Dashboard"));
const Dashboard = lazy(() => import("./pages/Dashboardcom"));
const NewQuotation = lazy(() => import("./modules/Quotations/NewQuotation"));
const QuotationList = lazy(() => import("./modules/Quotations/QuotationList"));
const SendQuotation = lazy(() => import("./modules/Quotations/SendQuotation"));
const QuotationIntake = lazy(() => import("./modules/Quotations/QuotationIntake"));
const IntakeList = lazy(() => import("./modules/Quotations/IntakeList"));
const WorkList = lazy(() => import("./modules/Work/WorkList"));
const QuotationPrintView = lazy(() => import("./modules/Quotations/QuotationPrintView"));
const DataSync = lazy(() => import("./modules/Admin/DataSync"));
const MasterData = lazy(() => import("./modules/Admin/MasterData"));
const PriceList = lazy(() => import("./modules/Admin/PriceList"));
const CustomPriceList = lazy(() => import("./modules/Admin/CustomPriceList"));
const CustomStores = lazy(() => import("./modules/Admin/CustomStores"));
const UserManagement = lazy(() => import("./modules/Admin/UserManagement"));
const RecycleBin = lazy(() => import("./pages/RecycleBin"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Standalone PDF View (No Sidebar) - Protected? Yes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/quotations/print-view/:id" element={<QuotationPrintView />} />
            </Route>

            {/* Dashboard Layout - Protected */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Default dashboard page */}
                <Route index element={<Dashboard />} />

                {/* Quotation Routes */}
                <Route path="quotations/list" element={<QuotationList />} />
                <Route path="quotations/new" element={<QuotationIntake />} />
                <Route path="quotations/intakes" element={<IntakeList />} />
                <Route path="quotations/new-quotation" element={<NewQuotation />} />
                <Route path="quotations/send/:id" element={<SendQuotation />} />

                {/* Work Routes */}
                <Route path="work/list" element={<WorkList />} />

                {/* Admin Routes */}
                <Route path="admin/data-sync" element={<DataSync />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="admin/custom-stores" element={<CustomStores />} />
                <Route path="admin/custom-pricelist" element={<CustomPriceList />} />
                <Route path="master-data" element={<MasterData />} />
                <Route path="rate-card" element={<PriceList />} />
                <Route path="recycle-bin" element={<RecycleBin />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
