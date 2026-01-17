import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthLayout } from "../../../layouts/AuthLayout/AuthLayout";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { Button } from "../../../components/ui/Button";
import { supabase } from "../../../lib/supabaseClient";

import "./registration.css";
import { registerSchema } from "../../../schemas/auth.schema";

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegistrationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        
        // options: { data: { firstName: data.firstName, lastName: data.lastName, username: data.username } } - Moram da vidim kasnije da li cu metadata ili da gurnem u storage 
      });

      if (signUpError) throw signUpError;

      // Ovde user mora da potvrdi preko mejla autetifikaciju
      setMessage("If an account with this email exists, you’ll receive a confirmation email shortly. Please check your inbox (and spam).");

      reset();
    } catch (err: unknown) {
      if(err instanceof Error){
        setError(err?.message ?? "Registration failed.");
      } else {
        setError("Registration failed");
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Create your account to access your dashboard.">
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-row">
          <Input
            label="First name"
            placeholder="Miloš"
            autoComplete="given-name"
            {...register("firstName")}
            error={errors.firstName?.message}
          />

          <Input
            label="Last name"
            placeholder="Petrović"
            autoComplete="family-name"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>

        <Input
          label="Username"
          placeholder="luidji95"
          autoComplete="username"
          {...register("username")}
          error={errors.username?.message}
        />

        <Input
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("password")}
          error={errors.password?.message}
        />

        <PasswordInput
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <label className="checkbox">
          <input type="checkbox" {...register("terms")} />
          <span>
            I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </span>
        </label>
        {errors.terms && <p className="error">{errors.terms.message}</p>}

        <div className="form-actions">
          {message ? <p style={{ color: "green" }}>{message}</p> : null}
          {error ? <p style={{ color: "red" }}>{error}</p> : null}

          <Button type="submit" isLoading={isLoading}>
            Create account
          </Button>

          <p className="form-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
