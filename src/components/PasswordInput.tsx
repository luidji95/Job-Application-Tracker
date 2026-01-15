import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";
import "./passwordInput.css";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function PasswordInput({
  label = "Password",
  error,
  helperText,
  className,
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`passwordField ${className ?? ""}`}>
      <Input
        label={label}
        type={showPassword ? "text" : "password"}
        error={error}
        helperText={helperText}
        {...rest}
      />

      <button
        type="button"
        className="passwordField__toggle"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
