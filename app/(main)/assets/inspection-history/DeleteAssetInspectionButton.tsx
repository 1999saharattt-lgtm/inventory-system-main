"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";

type Props = {
  departmentId: number;
  departmentName: string;
  year: string;
};

export default function DeleteAssetInspectionButton({ departmentId, departmentName, year }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(`ยืนยันการลบประวัติการตรวจสอบครุภัณฑ์\n${departmentName} ปีงบประมาณ ${year}?\n\nการลบไม่สามารถย้อนกลับได้ และไม่กระทบทะเบียนครุภัณฑ์`)) return;

    setDeleting(true);
    try {
      const params = new URLSearchParams({ departmentId: String(departmentId), year });
      const response = await fetch(`/api/assets/inspection/history?${params.toString()}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const result: { ok?: boolean; error?: string; message?: string } = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || result.message || "ไม่สามารถลบประวัติได้");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบประวัติ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppButton type="button" variant="danger" size="sm" onClick={handleDelete} disabled={deleting}
      icon={<span aria-hidden="true">🗑️</span>}>
      {deleting ? "กำลังลบ..." : "ลบ"}
    </AppButton>
  );
}
