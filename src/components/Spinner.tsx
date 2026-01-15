import React from "react";
import './spiner.css';

type SpinnerProps = {
  size?: number;
  ariaLabel?: string;
  className?: string;
};

export function Spinner({
  size = 16,
  ariaLabel = "Loading",
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`spinner ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}
