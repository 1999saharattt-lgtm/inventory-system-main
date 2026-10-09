import { prisma } from "@/lib/prisma";

import { notFound } from "next/navigation";



import AppPage from "@/components/AppPage";

import AppPageHeader from "@/components/AppPageHeader";

import AppButton from "@/components/AppButton";



import InspectionHistoryView from "./InspectionHistoryView";



/* =========================================================

   FORCE FRESH DATA

\========================================================= */



export const dynamic = "force-dynamic";

export const revalidate = 0;



/* =========================================================

   TYPES

\========================================================= */



type PageProps = {

  params: Promise<{ fiscalYear: string }>;

};



type ThailandDateParts = {

  year: number;

  month: number;

  day: number;

};



type FiscalYearRange = {

  startDate: Date;

  endDate: Date;

};



type MaterialRow = {

  materialId: number;



  code: string;

  name: string;

  unit: string;

  category: string;



  openingBalance: number;

  receiveQty: number;

  issueQty: number;

  closingBalance: number;

};



/* =========================================================

   CONSTANT

\========================================================= */



const BASE_FISCAL_YEAR = 2569;

const MAX_FISCAL_YEAR = 3000;



const CATEGORY_ORDER = [

  "OFFICE",

  "COMPUTER",

  "ELECTRIC",

  "HOUSEHOLD",

  "VEHICLE",

  "PRINTING",

];



/* =========================================================

   DOCUMENT TYPE



   กติกาตามหน้า Stock Card



   ยอดยกเข้าระบบ

   -> OPENING



   ร.xxx

   -> RECEIVE



   จ.xxx

   -> ISSUE

\========================================================= */



const OPENING_DOCUMENT =

  "ยอดยกเข้าระบบ";



const RECEIVE_DOCUMENT_PREFIX =

  "ร.";



const ISSUE_DOCUMENT_PREFIX =

  "จ.";



/* =========================================================

   THAILAND DATE PARTS

\========================================================= */



function getThailandDateParts(

  value: Date

): ThailandDateParts {

  const formatter =

    new Intl.DateTimeFormat(

      "en-US",

      {

        timeZone: "Asia/Bangkok",

        year: "numeric",

        month: "2-digit",

        day: "2-digit",

      }

    );



  const parts =

    formatter.formatToParts(

      value

    );



  return {

    year: Number(

      parts.find(

        (part) =>

          part.type === "year"

      )?.value

    ),



    month: Number(

      parts.find(

        (part) =>

          part.type === "month"

      )?.value

    ),



    day: Number(

      parts.find(

        (part) =>

          part.type === "day"

      )?.value

    ),

  };

}



/* =========================================================

   CURRENT FISCAL YEAR

\========================================================= */



function getCurrentFiscalYearThai(

  value: Date = new Date()

) {

  const parts =

    getThailandDateParts(

      value

    );



  const fiscalYearGregorian =

    parts.month >= 10

      ? parts.year + 1

      : parts.year;



  return (

    fiscalYearGregorian +

    543

  );

}



/* =========================================================

   CURRENT DATE - END EXCLUSIVE

\========================================================= */



function getCurrentThailandEndExclusive() {

  const parts =

    getThailandDateParts(

      new Date()

    );



  return new Date(

    Date.UTC(

      parts.year,

      parts.month - 1,

      parts.day + 1,

      0,

      0,

      0,

      0

    )

  );

}



/* =========================================================

   FISCAL YEAR RANGE



   FY2569

   =

   01 ต.ค. 2568

   ถึงก่อน

   01 ต.ค. 2569

\========================================================= */



function getFiscalYearRange(

  fiscalYearThai: number

): FiscalYearRange {

  const fiscalYearGregorian =

    fiscalYearThai - 543;



  return {

    startDate:

      new Date(

        Date.UTC(

          fiscalYearGregorian - 1,

          9,

          1,

          0,

          0,

          0,

          0

        )

      ),



    endDate:

      new Date(

        Date.UTC(

          fiscalYearGregorian,

          9,

          1,

          0,

          0,

          0,

          0

        )

      ),

  };

}



