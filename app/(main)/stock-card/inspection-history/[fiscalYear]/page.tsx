import { prisma } from "@/lib/prisma";

import { notFound } from "next/navigation";



import AppPage from "@/components/AppPage";

import AppPageHeader from "@/components/AppPageHeader";

import AppButton from "@/components/AppButton";



import InspectionHistoryView from "./InspectionHistoryView";



export const dynamic = "force-dynamic";

export const revalidate = 0;



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



const OPENING_DOCUMENT = "ยอดยกเข้าระบบ";

const RECEIVE_DOCUMENT_PREFIX = "ร.";

const ISSUE_DOCUMENT_PREFIX = "จ.";



function getThailandDateParts(value: Date): ThailandDateParts {

  const formatter = new Intl.DateTimeFormat("en-US", {

    timeZone: "Asia/Bangkok",

    year: "numeric",

    month: "2-digit",

    day: "2-digit",

  });



  const parts = formatter.formatToParts(value);



  return {

    year: Number(

      parts.find((part) => part.type === "year")?.value

    ),

    month: Number(

      parts.find((part) => part.type === "month")?.value

    ),

    day: Number(

      parts.find((part) => part.type === "day")?.value

    ),

  };

}



function getCurrentFiscalYearThai(

  value: Date = new Date()

) {

  const parts = getThailandDateParts(value);



  const fiscalYearGregorian =

    parts.month >= 10

      ? parts.year + 1

      : parts.year;



  return fiscalYearGregorian + 543;

}



