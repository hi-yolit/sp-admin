'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginFormData } from "@/types/forms";

export const useLogin = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: loginFormData) => {
    setError("");
    setLoading(true);
    const { email, password } = formData;

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // Handle different error cases
        switch (result.error) {
          case 'Not authorized to access admin panel':
            setError('You do not have admin privileges');
            break;
          case 'Email not verified':
            setError('Please verify your email before logging in');
            break;
          case 'Invalid password':
            setError('Invalid email or password');
            break;
          default:
            setError(result.error);
        }
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
    
  return {
    error,
    loading,
    handleSubmit,
  };
};
