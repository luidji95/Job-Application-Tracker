import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import "./authLayout.css";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="auth">
      <Link to="/" className="auth-brand">
        <Logo />
        JobFlowTracker
      </Link>

      <div className="auth-card">
        <div className="auth-head">
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        </div>

        <div className="auth-inner">{children}</div>
      </div>
    </div>
  );
}
