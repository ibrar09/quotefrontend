// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./pages/Dashboard"; // ✅ Correct import
import Dashboard from "./pages/Dashboardcom";
import NewQuotation from "./modules/Quotations/NewQuotation";
import QuotationList from "./modules/Quotations/QuotationList";
import SendQuotation from "./modules/Quotations/SendQuotation";
import QuotationIntake from "./modules/Quotations/QuotationIntake";
import IntakeList from "./modules/Quotations/IntakeList";
import WorkList from "./modules/Work/WorkList";
import QuotationPrintView from "./modules/Quotations/QuotationPrintView";
import DataSync from "./modules/Admin/DataSync";
import MasterData from "./modules/Admin/MasterData";
import PriceList from "./modules/Admin/PriceList";

function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone PDF View (No Sidebar) */}
        <Route path="/quotations/print-view/:id" element={<QuotationPrintView />} />

        <Route path="/" element={<DashboardLayout />}>
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
          <Route path="master-data" element={<MasterData />} />
          <Route path="rate-card" element={<PriceList />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
