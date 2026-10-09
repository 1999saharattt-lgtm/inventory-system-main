"use client";



import {

  useMemo,

  useTransition,

} from "react";



import {

  useRouter,

  useSearchParams,

} from "next/navigation";



import AppPage from "@/components/AppPage";

import AppButton from "@/components/AppButton";

import AppCard from "@/components/AppCard";
import ExportAllStockCardPdf from "./ExportAllStockCardPdf";



/* =========================================================

   TYPES

\========================================================= */



type Category = {

  code: string;

  name: string;

  icon: string;

};



/* =========================================================

   CONSTANT

\========================================================= */



const BASE_FISCAL_YEAR =

  2569;



const MAX_FISCAL_YEAR =

  3000;



/* =========================================================

   CATEGORIES

\========================================================= */



const categories: Category[] =

  [

    {

      code:

        "OFFICE",



      name:

        "วัสดุสำนักงาน",



      icon:

        "📄",

    },



    {

      code:

        "COMPUTER",



      name:

        "วัสดุคอมพิวเตอร์",



      icon:

        "💻",

    },



    {

      code:

        "ELECTRIC",



      name:

        "วัสดุไฟฟ้าและวิทยุ",



      icon:

        "⚡",

    },



    {

      code:

        "HOUSEHOLD",



      name:

        "วัสดุงานบ้านและงานครัว",



      icon:

        "🏠",

    },



    {

      code:

        "VEHICLE",



      name:

        "วัสดุยานพาหนะ",



      icon:

        "🚗",

    },



    {

      code:

        "PRINTING",



      name:

        "วัสดุสื่อสิ่งพิมพ์",



      icon:

        "📰",

    },

  ];



/* =========================================================

   THAILAND DATE

\========================================================= */



