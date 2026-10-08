import {

  prisma,

} from "@/lib/prisma";



import {

  notFound,

} from "next/navigation";



import AppPage from "@/components/AppPage";

import AppPageHeader from "@/components/AppPageHeader";

import AppButton from "@/components/AppButton";



import EditInspectionForm from "./EditInspectionForm";



/* =========================================================

   DYNAMIC

\========================================================= */



export const dynamic =

  "force-dynamic";



export const revalidate =

  0;



/* =========================================================

   TYPES

\========================================================= */



type PageProps = {

  params: Promise<{

    fiscalYear: string;

  }>;

};



/* =========================================================

   CATEGORY ORDER

\========================================================= */



const categoryOrder = [

  "OFFICE",

  "COMPUTER",

  "ELECTRIC",

  "HOUSEHOLD",

  "VEHICLE",

  "PRINTING",

];



/* =========================================================

   DATE ONLY



   Database:

   2026-10-06T00:00:00.000Z



   Form:

   2026-10-06

\========================================================= */



function formatDateOnly(

  value:

    | Date

    | string

    | null

    | undefined

) {

  if (!value) {

    return "";

  }



  const date =

    value instanceof Date

      ? value

      : new Date(

          value

        );



  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return "";

  }



  const year =

    date.getUTCFullYear();



  const month =

    String(

      date.getUTCMonth() +

        1

    ).padStart(

      2,

      "0"

    );



  const day =

    String(

      date.getUTCDate()

    ).padStart(

      2,

      "0"

    );



  return `${year}-${month}-${day}`;

}



/* =========================================================

   PARSE INSPECTOR IDS

\========================================================= */



function parseInspectorIds(

  value: unknown

): string[] {

  if (

    Array.isArray(

      value

    )

  ) {

    return value

      .map(

        (

          item

        ) =>

          String(

            item ?? ""

          ).trim()

      )

      .filter(

        Boolean

      );

  }



  if (

    typeof value ===

      "string" &&

    value.trim()

  ) {

    try {

      const parsed =

        JSON.parse(

          value

        );



      if (

        Array.isArray(

          parsed

        )

      ) {

        return parsed

          .map(

            (

              item

            ) =>

              String(

                item ?? ""

              ).trim()

          )

          .filter(

            Boolean

          );

      }

    } catch {

      return value

        .split(

          ","

        )

        .map(

          (

            item

          ) =>

            item.trim()

        )

        .filter(

          Boolean

        );

    }

  }



  return [];

}



/* =========================================================

   FIELD VALUE



   null / undefined

   -> ""



   0

   -> "0"



   ใช้กับช่องแก้ไข เพื่อไม่ให้ 0 กลายเป็นค่าว่างโดยไม่ตั้งใจ

\========================================================= */



function toFieldValue(

  value:

    | number

    | null

    | undefined

) {

  if (

    value === null ||

    value === undefined

  ) {

    return "";

  }



  return String(

    value

  );

}



/* =========================================================

   FISCAL YEAR RANGE



   FY 2569

   1 ต.ค. 2568

   ถึงก่อน

   1 ต.ค. 2569

\========================================================= */



function getFiscalYearRange(

  fiscalYearThai: number

) {

  const fiscalEndChristianYear =

    fiscalYearThai -

    543;



  const fiscalStartChristianYear =

    fiscalEndChristianYear -

    1;



  const startDate =

    new Date(

      Date.UTC(

        fiscalStartChristianYear,

        9,

        1,

        0,

        0,

        0,

        0

      )

    );



  const endDate =

    new Date(

      Date.UTC(

        fiscalEndChristianYear,

        9,

        1,

        0,

        0,

        0,

        0

      )

    );



  return {

    startDate,

    endDate,

  };

}



/* =========================================================

   NUMBER

\========================================================= */



function safeInteger(

  value: unknown

) {

  const number =

    Number(

      value ?? 0

    );



  if (

    !Number.isFinite(

      number

    )

  ) {

    return 0;

  }



  return Math.trunc(

    number

  );

}



/* =========================================================

   PAGE

\========================================================= */



