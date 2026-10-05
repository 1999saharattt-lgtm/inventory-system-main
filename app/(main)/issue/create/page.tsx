import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import {
  verifySession,
  type SessionUser,
} from "@/lib/session";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

import IssueForm from "./IssueForm";

/* =========================================================
   FORCE FRESH DATA

   เลขที่เอกสารต้องคำนวณใหม่ทุกครั้งที่เปิดหน้า
========================================================= */

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

/* =========================================================
   TYPES
========================================================= */

type ThailandDateParts = {
  year: number;
  month: number;
  day: number;
};

type FiscalYearInfo = {
  fiscalYearGregorian: number;
  fiscalYearThai: number;
  fiscalYearThaiShort: string;

  startDate: Date;
  endDate: Date;
};

/* =========================================================
   THAILAND DATE PARTS

   Vercel อาจทำงานด้วย UTC
   จึงต้องอ่านวันที่ปัจจุบันด้วย timezone Asia/Bangkok
========================================================= */

function getThailandDateParts(
  value: Date
): ThailandDateParts {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      value
    );

  const year =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "month"
      )?.value
    );

  const day =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "day"
      )?.value
    );

  return {
    year,
    month,
    day,
  };
}

/* =========================================================
   FISCAL YEAR

   ปีงบประมาณไทย:
   1 ต.ค. - 30 ก.ย.

   ตัวอย่าง

   30 ก.ย. 2569
   => FY 2569

   1 ต.ค. 2569
   => FY 2570
========================================================= */

function getFiscalYearInfo(
  value: Date = new Date()
): FiscalYearInfo {
  const thailand =
    getThailandDateParts(
      value
    );

  /*
   * เดือน ต.ค.-ธ.ค.
   * ปีงบประมาณเป็นปีถัดไป
   *
   * เดือน ม.ค.-ก.ย.
   * ปีงบประมาณเป็นปีปัจจุบัน
   */

  const fiscalYearGregorian =
    thailand.month >= 10
      ? thailand.year + 1
      : thailand.year;

  const fiscalYearThai =
    fiscalYearGregorian +
    543;

  const fiscalYearThaiShort =
    String(
      fiscalYearThai
    ).slice(
      -2
    );

  /*
   * ตัวอย่าง FY 2570
   *
   * เริ่ม:
   * 1 ต.ค. 2569
   * = 1 ต.ค. 2026 00:00 Asia/Bangkok
   *
   * สิ้นสุดแบบ exclusive:
   * 1 ต.ค. 2570
   * = 1 ต.ค. 2027 00:00 Asia/Bangkok
   *
   * เวลาไทย 00:00
   * = UTC 17:00 ของวันก่อนหน้า
   */

  const startDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian -
          1,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  const endDate =
    new Date(
      Date.UTC(
        fiscalYearGregorian,
        8,
        30,
        17,
        0,
        0,
        0
      )
    );

  return {
    fiscalYearGregorian,
    fiscalYearThai,
    fiscalYearThaiShort,

    startDate,
    endDate,
  };
}

/* =========================================================
   GENERATE ISSUE DOCUMENT NUMBER

   รูปแบบเดิม:
   จ.01/70

   กติกาใหม่:
   - แบ่งตามปีงบประมาณ
   - 1 ต.ค. เริ่มเลข 01 ใหม่
   - ใช้ issueDate ของข้อมูลจริงในการแบ่งปี
   - ไม่เปลี่ยนเลขเอกสารเก่าย้อนหลัง
========================================================= */

async function generateIssueNo() {
  const fiscal =
    getFiscalYearInfo();

  /* =======================================================
     LOAD CURRENT FISCAL YEAR

     จำกัด query เฉพาะเอกสารเบิกจ่าย
     ที่อยู่ในปีงบประมาณปัจจุบัน
  ======================================================= */

  const issues =
    await prisma.issue.findMany({
      where: {
        issueDate: {
          gte:
            fiscal.startDate,

          lt:
            fiscal.endDate,
        },

        documentNo: {
          startsWith:
            "จ.",
        },
      },

      select: {
        documentNo:
          true,
      },
    });

  /* =======================================================
     FIND HIGHEST RUNNING NUMBER

     รองรับเลขเก่า:
     จ.1/70
     จ.01/70
     จ.001/70
     จ.01/2570
  ======================================================= */

  let maxRunning =
    0;

  for (
    const issue of
      issues
  ) {
    const documentNo =
      String(
        issue.documentNo ??
          ""
      ).trim();

    const match =
      documentNo.match(
        /^จ\.(\d+)\/(\d{2}|\d{4})$/
      );

    if (!match) {
      continue;
    }

    const running =
      Number(
        match[1]
      );

    if (
      !Number.isInteger(
        running
      ) ||
      running <= 0
    ) {
      continue;
    }

    if (
      running >
      maxRunning
    ) {
      maxRunning =
        running;
    }
  }

  /* =======================================================
     NEXT
  ======================================================= */

  const nextRunning =
    maxRunning + 1;

  return `จ.${String(
    nextRunning
  ).padStart(
    2,
    "0"
  )}/${fiscal.fiscalYearThaiShort}`;
}

