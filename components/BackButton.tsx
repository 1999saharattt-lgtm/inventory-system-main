import { ArrowLeft } from "lucide-react";
import AppButton, {
  type AppButtonSize,
} from "@/components/AppButton";

/* =========================================================
   BACK BUTTON
   iOS-Inspired Global Back Button

   ใช้เป็นปุ่ม "กลับ" มาตรฐานทั้งระบบ

   DESIGN RULE
   - ใช้ AppButton เป็นฐาน
   - สีเขียวมาตรฐานทั้งระบบ
   - iOS-inspired interaction
   - Soft Shadow
   - Rounded Corner
   - Press Feedback
   - ขนาดตรงกันทุกหน้า

   IMPORTANT
   - ไม่เกี่ยวข้องกับ Database
   - ไม่เกี่ยวข้องกับ Prisma
   - ไม่เปลี่ยน Route
   - ไม่เปลี่ยน Permission
   - ไม่เปลี่ยน Business Logic
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type BackButtonProps = {
  /**
   * URL ปลายทางของปุ่มกลับ
   */
  href: string;

  /**
   * ข้อความบนปุ่ม
   *
   * Default:
   * "กลับ"
   */
  label?: string;

  /**
   * ขนาดปุ่ม
   *
   * Default:
   * "md"
   */
  size?: AppButtonSize;

  /**
   * ให้ปุ่มเต็มความกว้างหรือไม่
   *
   * เหมาะสำหรับ Mobile
   */
  fullWidth?: boolean;

  /**
   * className เพิ่มเติม
   */
  className?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function BackButton({
  href,
  label = "กลับ",
  size = "md",
  fullWidth = false,
  className = "",
}: BackButtonProps) {
  return (
    <AppButton
      href={href}
      variant="success"
      size={size}
      fullWidth={fullWidth}
      className={className}
      icon={
        <ArrowLeft
          size={20}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      }
    >
      {label}
    </AppButton>
  );
}