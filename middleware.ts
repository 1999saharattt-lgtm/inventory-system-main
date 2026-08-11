import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "inventory-secret-key"
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // ไฟล์ Static
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // ถ้าเปิดหน้า Login
  if (pathname.startsWith("/login")) {
    if (!token) {
      return NextResponse.next();
    }

    try {
      await jwtVerify(token, secret);

      // Login แล้ว ไม่ต้องกลับไปหน้า Login
      return NextResponse.redirect(new URL("/", req.url));
    } catch {
      return NextResponse.next();
    }
  }

  // หน้า PDF สำหรับ QR Code ไม่ต้อง Login
  if (
    pathname.startsWith("/stock-card/material/") &&
    pathname.endsWith("/pdf")
  ) {
    return NextResponse.next();
  }

  // หน้าอื่นต้อง Login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};