"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";

type Props = { fiscalYear: number };

export default function DeleteInspectionButton({ fiscalYear }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    const confirmed = window.confirm(
      `ยืนยันการลบประวัติการตรวจสอบบัญชีพัสดุ ปีงบประมาณ ${fiscalYear}?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้ และจะลบผลตรวจสอบของปีนี้ทั้งหมด โดยไม่ลบข้อมูลวัสดุหรือยอด Stock Card`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/stock-card/inspection?fiscalYear=${encodeURIComponent(fiscalYear)}`,
        { method: "DELETE", cache: "no-store" }
      );
      const result: { ok?: boolean; message?: string } = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "ไม่สามารถลบประวัติได้");
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบประวัติ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppButton
      type="button"
      variant="danger"
      size="sm"
      icon={<span aria-hidden="true">🗑️</span>}
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? "กำลังลบ..." : "ลบ"}
    </AppButton>
  );
}
