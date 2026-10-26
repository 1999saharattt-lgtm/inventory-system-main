
"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";

type Category = {
  code: string;
  name: string;
  icon: string;
};

const BASE_FISCAL_YEAR = 2569;
const MAX_FISCAL_YEAR = 3000;

const categories: Category[] = [
  {
    code: "materials",
    name: "บัญชีพัสดุประจำปี",
    icon: "📋",
  },
  {
    code: "assets",
    name: "ครุภัณฑ์ประจำปี",
    icon: "🖥️",
  },
];

function getCurrentFiscalYearThai(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
  });

  const parts = formatter.formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  return (month >= 10 ? year + 1 : year) + 543;
}

function getAvailableFiscalYears(
  currentFiscalYear: number,
  selectedFiscalYear: number
): number[] {
  const highestFiscalYear = Math.max(
    currentFiscalYear,
    selectedFiscalYear,
    BASE_FISCAL_YEAR
  );

  const years: number[] = [];

  for (
    let year = highestFiscalYear;
    year >= BASE_FISCAL_YEAR;
    year--
  ) {
    years.push(year);
  }

  return years;
}

export default function InspectionHistoryHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isChangingYear, startTransition] = useTransition();

  const currentFiscalYear = getCurrentFiscalYearThai();

  const requestedFiscalYear = Number(
    searchParams.get("fiscalYear")
  );

  const selectedFiscalYear =
    Number.isInteger(requestedFiscalYear) &&
    requestedFiscalYear >= BASE_FISCAL_YEAR &&
    requestedFiscalYear <= MAX_FISCAL_YEAR
      ? requestedFiscalYear
      : currentFiscalYear;

  const availableFiscalYears = useMemo(
    () =>
      getAvailableFiscalYears(
        currentFiscalYear,
        selectedFiscalYear
      ),
    [currentFiscalYear, selectedFiscalYear]
  );

  function handleFiscalYearChange(value: string) {
    const nextFiscalYear = Number(value);

    if (
      !Number.isInteger(nextFiscalYear) ||
      nextFiscalYear < BASE_FISCAL_YEAR ||
      nextFiscalYear > MAX_FISCAL_YEAR ||
      nextFiscalYear === selectedFiscalYear
    ) {
      return;
    }

    startTransition(() => {
      router.push(
        `/stock-card/inspection-history?fiscalYear=${nextFiscalYear}`
      );
    });
  }

  return (
    <AppPage>
      <AppCard
        icon={<span aria-hidden="true">🗂️</span>}
        title="ประวัติการตรวจสอบ"
        subtitle="เลือกปีงบประมาณและประเภทบัญชีเพื่อดูประวัติการตรวจสอบ"
        className="
          w-full
          min-w-0
          !overflow-visible
          [&_h2]:!text-[18px]
          sm:[&_h2]:!text-[20px]
          [&_h2]:!leading-tight
          [&_h2+p]:!text-[12px]
          sm:[&_h2+p]:!text-[13px]
        "
      >
        <div className="w-full min-w-0 sm:max-w-[300px]">
          <label
            htmlFor="fiscalYear"
            className="
              mb-2
              block
              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            ปีงบประมาณ
          </label>

          <div className="relative w-full">
            <select
              id="fiscalYear"
              name="fiscalYear"
              value={String(selectedFiscalYear)}
              disabled={isChangingYear}
              onChange={(event) =>
                handleFiscalYearChange(event.target.value)
              }
              className="
                h-[50px]
                w-full
                cursor-pointer
                appearance-none
                rounded-[14px]
                border-2
                !border-black
                bg-white
                px-4
                pr-11
                text-base
                font-extrabold
                !text-slate-900
                shadow-sm
                outline-none
                transition-all
                duration-200
                focus:ring-4
                focus:ring-emerald-100/70
                disabled:cursor-wait
                disabled:bg-slate-50
                disabled:opacity-70
              "
            >
              {availableFiscalYears.map((year) => (
                <option key={year} value={year}>
                  ปีงบประมาณ {year}
                </option>
              ))}
            </select>

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                right-4
                flex
                items-center
                !text-slate-500
              "
            >
              <svg
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
          </div>

          {isChangingYear && (
            <p className="mt-2 text-xs font-semibold !text-emerald-600">
              กำลังเปลี่ยนปีงบประมาณ...
            </p>
          )}
        </div>
      </AppCard>

      <section
        className="
          grid
          w-full
          min-w-0
          grid-cols-1
          gap-4
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {categories.map((category) => (
          <AppCard
            key={category.code}
            className="
              flex
              min-h-[230px]
              min-w-0
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <div className="flex w-full items-center justify-center text-center">
              <div
                className="
                  grid
                  h-16
                  w-16
                  shrink-0
                  place-items-center
                  text-center
                "
                aria-hidden="true"
              >
                <span className="block text-center text-3xl leading-none">
                  {category.icon}
                </span>
              </div>
            </div>

            <div className="mt-4 w-full min-w-0 text-center">
              <h2
                className="
                  w-full
                  break-words
                  text-center
                  text-xl
                  font-extrabold
                  !text-slate-900
                "
              >
                {category.name}
              </h2>

              <p
                className="
                  mt-2
                  w-full
                  break-words
                  text-center
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                คลิกเพื่อดูประวัติการตรวจสอบ
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  font-bold
                  !text-slate-400
                "
              >
                ปีงบประมาณ {selectedFiscalYear}
              </p>
            </div>

            <div
              className="
                mt-5
                flex
                w-full
                items-center
                justify-center
              "
            >
              <AppButton
                href={`/stock-card/inspection-history/${category.code}?fiscalYear=${selectedFiscalYear}`}
                variant="primary"
                size="md"
              >
                เปิด
              </AppButton>
            </div>
          </AppCard>
        ))}
      </section>
    </AppPage>
  );
}
