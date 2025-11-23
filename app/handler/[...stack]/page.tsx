'use client';

import { StackHandler } from "@stackframe/stack";
import { useUser } from "@stackframe/stack";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Handler() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // If user is already signed in and they're on sign-in or sign-up, redirect appropriately
    // Use ref to prevent multiple redirects
    if (user && (pathname?.includes('/sign-in') || pathname?.includes('/sign-up')) && !hasRedirected.current) {
      hasRedirected.current = true;
      // Check if user is admin by fetching profile
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.is_admin) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        })
        .catch(() => {
          // If we can't check, default to dashboard
          window.location.href = '/dashboard';
        });
    }
  }, [user, router, pathname]);

  return <StackHandler fullPage />;
}