export default async function StockCardInspectionHistoryEditPage({

  params,

}: PageProps) {

  const {

    fiscalYear:

      fiscalYearParam,

  } = await params;



  /* =======================================================

     FISCAL YEAR

  ======================================================= */



  const fiscalYear =

    Number(

      fiscalYearParam

    );



  if (

    !Number.isInteger(

      fiscalYear

    ) ||

    fiscalYear < 2400 ||

    fiscalYear > 3000

  ) {

    notFound();

  }



  /* =======================================================

     INSPECTION

  ======================================================= */



  const inspection =

    await prisma.stockCardInspection.findUnique(

      {

        where: {

          fiscalYear,

        },



        include: {

          rows: {

            include: {

              material:

                true,

            },

          },

        },

      }

    );



  if (

    !inspection

  ) {

    notFound();

  }



  /* =======================================================

     MATERIAL IDS



     ใช้เฉพาะรายการที่อยู่ในประวัติรอบนี้

     ไม่ดึงพัสดุที่ถูกเพิ่มเข้าระบบภายหลังมาแทรก

  ======================================================= */



  const materialIds =

    inspection.rows.map(

      (

        row

      ) =>

        row.materialId

    );



  /* =======================================================

     FISCAL RANGE

  ======================================================= */



  const {

    startDate,

    endDate,

  } =

    getFiscalYearRange(

      fiscalYear

    );



  /* =======================================================

     TRANSACTIONS



     อ่านอย่างเดียว

     ไม่สร้าง OPENING_BALANCE

     ไม่แก้ยอด Stock

  ======================================================= */



  const transactions =

    materialIds.length >

    0

      ? await prisma.transaction.findMany(

          {

            where: {

              materialId: {

                in:

                  materialIds,

              },



              date: {

                lt:

                  endDate,

              },

            },



            select: {

              id: true,



              materialId:

                true,



              date:

                true,



              type:

                true,



              receiveQty:

                true,



              issueQty:

                true,



              balance:

                true,

            },



            orderBy: [

              {

                materialId:

                  "asc",

              },



              {

                date:

                  "asc",

              },



              {

                id:

                  "asc",

              },

            ],

          }

        )

      : [];



  /* =======================================================

     TRANSACTION MAP

  ======================================================= */



  const transactionMap =

    new Map<

      number,

      typeof transactions

    >();



  for (

    const transaction of

      transactions

  ) {

    const current =

      transactionMap.get(

        transaction.materialId

      ) ?? [];



    current.push(

      transaction

    );



    transactionMap.set(

      transaction.materialId,

      current

    );

  }



  /* =======================================================

     OFFICERS

  ======================================================= */



  const officers =

    await prisma.officer.findMany(

      {

        select: {

          id: true,

          firstName:

            true,

          lastName:

            true,

          position:

            true,



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

      }

    );



  /* =======================================================

     SORT INSPECTION ROWS



     หมวดก่อน

     รหัสพัสดุภายในหมวด

  ======================================================= */



  const sortedInspectionRows =

    [

      ...inspection.rows,

    ].sort(

      (

        a,

        b

      ) => {

        const categoryA =

          categoryOrder.indexOf(

            a.material

              .category

          );



        const categoryB =

          categoryOrder.indexOf(

            b.material

              .category

          );



        const orderA =

          categoryA >= 0

            ? categoryA

            : Number.MAX_SAFE_INTEGER;



        const orderB =

          categoryB >= 0

            ? categoryB

            : Number.MAX_SAFE_INTEGER;



        if (

          orderA !==

          orderB

        ) {

          return (

            orderA -

            orderB

          );

        }



        const codeCompare =

          a.material.code.localeCompare(

            b.material.code,

            "th",

            {

              numeric:

                true,



              sensitivity:

                "base",

            }

          );



        if (

          codeCompare !==

          0

        ) {

          return codeCompare;

        }



        return (

          a.materialId -

          b.materialId

        );

      }

    );



  /* =======================================================

     BUILD EDIT ROWS

  ======================================================= */



  const rows =

    sortedInspectionRows.map(

      (

        inspectionRow

      ) => {

        const material =

          inspectionRow.material;



        const materialTransactions =

          transactionMap.get(

            material.id

          ) ?? [];



        /* ===============================================

           BEFORE FY

        =============================================== */



        const beforeFiscalYear =

          materialTransactions.filter(

            (

              transaction

            ) =>

              transaction.date <

              startDate

          );



        const lastBeforeFiscalYear =

          beforeFiscalYear[

            beforeFiscalYear.length -

              1

          ];



        /* ===============================================

           IN FY

        =============================================== */



        const fiscalTransactions =

          materialTransactions.filter(

            (

              transaction

            ) =>

              transaction.date >=

                startDate &&

              transaction.date <

                endDate

          );



        /* ===============================================

           EXISTING OPENING TRANSACTION



           สำหรับข้อมูลเก่าที่มี OPENING_BALANCE

           อยู่แล้วในฐานข้อมูล

        =============================================== */



        const openingTransactions =

          fiscalTransactions.filter(

            (

              transaction

            ) =>

              transaction.type ===

              "OPENING_BALANCE"

          );



        const lastOpeningTransaction =

          openingTransactions[

            openingTransactions.length -

              1

          ];



        /* ===============================================

           OPENING



           FY 2569 และเก่ากว่า:

           ให้เคารพข้อมูลเดิมใน Stock Card

           หากมี OPENING_BALANCE เดิม ใช้ข้อมูลนั้น



           FY 2570 เป็นต้นไป:

           ใช้ยอดปิดก่อนเริ่มปีเป็นยอดยกเข้าแบบ Virtual

           ไม่สร้าง Transaction ใหม่

        =============================================== */



        let openingQty =

          0;



        if (

          fiscalYear <=

          2569 &&

          lastOpeningTransaction

        ) {

          openingQty =

            safeInteger(

              lastOpeningTransaction.balance

            );

        } else {

          openingQty =

            safeInteger(

              lastBeforeFiscalYear

                ?.balance

            );



          if (

            openingQty ===

              0 &&

            lastOpeningTransaction

          ) {

            openingQty =

              safeInteger(

                lastOpeningTransaction.balance

              );

          }

        }



        /* ===============================================

           MOVEMENTS



           OPENING_BALANCE ไม่ถือเป็น "รับ" ซ้ำ

        =============================================== */



        const actualMovements =

          fiscalTransactions.filter(

            (

              transaction

            ) =>

              transaction.type !==

              "OPENING_BALANCE"

          );



        const receiveQty =

          actualMovements.reduce(

            (

              total,

              transaction

            ) =>

              total +

              safeInteger(

                transaction.receiveQty

              ),

            0

          );



        const issueQty =

          actualMovements.reduce(

            (

              total,

              transaction

            ) =>

              total +

              safeInteger(

                transaction.issueQty

              ),

            0

          );



        /* ===============================================

           CLOSING



           ข้อมูลเก่า:

           ใช้ balance ล่าสุดที่บันทึกอยู่จริง



           FY 2570+:

           Virtual opening + movement

        =============================================== */



        const lastFiscalTransaction =

          fiscalTransactions[

            fiscalTransactions.length -

              1

          ];



        let closingQty =

          openingQty +

          receiveQty -

          issueQty;



        if (

          fiscalYear <=

            2569 &&

          lastFiscalTransaction

        ) {

          closingQty =

            safeInteger(

              lastFiscalTransaction.balance

            );

        }



        /* ===============================================

           ROW

        =============================================== */



        return {

          materialId:

            material.id,



          code:

            material.code,



          name:

            material.name,



          unit:

            material.unit,



          category:

            String(

              material.category

            ),



          openingQty:

            Math.max(

              0,

              openingQty

            ),



          receiveQty:

            Math.max(

              0,

              receiveQty

            ),



          issueQty:

            Math.max(

              0,

              issueQty

            ),



          closingQty:

            Math.max(

              0,

              closingQty

            ),



          accuracy:

            inspectionRow.accuracy ??

            "",



          shortageQty:

            toFieldValue(

              inspectionRow.shortageQty

            ),



          excessQty:

            toFieldValue(

              inspectionRow.excessQty

            ),



          baht:

            toFieldValue(

              inspectionRow.baht

            ),



          satang:

            toFieldValue(

              inspectionRow.satang

            ),



          damagedQty:

            toFieldValue(

              inspectionRow.damagedQty

            ),



          deterioratedQty:

            toFieldValue(

              inspectionRow.deterioratedQty

            ),



          unnecessaryQty:

            toFieldValue(

              inspectionRow.unnecessaryQty

            ),



          remark:

            inspectionRow.remark ??

            "",

        };

      }

    );



  /* =======================================================

     INITIAL DATA

  ======================================================= */



  const initialData = {

    fiscalYear:

      inspection.fiscalYear,



    inspectionDate:

      formatDateOnly(

        inspection.inspectionDate

      ),



    inspectorIds:

      parseInspectorIds(

        inspection.inspectorIds

      ),



    rows,

  };



  /* =======================================================

     URL

  ======================================================= */



  const detailHref =

    `/stock-card/inspection-history/${fiscalYear}`;



  const submitUrl =

    `/api/stock-card/inspection?fiscalYear=${fiscalYear}`;



  /* =========================================================

     UI

  ========================================================= */



  return (

    <AppPage>

      {/* =====================================================

          HEADER

      ===================================================== */}



      <AppPageHeader

        icon="✏️"

        title="แก้ไขการตรวจสอบบัญชีพัสดุประจำปี"

        subtitle={`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`}

        actions={

          <AppButton

            href={

              detailHref

            }

            variant="back"

            size="md"

          >

            กลับ

          </AppButton>

        }

      />



      {/* =====================================================

          EDIT FORM

      ===================================================== */}



      <EditInspectionForm

        fiscalYear={

          fiscalYear

        }

        officers={

          officers

        }

        initialData={

          initialData

        }

        submitUrl={

          submitUrl

        }

        cancelHref={

          detailHref

        }

      />

    </AppPage>

  );

}
