import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
process.env.JWT_SECRET ?? "inventory-secret-key"
);

export async function proxy(req: NextRequest) {
const { pathname } = req.nextUrl;

// =====================================================
// Public
// =====================================================

// PDF จาก QR Code เปิดได้โดยไม่ต้อง Login
if (
pathname.startsWith("/stock-card/material/") &&
pathname.endsWith("/pdf")
) {
return NextResponse.next();
}

// Google SEO files เปิดได้โดยไม่ต้อง Login
if (
pathname === "/robots.txt" ||
pathname === "/sitemap.xml"
) {
return NextResponse.next();
}

// =====================================================
// Static
// =====================================================

if (
pathname.startsWith("/_next") ||
pathname.startsWith("/favicon.ico")
) {
return NextResponse.next();
}

const token = req.cookies.get("session")?.value;

// =====================================================
// Login
// =====================================================

if (pathname.startsWith("/login")) {
if (!token) {
return NextResponse.next();
}


try {
  await jwtVerify(token, secret);

  return NextResponse.redirect(
    new URL("/", req.url)
  );
} catch {
  return NextResponse.next();
}


}

// =====================================================
// หน้าอื่นต้อง Login
// =====================================================

if (!token) {
return NextResponse.redirect(
new URL("/login", req.url)
);
}

// =====================================================
// ตรวจสอบ Session
// =====================================================

try {
const { payload } = await jwtVerify(
token,
secret
);


const role = String(payload.role ?? "");

// ===================================================
// ADMIN ONLY
//
// ADMIN = ผู้ดูแลระบบ
// ===================================================

const adminOnlyPaths = [
  "/receive",
  "/vendors",
  "/departments",
  "/users",
];

const isAdminOnlyPath =
  adminOnlyPaths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`)
  );

if (
  isAdminOnlyPath &&
  role !== "ADMIN"
) {
  return NextResponse.redirect(
    new URL("/", req.url)
  );
}

// ===================================================
// การแจ้งเตือน
//
// ADMIN และกลุ่มงานสามารถเข้าได้ทั้งคู่
//
// การแยกข้อมูลว่าใครเห็นการแจ้งเตือนอะไร
// จัดการที่ /notifications/page.tsx
// ===================================================

return NextResponse.next();


} catch {
return NextResponse.redirect(
new URL("/login", req.url)
);
}
}

export const config = {
matcher: [
"/((?!api|_next/static|_next/image|favicon.ico).*)",
],
};
