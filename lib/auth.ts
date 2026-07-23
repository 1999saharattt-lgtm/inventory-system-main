import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SessionUser } from "./session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

export async function requireLogin(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(
  ...roles: SessionUser["role"][]
): Promise<SessionUser> {
  const user = await requireLogin();

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}