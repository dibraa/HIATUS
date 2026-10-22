export const PHONE_MESSAGE = "Enter 7 to 15 digits, or leave the phone number blank.";
export function phoneError(value: string) {
  return value.trim() && !/^\d{7,15}$/.test(value.trim()) ? PHONE_MESSAGE : null;
}
export function phoneDigits(value: string) { return value.replace(/\D/g, "").slice(0, 15); }
