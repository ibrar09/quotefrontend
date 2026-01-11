import { FaClipboardList, FaBoxOpen, FaFileInvoiceDollar, FaUsers, FaMoneyBillWave, FaFileInvoice } from "react-icons/fa";

export const cardsData = [
  { id: 1, title: "Need to Send", count: 26, color: "red", icon: FaClipboardList, link: "/quotations" },
  { id: 2, title: "Sent / Pending PO", count: 21, color: "blue", icon: FaBoxOpen, link: "/quotations" },
  { id: 3, title: "Completed Work", count: 14, color: "green", icon: FaFileInvoiceDollar, link: "/work-orders" },
  { id: 4, title: "Clients", count: 32, color: "purple", icon: FaUsers, link: "/clients" },
  { id: 5, title: "Invoices Ready", count: 5, color: "yellow", icon: FaFileInvoice, link: "/finance" },
  { id: 6, title: "Payments Pending", count: 8, color: "orange", icon: FaMoneyBillWave, link: "/finance" },
];
