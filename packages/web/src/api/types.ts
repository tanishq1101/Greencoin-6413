import type { auth } from "./auth";

export type AppUser = (typeof auth.$Infer.Session)["user"];
export type AppSession = (typeof auth.$Infer.Session)["session"];

export type AppVariables = {
  user: AppUser | null;
  session: AppSession | null;
};
