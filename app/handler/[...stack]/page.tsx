'use client';

import { StackHandler } from "@stackframe/stack";
import { useUser } from "@stackframe/stack";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Handler() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If user is already signed in and they're on sign-in or sign-up, redirect to dashboard
    if (user && (pathname?.includes('/sign-in') || pathname?.includes('/sign-up'))) {
      router.push('/dashboard');
    }
  }, [user, router, pathname]);

  return <StackHandler fullPage />;
}
