import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Program Tracker - Attendance System",
  description: "Track your attendance across multiple programs and activities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><StackProvider app={stackClientApp}><StackTheme>{children}</StackTheme></StackProvider></body>
    </html>
  );
}

