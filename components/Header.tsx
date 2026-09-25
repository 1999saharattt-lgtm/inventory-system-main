import Image from "next/image";

import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";

import MobileMenu from "@/components/MobileMenu";

/* =========================================================
   HEADER
========================================================= */

export default async function Header() {
  const user =
    await requireLogin();

  /* =======================================================
     ROLE
  ======================================================= */

  const role =
    String(
      user.role ?? ""
    )
      .trim()
      .toUpperCase();

  const roleText =
    role === "ADMIN"
      ? "ผู้ดูแลระบบ"
      : role === "STAFF"
        ? "เจ้าหน้าที่"
        : role === "VIEWER"
          ? "ผู้ใช้งาน"
          : role;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <header
      className="
        sticky
        top-0
        z-50

        w-full

        px-2
        pt-2

        sm:px-3
        sm:pt-3

        lg:px-4
      "
    >
      {/* =====================================================
          GLASS HEADER
      ===================================================== */}

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-[1920px]
          overflow-hidden

          rounded-[26px]

          border
          border-white/80

          bg-white/80

          shadow-[0_18px_55px_-32px_rgba(15,23,42,0.50)]

          backdrop-blur-2xl
          backdrop-saturate-150

          ring-1
          ring-slate-900/[0.025]
        "
      >
        {/* ===================================================
            AMBIENT LIGHT
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-16
            -top-20