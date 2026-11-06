import ReceiptPage from "@/app/staff/pos/receipt/[id]/page";
export { metadata } from "@/app/staff/pos/receipt/[id]/page";
export default function AdminReceipt(props: { params: Promise<{ id: string }> }) {
  return <div className="admin-receipt"><ReceiptPage {...props} /></div>;
}
