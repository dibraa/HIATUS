import { redirect } from "next/navigation";

// Menu items are edited in the Edit dialog on /admin/menu, which takes a timestamp-ordered editing
// turn first (edit-turn.ts); a standalone page could not hold one, so old links land on the list.
export default function EditMenuItemPage() {
  redirect("/admin/menu");
}