function getThailandDateParts(

  value: Date

) {

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

        (

          part

        ) =>

          part.type ===

          "year"

      )?.value

    );



  const month =

    Number(

      parts.find(

        (

          part

        ) =>

          part.type ===

          "month"

      )?.value

    );



  const day =

    Number(

      parts.find(

        (

          part

        ) =>

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

   CURRENT FISCAL YEAR



   ต.ค. - ธ.ค.

   = ปีถัดไป



   ม.ค. - ก.ย.

   = ปีปัจจุบัน

\========================================================= */



function getCurrentFiscalYearThai(

  value: Date =

    new Date()

) {

  const parts =

    getThailandDateParts(

      value

    );



  const fiscalYearGregorian =

    parts.month >=

    10

      ? parts.year +

        1

      : parts.year;



  return (

    fiscalYearGregorian +

    543

  );

}



/* =========================================================

   AVAILABLE FISCAL YEARS

\========================================================= */



function getAvailableFiscalYears(

  currentFiscalYear:

    number,



  selectedFiscalYear:

    number

) {

  const highestFiscalYear =

    Math.max(

      currentFiscalYear,

      selectedFiscalYear,

      BASE_FISCAL_YEAR

    );



  const fiscalYears:

    number[] =

    [];



  for (

    let fiscalYear =

      highestFiscalYear;



    fiscalYear >=

    BASE_FISCAL_YEAR;



    fiscalYear--

  ) {

    fiscalYears.push(

      fiscalYear

    );

  }



  return fiscalYears;

}



/* =========================================================

   PAGE

\========================================================= */



export default function StockCardHome() {

  const router =

    useRouter();



  const searchParams =

    useSearchParams();



  const [

    isChangingYear,

    startTransition,

  ] =

    useTransition();



  /* =======================================================

     CURRENT FY

  ======================================================= */



  const currentFiscalYear =

    getCurrentFiscalYearThai();



  /* =======================================================

     SELECTED FY

  ======================================================= */



  const requestedFiscalYear =

    Number(

      searchParams.get(

        "fiscalYear"

      )

    );



  const selectedFiscalYear =

    Number.isInteger(

      requestedFiscalYear

    ) &&

    requestedFiscalYear >=

      BASE_FISCAL_YEAR &&

    requestedFiscalYear <=

      MAX_FISCAL_YEAR

      ? requestedFiscalYear

      : currentFiscalYear;



  /* =======================================================

     AVAILABLE YEARS

  ======================================================= */



  const availableFiscalYears =

    useMemo(

      () =>

        getAvailableFiscalYears(

          currentFiscalYear,

          selectedFiscalYear

        ),

      [

        currentFiscalYear,

        selectedFiscalYear,

      ]

    );



  /* =======================================================

     URL

  ======================================================= */



  const inspectionHref =

    `/stock-card/inspection?fiscalYear=${selectedFiscalYear}`;



  const inspectionHistoryHref =

    `/stock-card/inspection-history?fiscalYear=${selectedFiscalYear}`;



  /* =======================================================

     CHANGE FISCAL YEAR



     เลือกแล้วเปลี่ยนข้อมูลทันที

     ไม่มีปุ่ม "แสดงข้อมูล"

  ======================================================= */



  function handleFiscalYearChange(

    value: string

  ) {

    const nextFiscalYear =

      Number(

        value

      );



    if (

      !Number.isInteger(

        nextFiscalYear

      ) ||

      nextFiscalYear <

        BASE_FISCAL_YEAR ||

      nextFiscalYear >

        MAX_FISCAL_YEAR

    ) {

      return;

    }



    if (

      nextFiscalYear ===

      selectedFiscalYear

    ) {

      return;

    }



    startTransition(

      () => {

        router.push(

          `/stock-card?fiscalYear=${nextFiscalYear}`

        );

      }

    );

  }



  /* =========================================================

     UI

  ========================================================= */



  return (

    <AppPage>

      {/* =====================================================

          MAIN HEADER CARD



          รวม:

          - รายการบัญชีพัสดุ

          - ปุ่มตรวจสอบ

          - ปุ่มประวัติ

          - Dropdown ปีงบประมาณ



          ไม่มี Card ปีงบประมาณแยกอีกแล้ว

      ===================================================== */}



      <AppCard

        icon={

          <span

            aria-hidden="true"

          >

            📚

          </span>

        }

        title="รายการบัญชีพัสดุ"

        subtitle="เลือกหมวดหมู่เพื่อดูประวัติการเคลื่อนไหวพัสดุ"

        actions={

          <>

            {/* ===============================================

                INSPECTION HISTORY



                ใช้ปุ่มตัวกลาง

                สีเขียว

            =============================================== */}



            <ExportAllStockCardPdf fiscalYear={selectedFiscalYear} />

            <AppButton

              href={

                inspectionHistoryHref

              }

              variant="success"

              size="md"

            >

              ประวัติการตรวจสอบบัญชีพัสดุประจำปี

            </AppButton>



            {/* ===============================================

                NEW INSPECTION

            =============================================== */}



            <AppButton

              href={

                inspectionHref

              }

              variant="primary"

              size="md"

            >

              🔎 ตรวจสอบบัญชีพัสดุประจำปี

            </AppButton>

          </>

        }

        className="

          w-full

          min-w-0



          !overflow-visible

        "

      >

        {/* ===================================================

            FISCAL YEAR SELECT



            อยู่ภายในการ์ดรายการบัญชีพัสดุ

            ใต้หัวข้อ



            ไม่มีกรอบดำ

            ไม่มีปุ่มแสดงข้อมูล

        =================================================== */}



        <div

          className="

            w-full

            min-w-0



            sm:max-w-[300px]

          "

        >

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



          <div

            className="

              relative

              w-full

            "

          >

            <select

              id="fiscalYear"

              name="fiscalYear"

              value={

                String(

                  selectedFiscalYear

                )

              }

              disabled={

                isChangingYear

              }

              onChange={(

                event

              ) =>

                handleFiscalYearChange(

                  event.target

                    .value

                )

              }

              className="

                h-[50px]

                w-full



                cursor-pointer



                appearance-none



                rounded-[14px]



                border

                border-slate-300



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



                hover:border-slate-400



                focus:border-emerald-500

                focus:ring-4

                focus:ring-emerald-100/70



                disabled:cursor-wait

                disabled:bg-slate-50

                disabled:opacity-70

              "

            >

              {availableFiscalYears.map(

                (

                  fiscalYear

                ) => (

                  <option

                    key={

                      fiscalYear

                    }

                    value={

                      fiscalYear

                    }

                  >

                    ปีงบประมาณ{" "}

                    {

                      fiscalYear

                    }

                  </option>

                )

              )}

            </select>



            {/* =============================================

                SELECT ARROW

            ============================================= */}



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

                className="

                  h-5

                  w-5

                "

              >

                <path

                  fillRule="evenodd"

                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"

                  clipRule="evenodd"

                />

              </svg>

            </div>

          </div>



          {/* ===============================================

              CHANGING STATE

          =============================================== */}



          {isChangingYear && (

            <p

              className="

                mt-2



                text-xs

                font-semibold



                !text-emerald-600

              "

            >

              กำลังเปลี่ยนปีงบประมาณ...

            </p>

          )}

        </div>

      </AppCard>



      {/* =====================================================

          CATEGORY

      ===================================================== */}



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

                min-h-[230px]

                min-w-0

                flex-col



                items-center

                justify-center



                text-center

              "

            >

              {/* =============================================

                  ICON

              ============================================= */}



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

                    h-16

                    w-16

                    shrink-0



                    place-items-center



                    text-center

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



              {/* =============================================

                  CATEGORY INFORMATION

              ============================================= */}



              <div

                className="

                  mt-4



                  w-full

                  min-w-0



                  text-center

                "

              >

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

                  {

                    category.name

                  }

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

                  คลิกเพื่อดูรายการบัญชีพัสดุ

                </p>



                <p

                  className="

                    mt-1



                    text-xs

                    font-bold



                    !text-slate-400

                  "

                >

                  ปีงบประมาณ{" "}

                  {

                    selectedFiscalYear

                  }

                </p>

              </div>



              {/* =============================================

                  OPEN CATEGORY

              ============================================= */}



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

                  href={`/stock-card/${category.code}?fiscalYear=${selectedFiscalYear}`}

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