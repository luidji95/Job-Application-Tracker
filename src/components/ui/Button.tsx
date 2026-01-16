import React from "react";
import { Spinner } from "./Spinner";
import "./css/button.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        isLoading ? "btn--loading" : "",
        className ?? "",
      ].join(" ")}
    >
      {isLoading ? (
        <span className="btn__content">
          <Spinner size={16} ariaLabel="Loading" />
          <span className="btn__text">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
