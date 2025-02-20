'use client';

import React, { Suspense, useEffect } from 'react';
import { useLogin } from "@/hooks/useLogin";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false
});

function LoginContent() {
  const { error, loading, handleSubmit } = useLogin();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/"); // Redirect logged-in users
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Welcome back</h2>
          <LoginForm
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>
        <p className="text-center text-gray-500 text-xs">
          &copy;{new Date().getFullYear()} SalesPath. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