/* =========================================================

   SHORT YEAR

\========================================================= */



function getShortYear(

  buddhistYear: number

) {

  return String(

    buddhistYear % 100

  ).padStart(

    2,

    "0"

  );

}



/* =========================================================

   SAFE NUMBER

\========================================================= */



function safeNumber(

  value: unknown

) {

  const number =

    Number(

      value ?? 0

    );



  return Number.isFinite(

    number

  )

    ? number

    : 0;

}



/* =========================================================

   NORMALIZE DOCUMENT NO



   รองรับช่องว่างหน้า/หลัง

\========================================================= */



function normalizeDocumentNo(

  value:

    | string

    | null

    | undefined

) {

  return String(

    value ?? ""

  )

    .trim()

    .replace(/\s+/g, "");

}



/* =========================================================

   DOCUMENT CHECK

\========================================================= */



function isOpeningDocument(

  documentNo:

    | string

    | null

    | undefined

) {

  return (

    normalizeDocumentNo(

      documentNo

    ) ===

    normalizeDocumentNo(

      OPENING_DOCUMENT

    )

  );

}



function isReceiveDocument(

  documentNo:

    | string

    | null

    | undefined

) {

  const value =

    normalizeDocumentNo(

      documentNo

    );



  return value.startsWith(

    RECEIVE_DOCUMENT_PREFIX

  );

}



function isIssueDocument(

  documentNo:

    | string

    | null

    | undefined

) {

  const value =

    normalizeDocumentNo(

      documentNo

    );



  return value.startsWith(

    ISSUE_DOCUMENT_PREFIX

  );

}



/* =========================================================

   DATE RANGE

\========================================================= */



function isDateInRange(

  value: Date,

  startDate: Date,

  endDate: Date

) {

  const time =

    new Date(

      value

    ).getTime();



  return (

    time >=

      startDate.getTime() &&

    time <

      endDate.getTime()

  );

}



/* =========================================================

   ACTUAL ISSUE QTY



   issuedQty มีค่า

   -> ใช้ issuedQty



   issuedQty = 0

   -> ใช้ 0 จริง



   fallback qty

   เฉพาะ null / undefined

\========================================================= */



function getActualIssuedQty(

  item: {

    qty:

      | number

      | null

      | undefined;



    issuedQty:

      | number

      | null

      | undefined;

  }

) {

  if (

    item.issuedQty !== null &&

    item.issuedQty !== undefined

  ) {

    return safeNumber(

      item.issuedQty

    );

  }



  return safeNumber(

    item.qty

  );

}



/* =========================================================

   SORT MATERIAL

\========================================================= */



function sortMaterialRows(

  rows: MaterialRow[]

) {

  return [

    ...rows,

  ].sort(

    (

      a,

      b

    ) => {

      const indexA =

        CATEGORY_ORDER.indexOf(

          a.category

        );



      const indexB =

        CATEGORY_ORDER.indexOf(

          b.category

        );



      const orderA =

        indexA >= 0

          ? indexA

          : Number.MAX_SAFE_INTEGER;



      const orderB =

        indexB >= 0

          ? indexB

          : Number.MAX_SAFE_INTEGER;



      if (

        orderA !== orderB

      ) {

        return (

          orderA -

          orderB

        );

      }



      return a.code.localeCompare(

        b.code,

        "th",

        {

          numeric: true,

          sensitivity: "base",

        }

      );

    }

  );

}



/* =========================================================

   PAGE

\========================================================= */



