// src/pages/Dashboard.jsx
import React from "react";
import CardsSection from "../components/Statuscard";
import DashboardGraphs from "../components/DashboardGraphs";
import RecentActivityTable from "../components/RecentActivityTable";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <CardsSection />
      <DashboardGraphs />
      <RecentActivityTable />
    </div>
  );
};

export default Dashboard;
