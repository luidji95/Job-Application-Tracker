import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "../../../layouts/AuthLayout/AuthLayout";
import { supabase } from "../../../lib/supabaseClient";
import { signInAsGuest } from "../../../lib/auth/guestDemo";

import { loginSchema } from "../../../schemas/auth.schema";

import "./loginPage.css";

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("No user returned.");

      reset();
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? "Login failed.");
      } else {
        setError("Login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setError(null);
    setDemoLoading(true);

    try {
      await signInAsGuest();
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Demo login failed.");
      }
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Enter your credentials to open your board."
    >
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <PasswordInput
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
          error={errors.password?.message}
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <Button type="submit" isLoading={isLoading}>
            Log in
          </Button>

          <Button
            variant="ghost"
            type="button"
            className="guest-demo-btn"
            onClick={handleTryDemo}
            isLoading={demoLoading}
            disabled={isLoading || demoLoading}
          >
            Try the demo as a guest
          </Button>
        </div>

        <p className="form-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
