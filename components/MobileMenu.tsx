"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "ADMIN"
  | "STAFF"
  | "VIEWER";

type MenuItem = {
  name: string;
  href: string;
  emoji: string;
  adminOnly?: boolean;
};

type MenuGroup = {
  title: string;
  emoji: string;
  items: MenuItem[];
  adminOnly?: boolean;
};

type MobileMenuProps = {
  role: UserRole;
};

/* =========================================================
   MENU CONFIGURATION
========================================================= */

const menus: MenuGroup[] = [
  {
    title: "รายการพัสดุ",
    emoji: "📦",

    items: [
      {
        name: "รายการพัสดุทั้งหมด",
        href: "/materials",
        emoji: "🗃️",
      },
      {
        name: "รายการรับเข้า",
        href: "/receive",
        emoji: "📥",
        adminOnly: true,
      },
      {
        name: "รายการเบิกจ่าย",
        href: "/issue",
        emoji: "📤",
      },
      {
        name: "บัญชีคุมพัสดุ",
        href: "/stock-card",
        emoji: "📒",
      },
      {
        name: "ทะเบียนคุมครุภัณฑ์",
        href: "/assets",
        emoji: "🖥️",
      },
    ],
  },

  {
    title: "หน่วยงาน",
    emoji: "🏢",

    items: [
      {
        name: "ผู้จำหน่าย",
        href: "/vendors",
        emoji: "🚚",
        adminOnly: true,
      },
      {
        name: "กลุ่มงาน",
        href: "/departments",
        emoji: "🏛️",
      },
    ],
  },