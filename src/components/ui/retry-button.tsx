"use client";

import { Button } from "./button";

export function RetryButton() {
  return (
    <Button variant="outline" size="md" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}
