import { FaClipboardList, FaBoxOpen, FaFileInvoiceDollar, FaUsers, FaMoneyBillWave, FaFileInvoice, FaCheckCircle } from "react-icons/fa";

export const cardsData = [
  { id: 1, title: "Need to Send", key: "need_to_send", color: "orange", icon: FaClipboardList, link: "/quotations" },
  { id: 2, title: "Sent / Pending PO", key: "sent", color: "blue", icon: FaBoxOpen, link: "/quotations" },
  { id: 3, title: "Completed Work", key: "completed", color: "green", icon: FaCheckCircle, link: "/quotations" },
  { id: 4, title: "Payment Complete", key: "payment_complete", color: "teal", icon: FaFileInvoiceDollar, link: "/finance" },
  { id: 5, title: "Invoices Ready", key: "invoices_ready", color: "yellow", icon: FaFileInvoice, link: "/finance" },
  { id: 6, title: "Payments Pending", key: "payments_pending", color: "red", icon: FaMoneyBillWave, link: "/finance" },
];