export default async function StockCardInspectionPage({

  params,

}: PageProps) {

  const query = await params;



  /* =======================================================

     FISCAL YEAR

  ======================================================= */



  const currentFiscalYear =

    getCurrentFiscalYearThai();



  const requestedFiscalYear =

    Number(

      query.fiscalYear

    );



  const fiscalYear =

    Number.isInteger(

      requestedFiscalYear

    ) &&

    requestedFiscalYear >=

      BASE_FISCAL_YEAR &&

    requestedFiscalYear <=

      MAX_FISCAL_YEAR

      ? requestedFiscalYear

      : currentFiscalYear;



  const fiscalRange =

    getFiscalYearRange(

      fiscalYear

    );



  /* =======================================================

     CURRENT END



     ใช้สำหรับคำนวณ

     "คงเหลือปัจจุบัน"

  ======================================================= */



  const todayEndExclusive =

    getCurrentThailandEndExclusive();



  const currentEndExclusive =

    todayEndExclusive.getTime() <

    fiscalRange.endDate.getTime()

      ? todayEndExclusive

      : fiscalRange.endDate;



  /* =======================================================

     LABEL

  ======================================================= */



  const startShortYear =

    getShortYear(

      fiscalYear - 1

    );



  const endShortYear =

    getShortYear(

      fiscalYear

    );



  /* =======================================================

     EXISTING INSPECTION

  ======================================================= */



  const inspection = await prisma.stockCardInspection.findUnique({
    where: { fiscalYear },
    include: { rows: true },
  });
  if (!inspection) notFound();

  /* =======================================================

     LOAD MATERIAL + DOCUMENT



     รอบนี้จำแนกจาก "เลขที่เอกสาร"



     OPENING

     = ยอดยกเข้าระบบ



     RECEIVE

     = ร.xxx



     ISSUE

     = จ.xxx

  ======================================================= */



  const [

    materials,

    officers,

  ] =

    await Promise.all([

      prisma.material.findMany({

        select: {

          id: true,

          code: true,

          name: true,

          unit: true,

          category: true,



          /* =============================================

             RECEIVE DOCUMENTS



             โหลดถึงสิ้น FY

             แล้วคัดตาม documentNo ภายหลัง

          ============================================= */



          receiveItems: {

            where: {

              receive: {

                receiveDate: {

                  lt:

                    fiscalRange.endDate,

                },

              },

            },



            select: {

              id: true,

              qty: true,



              receive: {

                select: {

                  receiveDate:

                    true,



                  documentNo:

                    true,

                },

              },

            },



            orderBy: [

              {

                receive: {

                  receiveDate:

                    "asc",

                },

              },

              {

                id:

                  "asc",

              },

            ],

          },



          /* =============================================

             ISSUE DOCUMENTS



             เฉพาะ APPROVED

          ============================================= */



          issueItems: {

            where: {

              issue: {

                status:

                  "APPROVED",



                issueDate: {

                  lt:

                    fiscalRange.endDate,

                },

              },

            },



            select: {

              id: true,

              qty: true,

              issuedQty: true,



              issue: {

                select: {

                  issueDate:

                    true,



                  documentNo:

                    true,

                },

              },

            },



            orderBy: [

              {

                issue: {

                  issueDate:

                    "asc",

                },

              },

              {

                id:

                  "asc",

              },

            ],

          },

        },



        orderBy: {

          code:

            "asc",

        },

      }),



      prisma.officer.findMany({

        select: {

          id: true,



          firstName: true,

          lastName: true,

          position: true,



          type: true,



          departmentId: true,

          sectionId: true,



          department: {

            select: {

              id: true,

              name: true,

            },

          },



          section: {

            select: {

              id: true,

              name: true,

            },

          },

        },



        orderBy: {

          id:

            "asc",

        },

      }),

    ]);



  /* =======================================================

     BUILD INSPECTION ROWS



     *** กติกาใหม่ตามที่กำหนด ***



     1. คงเหลือยอดยกมาเมื่อ 30 ก.ย.

        ดูเลขที่เอกสาร

        =

        "ยอดยกเข้าระบบ"



     2. รับ

        ดูเลขที่เอกสาร

        =

        "ร." ตามด้วยเลขเอกสาร



     3. จ่าย

        ดูเลขที่เอกสาร

        =

        "จ." ตามด้วยเลขเอกสาร



     4. คงเหลือปัจจุบัน

        =

        ยอดยกทั้งหมด

        + รับทั้งหมดถึงปัจจุบัน

        - จ่ายทั้งหมดถึงปัจจุบัน

  ======================================================= */



  const rows =

    sortMaterialRows(

      materials.filter((material) => {
        const name = material.name.trim();
        if (/\(\s*สสส\.\s*\)\s*$/u.test(name)) return false;
        if (material.category === "ELECTRIC") {
          if (material.code === "ELE-0003") return false;
          if (name.includes("ถ่านกระดุม")) return false;
        }
        return true;
      }).map(

        (

          material

        ): MaterialRow => {

          /* =============================================

             A. OPENING BALANCE



             เลขที่เอกสาร

             =

             "ยอดยกเข้าระบบ"



             รวมทุกรายการที่ตรงชื่อเอกสาร



             ไม่สนว่า Receive จริงถูกสร้าง

             ด้วยวิธีใดในอดีต

          ============================================= */



          const openingBalance =

            material.receiveItems

              .filter(

                (

                  item

                ) =>

                  isOpeningDocument(

                    item.receive

                      .documentNo

                  )

              )

              .reduce(

                (

                  total,

                  item

                ) =>

                  total +

                  safeNumber(

                    item.qty

                  ),

                0

              );



          /* =============================================

             B. RECEIVE



             เลขที่เอกสารต้องขึ้นต้นด้วย



             ร.



             เช่น

             ร.01/69

             ร.02/69

             ร.15/69



             และต้องอยู่ใน FY ที่เลือก

          ============================================= */



          const receiveQty =

            material.receiveItems

              .filter(

                (

                  item

                ) =>

                  isReceiveDocument(

                    item.receive

                      .documentNo

                  ) &&

                  isDateInRange(

                    item.receive

                      .receiveDate,

                    fiscalRange.startDate,

                    fiscalRange.endDate

                  )

              )

              .reduce(

                (

                  total,

                  item

                ) =>

                  total +

                  safeNumber(

                    item.qty

                  ),

                0

              );



          /* =============================================

             C. ISSUE



             เลขที่เอกสารต้องขึ้นต้นด้วย



             จ.



             เช่น

             จ.01/69

             จ.02/69

             จ.10/69



             และต้องอยู่ใน FY ที่เลือก



             query ด้านบนคัด APPROVED

             มาแล้ว

          ============================================= */



          const issueQty =

            material.issueItems

              .filter(

                (

                  item

                ) =>

                  isIssueDocument(

                    item.issue

                      .documentNo

                  ) &&

                  isDateInRange(

                    item.issue

                      .issueDate,

                    fiscalRange.startDate,

                    fiscalRange.endDate

                  )

              )

              .reduce(

                (

                  total,

                  item

                ) =>

                  total +

                  getActualIssuedQty({

                    qty:

                      item.qty,



                    issuedQty:

                      item.issuedQty,

                  }),

                0

              );



          /* =============================================

             D. RECEIVE ถึงปัจจุบัน



             ใช้เฉพาะเอกสาร ร.



             ไม่รวม

             "ยอดยกเข้าระบบ"

          ============================================= */



          const currentReceiveQty =

            material.receiveItems

              .filter(

                (

                  item

                ) =>

                  isReceiveDocument(

                    item.receive

                      .documentNo

                  ) &&

                  isDateInRange(

                    item.receive

                      .receiveDate,

                    fiscalRange.startDate,

                    currentEndExclusive

                  )

              )

              .reduce(

                (

                  total,

                  item

                ) =>

                  total +

                  safeNumber(

                    item.qty

                  ),

                0

              );



          /* =============================================

             E. ISSUE ถึงปัจจุบัน



             ใช้เฉพาะเอกสาร จ.

          ============================================= */



          const currentIssueQty =

            material.issueItems

              .filter(

                (

                  item

                ) =>

                  isIssueDocument(

                    item.issue

                      .documentNo

                  ) &&

                  isDateInRange(

                    item.issue

                      .issueDate,

                    fiscalRange.startDate,

                    currentEndExclusive

                  )

              )

              .reduce(

                (

                  total,

                  item

                ) =>

                  total +

                  getActualIssuedQty({

                    qty:

                      item.qty,



                    issuedQty:

                      item.issuedQty,

                  }),

                0

              );



          /* =============================================

             F. CURRENT BALANCE



             คงเหลือปัจจุบัน

             =

             ยอดยกเข้าระบบทั้งหมด

             +

             เอกสาร ร. ทั้งหมด

             -

             เอกสาร จ. ทั้งหมด



             ตัวอย่าง



             ยอดยก = 150

             รับ ร. = 435

             จ่าย จ. = 310



             150 + 435 - 310

             =

             275

          ============================================= */



          const closingBalance =

            openingBalance +

            currentReceiveQty -

            currentIssueQty;



          return {

            materialId:

              material.id,



            code:

              material.code,



            name:

              material.name,



            unit:

              material.category === "ELECTRIC" &&
              material.name.trim() === "ถ่านชาร์จ ขนาด AAA (Rechargeable Battery)"
                ? "แพ็ค"
                : material.unit,



            category:

              String(

                material.category

              ),



            openingBalance,



            receiveQty,



            issueQty,



            closingBalance,

          };

        }

      )

    );



  const savedRows = new Map(inspection.rows.map((row) => [row.materialId, row]));
  const rawInspectorIds: unknown = inspection.inspectorIds;
  let inspectorIds: number[] = [];
  if (Array.isArray(rawInspectorIds)) {
    inspectorIds = rawInspectorIds.map(Number).filter((id) => Number.isInteger(id) && id > 0);
  } else if (typeof rawInspectorIds === "string") {
    try {
      const parsed: unknown = JSON.parse(rawInspectorIds);
      if (Array.isArray(parsed)) inspectorIds = parsed.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    } catch {
      inspectorIds = rawInspectorIds.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0);
    }
  }
  const rawNames: unknown = inspection.inspectorNames;
  let inspectorNames: string[] = [];
  if (Array.isArray(rawNames)) inspectorNames = rawNames.map(String);
  else if (typeof rawNames === "string") {
    try {
      const parsed: unknown = JSON.parse(rawNames);
      inspectorNames = Array.isArray(parsed) ? parsed.map(String) : rawNames.split(",");
    } catch { inspectorNames = rawNames.split(","); }
  }
  const officerMap = new Map(officers.map((officer) => [officer.id, officer]));
  const displayOfficers = inspectorIds.map((id, index) => {
    const current = officerMap.get(id);
    return {
      id,
      firstName: inspectorNames[index]?.trim() || current?.firstName || "-",
      lastName: inspectorNames[index]?.trim() ? "" : current?.lastName || "",
      position: current?.position || "-",
      type: current?.type || "",
      departmentId: current?.departmentId ?? null,
      sectionId: current?.sectionId ?? null,
      department: current?.department ?? null,
      section: current?.section ?? null,
    };
  });
  const toDateOnly = (date: Date | null | undefined) => date ? new Date(date).toISOString().slice(0, 10) : "";
  const historyRows = rows.map((material) => {
    const saved = savedRows.get(material.materialId);
    const numberText = (value: number | null | undefined) => value == null ? "" : String(value);
    return {
      materialId: material.materialId,
      accuracy: saved?.accuracy || "",
      shortageQty: numberText(saved?.shortageQty),
      excessQty: numberText(saved?.excessQty),
      baht: numberText(saved?.baht),
      satang: numberText(saved?.satang),
      damagedQty: numberText(saved?.damagedQty),
      deterioratedQty: numberText(saved?.deterioratedQty),
      unnecessaryQty: numberText(saved?.unnecessaryQty),
      remark: saved?.remark || "",
    };
  });
  return (
    <AppPage>
      <AppPageHeader
        icon="📋"
        title="รายละเอียดการตรวจสอบบัญชีพัสดุประจำปี"
        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}
        actions={<AppButton href={`/stock-card/inspection-history?fiscalYear=${fiscalYear}`} variant="back" size="md">← กลับ</AppButton>}
      />
      <InspectionHistoryView
        fiscalYear={fiscalYear}
        startShortYear={startShortYear}
        endShortYear={endShortYear}
        materials={rows}
        rows={historyRows}
        officers={displayOfficers}
        inspectorIds={inspectorIds.map(String)}
        inspectionStartDate={toDateOnly(inspection.inspectionDate)}
        inspectionEndDate={toDateOnly(inspection.inspectionEndDate)}
      />
    </AppPage>
  );
}
