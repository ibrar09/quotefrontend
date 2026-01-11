import React from "react";
import { useTheme } from "../context/ThemeContext";

const dummyActivities = [
  { id: 1, type: "Quotation Sent", name: "Client A", date: "2025-12-28", status: "Sent" },
  { id: 2, type: "Work Order Started", name: "Client B", date: "2025-12-27", status: "In Progress" },
  { id: 3, type: "Invoice Generated", name: "Client C", date: "2025-12-26", status: "Pending" },
];

const RecentActivityTable = () => {
  const { darkMode, colors, themeStyles } = useTheme();

  return (
    <div className={`mt-6 overflow-x-auto ${themeStyles.card}`}>
      <h3 className={`${colors.text} font-semibold mb-3`}>
        Recent Activities
      </h3>
      <table className="w-full text-sm text-left">
        <thead className={themeStyles.tableHeader}>
          <tr>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Client</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyActivities.map((activity) => (
            <tr key={activity.id} className={themeStyles.tableRow}>
              <td className={`px-4 py-2 ${colors.text}`}>{activity.type}</td>
              <td className={`px-4 py-2 ${colors.text}`}>{activity.name}</td>
              <td className={`px-4 py-2 ${colors.textSecondary}`}>{activity.date}</td>
              <td className={`px-4 py-2 ${colors.text}`}>{activity.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentActivityTable;
