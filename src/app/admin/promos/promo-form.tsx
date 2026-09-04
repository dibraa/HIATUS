"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  FormError,
} from "@/components/ui/field";
import { savePromotion } from "@/app/actions/promotions";
import type { Promotion } from "@/types/database";

/**
 * Create / edit a promo code.
 *
 * Two things the form does that a plain field list would not:
 *
 *   1. THE CAP FIELD APPEARS ONLY FOR A PERCENTAGE. "Maximum discount" is
 *      meaningless on a fixed ₱50 off — it is its own cap — and a field that
 *      does nothing is a field someone will fill in and expect to matter.
 *   2. IT SAYS WHAT THE RULE MEANS IN WORDS, live, under the inputs. "20% off
 *      orders over ₱200, capped at ₱100" is checkable at a glance in a way
 *      four separate number fields are not.
 *
 * The datetime inputs are `datetime-local`, so the shop enters its own wall
 * clock; the browser sends an ISO string and Postgres stores it as timestamptz.
 */
export function PromoForm({ promotion }: { promotion?: Promotion }) {
  const [state, formAction, pending] = useActionState(savePromotion, {
    error: null,
  });

  const [discountType, setDiscountType] = useState(
    promotion?.discount_type ?? "percent"
  );
  const [value, setValue] = useState(String(promotion?.discount_value ?? ""));
  const [minOrder, setMinOrder] = useState(
    promotion?.min_order_amount ? String(promotion.min_order_amount) : ""
  );
  const [cap, setCap] = useState(
    promotion?.max_discount_amount ? String(promotion.max_discount_amount) : ""
  );

  const summary = buildSummary(discountType, value, minOrder, cap);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {promotion && <input type="hidden" name="id" value={promotion.id} />}

      <TextField
        id="code"
        name="code"
        label="Code"
        required
        defaultValue={promotion?.code ?? ""}
        placeholder="WELCOME10"
        hint="3–24 characters: letters, numbers, hyphen or underscore. Customers can type it in any case."
        // Uppercasing as they type matches how the code is stored and how it
        // will appear on their receipt, so there is no surprise later.
        className="uppercase"
        style={{ textTransform: "uppercase" }}
      />

      <TextAreaField
        id="description"
        name="description"
        label="Description"
        rows={2}
        defaultValue={promotion?.description ?? ""}
        placeholder="Ten percent off your first order"
        hint="Only staff and admins see this. It is a note to yourselves."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="discount_type"
          name="discount_type"
          label="Discount type"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
        >
          <option value="percent">Percentage off</option>
          <option value="fixed">Fixed amount off</option>
        </SelectField>

        <TextField
          id="discount_value"
          name="discount_value"
          label={discountType === "percent" ? "Percentage" : "Amount off"}
          type="number"
          min="0.01"
          max={discountType === "percent" ? "100" : undefined}
          step="0.01"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={discountType === "percent" ? "10" : "50"}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="min_order_amount"
          name="min_order_amount"
          label="Minimum order"
          type="number"
          min="0"
          step="0.01"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          placeholder="0"
          hint="Leave blank for no minimum."
        />

        {discountType === "percent" && (
          <TextField
            id="max_discount_amount"
            name="max_discount_amount"
            label="Maximum discount"
            type="number"
            min="0.01"
            step="0.01"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            placeholder="No cap"
            hint="Caps a percentage promo in money terms."
          />
        )}
      </div>

      {summary && (
        <p
          aria-live="polite"
          className="rounded-md border border-accent/30 bg-accent-soft px-3 py-2.5 text-sm text-ink"
        >
          <span className="font-semibold">In plain terms: </span>
          {summary}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="starts_at"
          name="starts_at"
          label="Starts"
          type="datetime-local"
          defaultValue={toLocalInput(promotion?.starts_at)}
          hint="Leave blank to start immediately."
        />
        <TextField
          id="ends_at"
          name="ends_at"
          label="Ends"
          type="datetime-local"
          defaultValue={toLocalInput(promotion?.ends_at)}
          hint="Leave blank to run until you switch it off."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="usage_limit"
          name="usage_limit"
          label="Total uses"
          type="number"
          min="1"
          step="1"
          defaultValue={promotion?.usage_limit ?? ""}
          placeholder="Unlimited"
          hint="Across all customers."
        />
        <TextField
          id="per_user_limit"
          name="per_user_limit"
          label="Uses per customer"
          type="number"
          min="1"
          step="1"
          defaultValue={promotion?.per_user_limit ?? ""}
          placeholder="Unlimited"
          hint="Set to 1 for a one-per-person offer."
        />
      </div>

      <CheckboxField
        id="is_active"
        name="is_active"
        label="Active"
        defaultChecked={promotion?.is_active ?? true}
        hint="Switch off to retire the code without deleting its redemption history."
      />

      {state.error && <FormError>{state.error}</FormError>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : promotion ? "Save changes" : "Create promo"}
        </Button>
        <Link
          href="/admin/promos"
          className="inline-flex h-12 items-center rounded-full border border-line-strong bg-card px-6 text-base font-medium text-ink transition-colors duration-150 ease-hi hover:bg-raised"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Restates the four numeric fields as the sentence they add up to. */
function buildSummary(
  type: string,
  value: string,
  minOrder: string,
  cap: string
): string | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const base =
    type === "percent" ? `${amount}% off the order` : `₱${amount} off the order`;

  const parts = [base];
  if (Number(minOrder) > 0) parts.push(`when it is over ₱${Number(minOrder)}`);
  if (type === "percent" && Number(cap) > 0) parts.push(`capped at ₱${Number(cap)}`);

  return `${parts.join(", ")}.`;
}

/**
 * `datetime-local` will not accept an ISO string with a timezone or seconds —
 * it silently renders an empty field, which reads as "no date set" on a promo
 * that has one. Trimming to `YYYY-MM-DDTHH:mm` is what makes editing work.
 */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
