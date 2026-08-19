import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "inventory-secret-key"
);

// =====================================================
// Session User
//
// departmentId เป็น optional
// เพื่อรองรับการกำหนดกลุ่มงานของผู้ใช้งานในขั้นถัดไป
//
// ไม่บังคับใช้ตอนนี้
// จึงไม่กระทบ User / Session เดิม
// =====================================================

export type SessionUser = {
  id: number;
  username: string;
  fullname: string;
  role: string;
  departmentId?: number | null;
};

// =====================================================
// สร้าง JWT Session
// =====================================================

export async function createSession(user: SessionUser) {
  return await new SignJWT({
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    role: user.role,
    departmentId: user.departmentId ?? null,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// =====================================================
// ตรวจสอบ JWT Session
// =====================================================

export async function verifySession(
  token: string
): Promise<SessionUser> {
  const { payload } = await jwtVerify(token, secret);

  return {
    id: Number(payload.id),
    username: String(payload.username ?? ""),
    fullname: String(payload.fullname ?? ""),
    role: String(payload.role ?? ""),
    departmentId:
      payload.departmentId === null ||
      payload.departmentId === undefined
        ? null
        : Number(payload.departmentId),
  };
}