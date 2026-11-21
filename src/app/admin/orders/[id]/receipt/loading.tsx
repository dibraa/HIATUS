import ReceiptLoading from "@/app/staff/pos/receipt/[id]/loading";

/** The admin receipt renders the staff receipt page inside `.admin-receipt`, so its skeleton does too. */
export default function Loading() {
  return <div className="admin-receipt"><ReceiptLoading /></div>;
}