/* =========================================================
   PAGE
========================================================= */

export default async function CreateIssuePage() {
  /* =======================================================
     FISCAL YEAR
  ======================================================= */

  const fiscal =
    getFiscalYearInfo();

  /* =======================================================
     SESSION
  ======================================================= */

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "session"
    )?.value;

  let session:
    | SessionUser
    | null = null;

  if (token) {
    try {
      session =
        await verifySession(
          token
        );
    } catch {
      session =
        null;
    }
  }

  /* =======================================================
     USER DEPARTMENT
  ======================================================= */

  let userDepartmentId =
    session?.departmentId ??
    null;

  /*
   * USER
   * ต้องใช้กลุ่มงานของตัวเอง
   *
   * ถ้า Session ไม่มี departmentId
   * ให้ตรวจจากฐานข้อมูลอีกครั้ง
   */

  if (
    session &&
    session.role !==
      "ADMIN" &&
    !userDepartmentId
  ) {
    const currentUser =
      await prisma.user.findUnique({
        where: {
          id:
            session.id,
        },

        select: {
          departmentId:
            true,
        },
      });

    userDepartmentId =
      currentUser
        ?.departmentId ??
      null;
  }

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const [
    materials,
    receiveLots,
    departments,
    officers,
    documentNo,
  ] =
    await Promise.all([
      /* =====================================================
         MATERIALS
      ===================================================== */

      prisma.material.findMany({
        orderBy: [
          {
            category:
              "asc",
          },
          {
            code:
              "asc",
          },
        ],
      }),

      /* =====================================================
         RECEIVE LOTS

         ใช้เฉพาะล็อตที่ยังมีคงเหลือ
      ===================================================== */

      prisma.receiveItem.findMany({
        where: {
          balance: {
            gt:
              0,
          },
        },

        select: {
          id:
            true,

          materialId:
            true,

          balance:
            true,

          manufacture:
            true,

          expiry:
            true,
        },

        orderBy: [
          {
            expiry:
              "asc",
          },

          {
            manufacture:
              "asc",
          },

          {
            id:
              "asc",
          },
        ],
      }),

      /* =====================================================
         DEPARTMENTS

         ADMIN
         - เห็นทั้งหมด
         - เปลี่ยนได้

         USER
         - เห็นเฉพาะกลุ่มตัวเอง
      ===================================================== */

      prisma.department.findMany({
        where:
          session?.role ===
          "ADMIN"
            ? undefined
            : userDepartmentId
              ? {
                  id:
                    userDepartmentId,
                }
              : {
                  id:
                    -1,
                },

        orderBy: {
          name:
            "asc",
        },
      }),

      /* =====================================================
         OFFICERS
      ===================================================== */

      prisma.officer.findMany({
        where:
          session?.role ===
          "ADMIN"
            ? undefined
            : userDepartmentId
              ? {
                  OR: [
                    {
                      departmentId:
                        userDepartmentId,
                    },
                    {
                      section: {
                        departmentId:
                          userDepartmentId,
                      },
                    },
                  ],
                }
              : {
                  id:
                    -1,
                },

        include: {
          section:
            true,

          department:
            true,
        },

        orderBy: [
          {
            firstName:
              "asc",
          },
          {
            lastName:
              "asc",
          },
        ],
      }),

      /* =====================================================
         DOCUMENT NUMBER
      ===================================================== */

      generateIssueNo(),
    ]);

  /* =========================================================
     INITIAL DEPARTMENT
  ========================================================= */

  const initialDepartmentId =
    session?.role ===
    "ADMIN"
      ? ""
      : userDepartmentId
        ? String(
            userDepartmentId
          )
        : "";

  /* =========================================================
     PERMISSION
  ========================================================= */

  const canChangeDepartment =
    session?.role ===
    "ADMIN";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📤"
        title="บันทึกการเบิกจ่ายพัสดุ"
        subtitle={`เพิ่มรายการเบิกจ่ายพัสดุออกจากระบบ • ปีงบประมาณ ${fiscal.fiscalYearThai}`}
        actions={
          <AppButton
            href="/issue"
            variant="back"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          ISSUE FORM CARD
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
          lg:p-6
        "
      >
        <div
          className="
            relative
            z-10

            w-full
            min-w-0

            overflow-visible
          "
        >
          <IssueForm
            departments={
              departments
            }
            officers={
              officers
            }
            materials={
              materials
            }
            receiveLots={
              receiveLots
            }
            documentNo={
              documentNo
            }
            initialDepartmentId={
              initialDepartmentId
            }
            canChangeDepartment={
              canChangeDepartment
            }
          />
        </div>
      </AppCard>
    </AppPage>
  );
}