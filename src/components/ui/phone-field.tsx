"use client";
import { useState, type ComponentProps } from "react";
import { TextField } from "./field";
import { phoneDigits, phoneError } from "@/lib/phone";

type Props = Omit<ComponentProps<typeof TextField>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
};
export function PhoneField({ value, onValueChange, ...props }: Props) {
  const [touched, setTouched] = useState(false);
  return <TextField {...props} value={value} type="tel" inputMode="numeric" pattern="[0-9]{7,15}" maxLength={15}
    hint="Numbers only, 7 to 15 digits. Optional."
    error={props.error || (touched ? phoneError(value) : null)}
    onBlur={() => setTouched(true)}
    onBeforeInput={event => {
      const data = (event.nativeEvent as InputEvent).data;
      if (data && /\D/.test(data)) event.preventDefault();
    }}
    onPaste={event => {
      event.preventDefault();
      const field = event.currentTarget;
      const pasted = phoneDigits(event.clipboardData.getData("text"));
      onValueChange(phoneDigits(value.slice(0, field.selectionStart ?? value.length) + pasted + value.slice(field.selectionEnd ?? value.length)));
    }}
    onChange={event => onValueChange(phoneDigits(event.target.value))}
  />;
}
