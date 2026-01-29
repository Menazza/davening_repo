import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: '/handler/sign-in',
    // Don't set afterSignIn - let the handler page handle redirects
    // This prevents Stack Auth from redirecting before session is fully established
  }
});
