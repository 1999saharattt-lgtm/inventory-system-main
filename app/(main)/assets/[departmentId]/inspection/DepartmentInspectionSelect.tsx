"use client";

import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

type Department = {
  id: number;
  name: string;
};

type Props = {
  departments: Department[];
  currentDepartmentId: number;
};

export default function DepartmentInspectionSelect({
  departments,
  currentDepartmentId,
}: Props) {
  const router =
    useRouter();

  const [
    selectedDepartmentId,
    setSelectedDepartmentId,
  ] = useState(
    String(
      currentDepartmentId
    )
  );

  const [
    isChanging,
    setIsChanging,
  ] = useState(false);

  function handleChange(
    departmentId: string
  ) {
    if (!departmentId) {
      return;
    }

    setSelectedDepartmentId(
      departmentId
    );

    if (
      departmentId ===
      String(
        currentDepartmentId
      )
    ) {
      return;
    }

    setIsChanging(true);

    router.push(
      `/assets/${departmentId}/inspection`
    );
  }

  return (
    <div className="relative w-full">
      <select
        value={
          selectedDepartmentId
        }
        disabled={
          isChanging
        }
        onChange={(e) =>
          handleChange(
            e.target.value
          )
        }
        className="
          h-11
          w-full
          cursor-pointer
          appearance-none
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          pr-11
          text-sm
          font-extrabold
          text-slate-900
          shadow-lg
          outline-none
          transition
          hover:bg-slate-50
          focus:border-emerald-500
          focus:ring-2
          focus:ring-emerald-300
          disabled:cursor-wait
          disabled:opacity-70
          sm:text-base
        "
      >
        {departments.map(
          (department) => (
            <option
              key={
                department.id
              }
              value={
                department.id
              }
            >
              {department.name}
            </option>
          )
        )}
      </select>

      {/* ลูกศร Dropdown */}

      <div
        className="
          pointer-events-none
          absolute
          inset-y-0
          right-4
          flex
          items-center
          text-slate-600
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {isChanging && (
        <div
          className="
            mt-1
            text-xs
            font-semibold
            !text-slate-300
          "
        >
          กำลังโหลดข้อมูลกลุ่ม...
        </div>
      )}
    </div>
  );
}