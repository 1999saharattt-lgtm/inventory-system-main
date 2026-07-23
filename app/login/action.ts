"use server";

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

export async function login(formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    throw new Error("กรุณากรอก Username และ Password");
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  if (!user.active) {
    throw new Error("บัญชีผู้ใช้งานถูกปิดการใช้งาน");
  }

  const validPassword = await compare(password, user.password);

  if (!validPassword) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  // สร้าง JWT Session
  const token = await createSession({
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    role: user.role,
  });

  // บันทึก Cookie
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  });

  redirect("/");
}