function getCurrentThailandEndExclusive() {

  const parts = getThailandDateParts(new Date());



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



function getFiscalYearRange(

  fiscalYearThai: number

): FiscalYearRange {

  const fiscalYearGregorian =

    fiscalYearThai - 543;



  return {

    startDate: new Date(

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



    endDate: new Date(

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



function getShortYear(buddhistYear: number) {

  return String(buddhistYear % 100).padStart(2, "0");

}



function safeNumber(value: unknown) {

  const number = Number(value ?? 0);



  return Number.isFinite(number)

    ? number

    : 0;

}



function normalizeDocumentNo(

  value: string | null | undefined

) {

  return String(value ?? "")

    .trim()

    .replace(/\s+/g, "");

}



function isOpeningDocument(

  documentNo: string | null | undefined

) {

  return (

    normalizeDocumentNo(documentNo) ===

    normalizeDocumentNo(OPENING_DOCUMENT)

  );

}



function isReceiveDocument(

  documentNo: string | null | undefined

) {

  return normalizeDocumentNo(documentNo).startsWith(

    RECEIVE_DOCUMENT_PREFIX

  );

}



function isIssueDocument(

  documentNo: string | null | undefined

) {

  return normalizeDocumentNo(documentNo).startsWith(

    ISSUE_DOCUMENT_PREFIX

  );

}



function isDateInRange(

  value: Date,

  startDate: Date,

  endDate: Date

) {

  const time = new Date(value).getTime();



  return (

    time >= startDate.getTime() &&

    time < endDate.getTime()

  );

}



function getActualIssuedQty(item: {

  qty: number | null | undefined;

  issuedQty: number | null | undefined;

}) {

  if (

    item.issuedQty !== null &&

    item.issuedQty !== undefined

  ) {

    return safeNumber(item.issuedQty);

  }



  return safeNumber(item.qty);

}



function sortMaterialRows(rows: MaterialRow[]) {

  return [...rows].sort((a, b) => {

    const indexA = CATEGORY_ORDER.indexOf(a.category);

    const indexB = CATEGORY_ORDER.indexOf(b.category);



    const orderA =

      indexA >= 0 ? indexA : Number.MAX_SAFE_INTEGER;



    const orderB =

      indexB >= 0 ? indexB : Number.MAX_SAFE_INTEGER;



    if (orderA !== orderB) {

      return orderA - orderB;

    }



    return a.code.localeCompare(b.code, "th", {

      numeric: true,

      sensitivity: "base",

    });

  });

}



function parseInspectorIds(value: unknown): number[] {

  let values: unknown[] = [];



  if (Array.isArray(value)) {

    values = value;

  } else if (typeof value === "string") {

    try {

      const parsed: unknown = JSON.parse(value);



      values = Array.isArray(parsed)

        ? parsed

        : value.split(",");

    } catch {

      values = value.split(",");

    }

  }



  return values

    .map(Number)

    .filter(

      (id) => Number.isInteger(id) && id > 0

    );

}



function toDateOnly(

  date: Date | null | undefined

) {

  return date

    ? new Date(date).toISOString().slice(0, 10)

    : "";

}



export default async function StockCardInspectionPage({

  params,

}: PageProps) {

  const query = await params;



  const currentFiscalYear =

    getCurrentFiscalYearThai();



  const requestedFiscalYear =

    Number(query.fiscalYear);



  const fiscalYear =

    Number.isInteger(requestedFiscalYear) &&

    requestedFiscalYear >= BASE_FISCAL_YEAR &&

    requestedFiscalYear <= MAX_FISCAL_YEAR

      ? requestedFiscalYear

      : currentFiscalYear;



  const fiscalRange =

    getFiscalYearRange(fiscalYear);



  const todayEndExclusive =

    getCurrentThailandEndExclusive();



  const currentEndExclusive =

    todayEndExclusive.getTime() <

    fiscalRange.endDate.getTime()

      ? todayEndExclusive

      : fiscalRange.endDate;



  const startShortYear =

    getShortYear(fiscalYear - 1);



  const endShortYear =

    getShortYear(fiscalYear);



  const inspection =

    await prisma.stockCardInspection.findUnique({

      where: {

        fiscalYear,

      },

      include: {

        rows: true,

      },

    });



  if (!inspection) {

    notFound();

  }



  // ใช้รายการพัสดุที่อยู่ในประวัติเดิมเท่านั้น

  // เพื่อให้ตรงกับ API PUT ซึ่งไม่อนุญาตให้เพิ่ม/ลดรายการ



  const savedMaterialIds = inspection.rows.map(

    (row) => row.materialId

  );



  const [materials, officers] = await Promise.all([

    prisma.material.findMany({

      where: {

        id: {

          in: savedMaterialIds,

        },

      },

      select: {

        id: true,

        code: true,

        name: true,

        unit: true,

        category: true,



        receiveItems: {

          where: {

            receive: {

              receiveDate: {

                lt: fiscalRange.endDate,

              },

            },

          },

          select: {

            id: true,

            qty: true,

            receive: {

              select: {

                receiveDate: true,

                documentNo: true,

              },

            },

          },

          orderBy: [

            {

              receive: {

                receiveDate: "asc",

              },

            },

            {

              id: "asc",

            },

          ],

        },



        issueItems: {

          where: {

            issue: {

              status: "APPROVED",

              issueDate: {

                lt: fiscalRange.endDate,

              },

            },

          },

          select: {

            id: true,

            qty: true,

            issuedQty: true,

            issue: {

              select: {

                issueDate: true,

                documentNo: true,

              },

            },

          },

          orderBy: [

            {

              issue: {

                issueDate: "asc",

              },

            },

            {

              id: "asc",

            },

          ],

        },

      },

      orderBy: {

        code: "asc",

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

        id: "asc",

      },

    }),

  ]);



  const rows = sortMaterialRows(

    materials.map((material): MaterialRow => {

      const openingBalance =

        material.receiveItems

          .filter((item) =>

            isOpeningDocument(

              item.receive.documentNo

            )

          )

          .reduce(

            (total, item) =>

              total + safeNumber(item.qty),

            0

          );



      const receiveQty =

        material.receiveItems

          .filter(

            (item) =>

              isReceiveDocument(

                item.receive.documentNo

              ) &&

              isDateInRange(

                item.receive.receiveDate,

                fiscalRange.startDate,

                fiscalRange.endDate

              )

          )

          .reduce(

            (total, item) =>

              total + safeNumber(item.qty),

            0

          );



      const issueQty =

        material.issueItems

          .filter(

            (item) =>

              isIssueDocument(

                item.issue.documentNo

              ) &&

              isDateInRange(

                item.issue.issueDate,

                fiscalRange.startDate,

                fiscalRange.endDate

              )

          )

          .reduce(

            (total, item) =>

              total +

              getActualIssuedQty({

                qty: item.qty,

                issuedQty: item.issuedQty,

              }),

            0

          );



      const currentReceiveQty =

        material.receiveItems

          .filter(

            (item) =>

              isReceiveDocument(

                item.receive.documentNo

              ) &&

              isDateInRange(

                item.receive.receiveDate,

                fiscalRange.startDate,

                currentEndExclusive

              )

          )

          .reduce(

            (total, item) =>

              total + safeNumber(item.qty),

            0

          );



      const currentIssueQty =

        material.issueItems

          .filter(

            (item) =>

              isIssueDocument(

                item.issue.documentNo

              ) &&

              isDateInRange(

                item.issue.issueDate,

                fiscalRange.startDate,

                currentEndExclusive

              )

          )

          .reduce(

            (total, item) =>

              total +

              getActualIssuedQty({

                qty: item.qty,

                issuedQty: item.issuedQty,

              }),

            0

          );



      const closingBalance =

        openingBalance +

        currentReceiveQty -

        currentIssueQty;



      return {

        materialId: material.id,

        code: material.code,

        name: material.name,

        unit: material.unit,

        category: String(material.category),

        openingBalance,

        receiveQty,

        issueQty,

        closingBalance,

      };

    })

  );



  const savedRows = new Map(

    inspection.rows.map((row) => [

      row.materialId,

      row,

    ])

  );



  const inspectorIds = parseInspectorIds(

    inspection.inspectorIds

  );



  const numberText = (

    value: number | null | undefined

  ) => {

    return value == null ? "" : String(value);

  };



  const historyRows = rows.map((material) => {

    const saved = savedRows.get(

      material.materialId

    );



    return {

      materialId: material.materialId,

      accuracy: saved?.accuracy || "",

      shortageQty: numberText(

        saved?.shortageQty

      ),

      excessQty: numberText(

        saved?.excessQty

      ),

      baht: numberText(saved?.baht),

      satang: numberText(saved?.satang),

      damagedQty: numberText(

        saved?.damagedQty

      ),

      deterioratedQty: numberText(

        saved?.deterioratedQty

      ),

      unnecessaryQty: numberText(

        saved?.unnecessaryQty

      ),

      remark: saved?.remark || "",

    };

  });



  return (

    <AppPage>

      <AppPageHeader

        icon="📋"

        title="รายละเอียดการตรวจสอบบัญชีพัสดุประจำปี"

        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}

        actions={

          <AppButton

            href={`/stock-card/inspection-history?fiscalYear=${fiscalYear}`}

            variant="back"

            size="md"

          >

            กลับ

          </AppButton>

        }

      />



      <InspectionHistoryView

        fiscalYear={fiscalYear}

        startShortYear={startShortYear}

        endShortYear={endShortYear}

        materials={rows}

        rows={historyRows}

        officers={officers}

        inspectorIds={inspectorIds.map(String)}

        inspectionStartDate={toDateOnly(

          inspection.inspectionDate

        )}

        inspectionEndDate={toDateOnly(inspection.inspectionEndDate)}

      />

    </AppPage>

  );

}
