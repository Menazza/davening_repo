'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Handler() {
  const router = useRouter();

  useEffect(() => {
    // Legacy Stack route – just send users to the login page now
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 text-sm">Redirecting to login…</p>
      </div>
    </div>
  );
}
