"use client";

import {
  useRouter,
} from "next/navigation";

import AppSearchableSelect from "@/components/AppSearchableSelect";

/* =========================================================
   TYPES
========================================================= */

type Department = {
  id: number;
  name: string;
};

type Props = {
  departments:
    Department[];

  currentDepartmentId:
    number;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function DepartmentInspectionSelect({
  departments,
  currentDepartmentId,
}: Props) {
  const router =
    useRouter();

  const options =
    departments.map(
      (
        department
      ) => ({
        value:
          String(
            department.id
          ),

        label:
          department.name,
      })
    );

  return (
    <AppSearchableSelect
      id="inspection-department"
      value={String(
        currentDepartmentId
      )}
      options={
        options
      }
      placeholder="เลือกกลุ่มงาน"
      searchPlaceholder="พิมพ์ชื่อกลุ่มงานเพื่อค้นหา..."
      emptyText="ไม่พบกลุ่มงาน"
      onChange={(
        value
      ) => {
        const departmentId =
          Number(
            value
          );

        if (
          !Number.isInteger(
            departmentId
          ) ||
          departmentId <= 0
        ) {
          return;
        }

        if (
          departmentId ===
          currentDepartmentId
        ) {
          return;
        }

        router.push(
          `/assets/${departmentId}/inspection`
        );
      }}
    />
  );
}