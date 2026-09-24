"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

/* =========================================================
   TYPES
========================================================= */

type Category = {
  code: string;
  name: string;
  icon: string;
};

/* =========================================================
   CATEGORIES
========================================================= */

const categories: Category[] = [
  {
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
    icon: "📄",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
    icon: "💻",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
    icon: "⚡",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
    icon: "🏠",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
    icon: "🚗",
  },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
    icon: "📰",
  },
];

/* =========================================================
   PDF URLS
========================================================= */

const QR_PDF_URL =
  "/materials/qr/pdf";

const MATERIALS_PDF_URL =
  "/materials/export/pdf";

/* =========================================================
   PAGE
========================================================= */

export default function MaterialsPage() {
  /* =======================================================
     PDF CACHE

     เก็บ Object URL ของ PDF ที่เตรียมไว้แล้ว
     ทำให้เมื่อกดเปิด PDF ไม่ต้องรอสร้างใหม่อีกครั้ง
  ======================================================= */

  const pdfCacheRef =
    useRef<
      Map<string, string>
    >(new Map());

  const pdfRequestRef =
    useRef<
      Map<
        string,
        Promise<string | null>
      >
    >(new Map());

  /* =======================================================
     PRELOAD PDF
  ======================================================= */

  const preloadPdf =
    useCallback(
      async (
        url: string
      ): Promise<
        string | null
      > => {
        /*
         * มี PDF อยู่ใน cache แล้ว
         */

        const cachedUrl =
          pdfCacheRef.current.get(
            url
          );

        if (cachedUrl) {
          return cachedUrl;
        }

        /*
         * กำลังโหลดอยู่แล้ว
         * ใช้ Promise เดิม
         */

        const existingRequest =
          pdfRequestRef.current.get(
            url
          );

        if (existingRequest) {
          return existingRequest;
        }

        /*
         * เริ่มโหลด PDF
         */

        const request =
          (async () => {
            try {
              const response =
                await fetch(
                  url,
                  {
                    method:
                      "GET",

                    credentials:
                      "same-origin",
                  }
                );

              if (
                !response.ok
              ) {
                return null;
              }

              const blob =
                await response.blob();

              /*
               * ตรวจสอบว่าเป็นข้อมูลจริง
               */

              if (
                blob.size === 0
              ) {
                return null;
              }

              const objectUrl =
                URL.createObjectURL(
                  blob
                );

              pdfCacheRef.current.set(
                url,
                objectUrl
              );

              return objectUrl;
            } catch (error) {
              console.error(
                "ไม่สามารถเตรียม PDF ล่วงหน้าได้:",
                error
              );

              return null;
            } finally {
              pdfRequestRef.current.delete(
                url
              );
            }
          })();

        pdfRequestRef.current.set(
          url,
          request
        );

        return request;
      },
      []
    );

  /* =======================================================
     PRELOAD PDF AFTER PAGE LOAD

     รอหน้าแสดงผลก่อนเล็กน้อย
     แล้วจึงเตรียม PDF อยู่เบื้องหลัง

     ผู้ใช้จึงสามารถกดเปิดได้เร็วขึ้น
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void preloadPdf(
            MATERIALS_PDF_URL
          );

          void preloadPdf(
            QR_PDF_URL
          );
        },
        300
      );

    /*
     * ตอนออกจากหน้า
     * ล้าง Object URL ที่สร้างไว้
     */

    return () => {
      window.clearTimeout(
        timer
      );

      for (
        const objectUrl of pdfCacheRef.current.values()
      ) {
        URL.revokeObjectURL(
          objectUrl
        );
      }

      pdfCacheRef.current.clear();
      pdfRequestRef.current.clear();
    };
  }, [preloadPdf]);

  /* =======================================================
     OPEN PDF

     ถ้า preload เสร็จแล้ว
     -> เปิด Blob ทันที

     ถ้ายังไม่เสร็จ
     -> เปิด URL จริงทันทีเหมือนเดิม
     -> ไม่ทำให้ผู้ใช้ต้องรอ Promise
  ======================================================= */

  const openPdf =
    useCallback(
      (
        url: string
      ) => {
        const cachedUrl =
          pdfCacheRef.current.get(
            url
          );

        if (cachedUrl) {
          window.open(
            cachedUrl,
            "_blank",
            "noopener,noreferrer"
          );

          return;
        }

        /*
         * PDF ยังเตรียมไม่เสร็จ
         * เปิด Route จริงทันที
         */

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      },
      []
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle="เลือกหมวดหมู่เพื่อดูและจัดการข้อมูลพัสดุ"
        actions={
          <>
            {/* ===============================================
                QR CODE PDF
            =============================================== */}

            <AppButton
              type="button"
              variant="primary"
              size="md"
              onClick={() =>
                openPdf(
                  QR_PDF_URL
                )
              }
              icon={
                <span
                  aria-hidden="true"
                >
                  📱
                </span>
              }
            >
              QR Code รวม
            </AppButton>

            {/* ===============================================
                MATERIALS PDF

                เปลี่ยนจาก secondary
                เป็น primary

                ผล:
                สีเขียวกรมอนามัยตาม AppButton กลาง
            =============================================== */}

            <AppButton
              type="button"
              variant="primary"
              size="md"
              onClick={() =>
                openPdf(
                  MATERIALS_PDF_URL
                )
              }
              icon={
                <span
                  aria-hidden="true"
                >
                  📋
                </span>
              }
            >
              รวมรายการพัสดุ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          CATEGORY GRID
      ===================================================== */}

      <section
        className="
          grid
          w-full
          min-w-0

          grid-cols-1

          gap-4

          sm:grid-cols-2

          xl:grid-cols-3
        "
      >
        {categories.map(
          (
            category
          ) => (
            <AppCard
              key={
                category.code
              }
              className="
                flex
                min-h-[190px]
                min-w-0

                flex-col

                items-center
                justify-center

                text-center

                sm:min-h-[210px]

                xl:min-h-[230px]
              "
            >
              {/* ===============================================
                  ICON
              =============================================== */}

              <div
                className="
                  flex
                  w-full

                  items-center
                  justify-center

                  text-center
                "
              >
                <div
                  className="
                    grid
                    h-14
                    w-14
                    shrink-0

                    place-items-center

                    text-center

                    sm:h-16
                    sm:w-16
                  "
                  aria-hidden="true"
                >
                  <span
                    className="
                      block

                      text-center

                      text-3xl
                      leading-none
                    "
                  >
                    {
                      category.icon
                    }
                  </span>
                </div>
              </div>

              {/* ===============================================
                  INFORMATION
              =============================================== */}

              <div
                className="
                  mt-3

                  w-full
                  min-w-0

                  text-center

                  sm:mt-4
                "
              >
                <h2
                  className="
                    w-full

                    whitespace-nowrap

                    text-center

                    text-lg
                    font-extrabold

                    !text-slate-900

                    sm:text-xl
                  "
                >
                  {
                    category.name
                  }
                </h2>

                <p
                  className="
                    mt-2

                    w-full

                    text-center

                    text-sm
                    font-semibold

                    !text-slate-500
                  "
                >
                  ดูและจัดการข้อมูลพัสดุในหมวดหมู่นี้
                </p>
              </div>

              {/* ===============================================
                  ACTION
              =============================================== */}

              <div
                className="
                  mt-4

                  flex
                  w-full

                  items-center
                  justify-center

                  sm:mt-5
                "
              >
                <AppButton
                  href={`/materials/category/${category.code}`}
                  variant="primary"
                  size="md"
                >
                  เปิด
                </AppButton>
              </div>
            </AppCard>
          )
        )}
      </section>
    </AppPage>
  );
}