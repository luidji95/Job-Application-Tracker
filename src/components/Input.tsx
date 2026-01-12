import React from "react";
import "./input.css"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, ...rest }, ref) => {
    const inputId = id ?? React.useId();
    const describedById = helperText || error ? `${inputId}-desc` : undefined;

    return (
      <div className={["field", className ?? ""].join(" ")}>
        {label ? (
          <label className="field__label" htmlFor={inputId}>
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          className={["field__input", error ? "field__input--error" : ""].join(
            " "
          )}
          aria-invalid={!!error}
          aria-describedby={describedById}
          {...rest}
        />

        {error ? (
          <div id={describedById} className="field__error">
            {error}
          </div>
        ) : helperText ? (
          <div id={describedById} className="field__helper">
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
