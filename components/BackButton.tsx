import { ArrowLeft } from "lucide-react";
import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type BackButtonProps = {
  href: string;

  label?: string;

  className?: string;

  fullWidth?: boolean;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function BackButton({
  href,
  label = "กลับ",
  className = "",
  fullWidth = false,
}: BackButtonProps) {
  return (
    <AppButton
      href={href}
      variant="success"
      size="md"
      fullWidth={fullWidth}
      className={className}
      icon={
        <ArrowLeft
          size={20}
          strokeWidth={2.6}
        />
      }
    >
      {label}
    </AppButton>
  );
}