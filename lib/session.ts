import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "inventory-secret-key"
);

// =====================================================
// Role
// =====================================================

export type UserRole =
  | "ADMIN"
  | "STAFF"
  | "VIEWER";

// =====================================================
// Session User
//
// departmentId = หน่วยงานของผู้ใช้งาน
// sectionId    = กลุ่มงานของผู้ใช้งาน
//
// ADMIN สามารถไม่มี departmentId / sectionId ได้
// STAFF / VIEWER สามารถผูกกับหน่วยงานและกลุ่มงานได้
// =====================================================

export type SessionUser = {
  id: number;
  username: string;
  fullname: string;
  role: UserRole;

  departmentId?: number | null;
  sectionId?: number | null;
};

// =====================================================
// สร้าง JWT Session
// =====================================================

export async function createSession(
  user: SessionUser
) {
  return await new SignJWT({
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    role: user.role,

    departmentId:
      user.departmentId ?? null,

    sectionId:
      user.sectionId ?? null,
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
  const { payload } = await jwtVerify(
    token,
    secret
  );

  const role = String(
    payload.role ?? ""
  );

  const validRole: UserRole =
    role === "ADMIN" ||
    role === "STAFF" ||
    role === "VIEWER"
      ? role
      : "VIEWER";

  return {
    id: Number(payload.id),

    username: String(
      payload.username ?? ""
    ),

    fullname: String(
      payload.fullname ?? ""
    ),

    role: validRole,

    departmentId:
      payload.departmentId === null ||
      payload.departmentId === undefined
        ? null
        : Number(payload.departmentId),

    sectionId:
      payload.sectionId === null ||
      payload.sectionId === undefined
        ? null
        : Number(payload.sectionId),
  };
}