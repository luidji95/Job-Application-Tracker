import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "../../../layouts/AuthLayout/AuthLayout";
import { supabase } from "../../../lib/supabaseClient";

import { loginSchema } from "../../../schemas/auth.schema";
import type { z } from "zod";

import "./loginPage.css";





type LoginFormData = z.infer<typeof loginSchema>;

type PendingProfile = {
  firstName?: string;
  lastName?: string;
  username?: string;
};

const getPendingProfile = (): PendingProfile | null => {
  const raw = localStorage.getItem("pending_profile");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingProfile;
  } catch {
    return null;
  }
};




export const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

      
      

      // Upsert - Azuriranje profila
      
      await supabase.from("profiles").upsert({ id: user.id, email: user.email }, { onConflict: "id" });

        const pending = getPendingProfile();
        if (pending) {
            await supabase.from("profiles").update({
            firstName: pending.firstName,
            lastName: pending.lastName,
            userName: pending.username,
             }).eq("id", user.id);

            localStorage.removeItem("pending_profile");
        }


      

      reset();
      navigate("/dashboard");
    } catch (err: unknown) {
        if(err instanceof Error) {
            setError(err?.message ?? "Login failed.");
        } else {
            setError("Login failed");
        }
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Login" subtitle="Enter your credentials to access your dashboard.">
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          placeholder="you@example.com"
          {...register("email")}
          error={errors.email?.message}
        />

        <PasswordInput
          placeholder="••••••••"
          {...register("password")}
          error={errors.password?.message}
        />

        <div className="form-actions">
          <Button type="submit" isLoading={isLoading}>
            Login
          </Button>

          <Button variant="ghost" type="button" className="guest-demo-btn">
            <span className="guest-icon">👁️</span>
            Try demo as guest
          </Button>
        </div>

        {error && (
          <p style={{ color: "red", marginTop: "10px", border: "1px solid red", padding: 8 }}>
            {error}
          </p>
        )}

        <p className="form-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
