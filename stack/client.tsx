import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  // Require users to set their display name (full name) during sign-up
  profileFields: {
    displayName: {
      required: true,
      minLength: 2,
    },
  },
});
