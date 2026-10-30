"use client";



import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";



import AppButton from "@/components/AppButton";

import ExportInspectionPdf from "../../../inspection/ExportInspectionPdf";

import ExportInspectionExcel from "../../../inspection/ExportInspectionExcel";

import AppCard from "@/components/AppCard";

import AppSearchInput from "@/components/AppSearchInput";

import AppSearchableSelect from "@/components/AppSearchableSelect";

import AppTableCard from "@/components/AppTableCard";



/* =========================================================

   TYPES

\========================================================= */



type Officer = {

  id: number;

  firstName: string;

  lastName: string;

  position: string | null;



  department: {

    id: number;

    name: string;

  } | null;



  section: {

    id: number;

    name: string;

  } | null;

};



type InspectionRow = {

  materialId: number;



  code: string;

  name: string;

  unit: string;

  category: string;



  openingQty: number;

  receiveQty: number;

  issueQty: number;

  closingQty: number;

  latestPrice?: number | null;



  accuracy: string;



  shortageQty: string;

  excessQty: string;



  baht: string;

  satang: string;



  damagedQty: string;

  deterioratedQty: string;

  unnecessaryQty: string;



  remark: string;

};



type InitialData = {

  fiscalYear: number;



  inspectionDate: string;

  inspectionEndDate?: string;



  inspectorIds: string[];



  rows: InspectionRow[];

};



type Props = {

  fiscalYear: number;



  officers: Officer[];



  initialData: InitialData;



  submitUrl: string;



  cancelHref: string;

};



/* =========================================================

   CATEGORY

\========================================================= */



const categoryOrder = [

  "OFFICE",

  "COMPUTER",

  "ELECTRIC",

  "HOUSEHOLD",

  "VEHICLE",

  "PRINTING",

];



const categoryName: Record<

  string,

  string

> = {

  OFFICE:

    "วัสดุสำนักงาน",



  COMPUTER:

    "วัสดุคอมพิวเตอร์",



  ELECTRIC:

    "วัสดุไฟฟ้าและวิทยุ",



  HOUSEHOLD:

    "วัสดุงานบ้านและงานครัว",



  VEHICLE:

    "วัสดุยานพาหนะ",



  PRINTING:

    "วัสดุสื่อสิ่งพิมพ์",

};



/* =========================================================

   THAI MONTHS

\========================================================= */



const thaiMonths = [

  "มกราคม",

  "กุมภาพันธ์",

  "มีนาคม",

  "เมษายน",

  "พฤษภาคม",

  "มิถุนายน",

  "กรกฎาคม",

  "สิงหาคม",

  "กันยายน",

  "ตุลาคม",

  "พฤศจิกายน",

  "ธันวาคม",

];



const thaiShortWeekDays = [

  "อา",

  "จ",

  "อ",

  "พ",

  "พฤ",

  "ศ",

  "ส",

];



/* =========================================================

   DATE HELPERS

\========================================================= */



function parseDateOnly(

  value: string

) {

  const match =

    /^(\d{4})-(\d{2})-(\d{2})$/.exec(

      value

    );



  if (!match) {

    return null;

  }



  const year =

    Number(match[1]);



  const month =

    Number(match[2]);



  const day =

    Number(match[3]);



  const date =

    new Date(

      year,

      month - 1,

      day

    );



  if (

    date.getFullYear() !==

      year ||

    date.getMonth() !==

      month - 1 ||

    date.getDate() !==

      day

  ) {

    return null;

  }



  return date;

}



function toDateOnly(

  year: number,

  month: number,

  day: number

) {

  return [

    year,

    String(

      month + 1

    ).padStart(

      2,

      "0"

    ),

    String(

      day

    ).padStart(

      2,

      "0"

    ),

  ].join("-");

}



function formatThaiDate(

  value: string

) {

  const date =

    parseDateOnly(

      value

    );



  if (!date) {

    return "";

  }



  return `${date.getDate()} ${

    thaiMonths[

      date.getMonth()

    ]

  } ${

    date.getFullYear() +

    543

  }`;

}



function getTodayDateOnly() {

  const now =

    new Date();



  const formatter =

    new Intl.DateTimeFormat(

      "en-CA",

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



  return formatter.format(

    now

  );

}



/* =========================================================

   IOS DATE PICKER

\========================================================= */



type IOSDatePickerProps = {

  id: string;

  value: string;

  onChange: (

    value: string

  ) => void;

};



function IOSDatePicker({

  id,

  value,

  onChange,

}: IOSDatePickerProps) {

  const containerRef =

    useRef<HTMLDivElement>(

      null

    );



  const selectedDate =

    parseDateOnly(

      value

    );



  const initialDate =

    selectedDate ??

    parseDateOnly(

      getTodayDateOnly()

    ) ??

    new Date();



  const [

    open,

    setOpen,

  ] = useState(

    false

  );



  const [

    displayYear,

    setDisplayYear,

  ] = useState(

    initialDate.getFullYear()

  );



  const [

    displayMonth,

    setDisplayMonth,

  ] = useState(

    initialDate.getMonth()

  );



  useEffect(() => {

    if (

      !selectedDate

    ) {

      return;

    }



    setDisplayYear(

      selectedDate.getFullYear()

    );



    setDisplayMonth(

      selectedDate.getMonth()

    );

  }, [value]);



  useEffect(() => {

    function handleMouseDown(

      event: MouseEvent

    ) {

      if (

        containerRef.current &&

        !containerRef.current.contains(

          event.target as Node

        )

      ) {

        setOpen(

          false

        );

      }

    }



    document.addEventListener(

      "mousedown",

      handleMouseDown

    );



    return () => {

      document.removeEventListener(

        "mousedown",

        handleMouseDown

      );

    };

  }, []);



  const firstDay =

    new Date(

      displayYear,

      displayMonth,

      1

    ).getDay();



  const daysInMonth =

    new Date(

      displayYear,

      displayMonth + 1,

      0

    ).getDate();



  const calendarCells: Array<

    number | null

  > = [];



  for (

    let i = 0;

    i < firstDay;

    i++

  ) {

    calendarCells.push(

      null

    );

  }



  for (

    let day = 1;

    day <=

    daysInMonth;

    day++

  ) {

    calendarCells.push(

      day

    );

  }



  while (

    calendarCells.length %

      7 !==

    0

  ) {

    calendarCells.push(

      null

    );

  }



  function goPreviousMonth() {

    if (

      displayMonth ===

      0

    ) {

      setDisplayMonth(

        11

      );



      setDisplayYear(

        (

          current

        ) =>

          current -

          1

      );



      return;

    }



    setDisplayMonth(

      (

        current

      ) =>

        current -

        1

    );

  }



  function goNextMonth() {

    if (

      displayMonth ===

      11

    ) {

      setDisplayMonth(

        0

      );



      setDisplayYear(

        (

          current

        ) =>

          current +

          1

      );



      return;

    }



    setDisplayMonth(

      (

        current

      ) =>

        current +

        1

    );

  }



  function selectDay(

    day: number

  ) {

    onChange(

      toDateOnly(

        displayYear,

        displayMonth,

        day

      )

    );



    setOpen(

      false

    );

  }



  function selectToday() {

    const today =

      parseDateOnly(

        getTodayDateOnly()

      );



    if (!today) {

      return;

    }



    onChange(

      toDateOnly(

        today.getFullYear(),

        today.getMonth(),

        today.getDate()

      )

    );



    setDisplayYear(

      today.getFullYear()

    );



    setDisplayMonth(

      today.getMonth()

    );



    setOpen(

      false

    );

  }



  return (

    <div

      ref={

        containerRef

      }

      className="

        relative

        w-full

        min-w-0

      "

    >

      <button

        id={id}

        type="button"

        aria-haspopup="dialog"

        aria-expanded={

          open

        }

        onClick={() =>

          setOpen(

            (

              current

            ) =>

              !current

          )

        }

        className="

          flex

          h-[46px]

          w-full

          min-w-0

          items-center

          justify-between



          rounded-[14px]



          border

          border-slate-300



          bg-white



          px-4



          text-left

          text-sm

          font-bold



          !text-slate-900



          shadow-sm



          outline-none



          transition-all

          duration-200



          hover:border-slate-400



          focus:border-blue-500

          focus:ring-4

          focus:ring-blue-100

        "

      >

        <span

          className={

            value

              ? "!text-slate-900"

              : "!text-slate-400"

          }

        >

          {value

            ? formatThaiDate(

                value

              )

            : "เลือกวันที่"}

        </span>



        <span

          aria-hidden="true"

          className="

            ml-3

            shrink-0

            text-lg

          "

        >

          📅

        </span>

      </button>



      {open && (

        <div

          role="dialog"

          className="

            absolute

            left-0

            top-[54px]

            z-[500]



            w-[330px]

            max-w-[calc(100vw-32px)]



            overflow-hidden



            rounded-[22px]



            border

            border-slate-200



            bg-white/95



            p-3



            shadow-2xl

            backdrop-blur-xl

          "

        >

          {/* =============================================

              MONTH HEADER

          ============================================= */}



          <div

            className="

              flex

              items-center

              justify-between



              px-1

              pb-3

            "

          >

            <button

              type="button"

              onClick={

                goPreviousMonth

              }

              className="

                flex

                h-9

                w-9

                items-center

                justify-center



                rounded-full



                bg-slate-100



                text-lg

                font-black



                !text-slate-700



                transition



                hover:bg-slate-200

              "

            >

              ‹

            </button>



            <div

              className="

                text-center

              "

            >

              <div

                className="

                  text-base

                  font-black



                  !text-slate-900

                "

              >

                {

                  thaiMonths[

                    displayMonth

                  ]

                }

              </div>



              <div

                className="

                  text-sm

                  font-bold



                  !text-slate-500

                "

              >

                พ.ศ.{" "}

                {displayYear +

                  543}

              </div>

            </div>



            <button

              type="button"

              onClick={

                goNextMonth

              }

              className="

                flex

                h-9

                w-9

                items-center

                justify-center



                rounded-full



                bg-slate-100



                text-lg

                font-black



                !text-slate-700



                transition



                hover:bg-slate-200

              "

            >

              ›

            </button>

          </div>



          {/* =============================================

              WEEK DAYS

          ============================================= */}



          <div

            className="

              grid

              grid-cols-7

              gap-1

            "

          >

            {thaiShortWeekDays.map(

              (

                day

              ) => (

                <div

                  key={

                    day

                  }

                  className="

                    py-1.5



                    text-center

                    text-xs

                    font-black



                    !text-slate-500

                  "

                >

                  {

                    day

                  }

                </div>

              )

            )}

          </div>



          {/* =============================================

              DAYS

          ============================================= */}



          <div

            className="

              mt-1



              grid

              grid-cols-7

              gap-1

            "

          >

            {calendarCells.map(

              (

                day,

                index

              ) => {

                if (

                  day ===

                  null

                ) {

                  return (

                    <div

                      key={`empty-${index}`}

                      className="h-9"

                    />

                  );

                }



                const selected =

                  selectedDate !==

                    null &&

                  selectedDate.getFullYear() ===

                    displayYear &&

                  selectedDate.getMonth() ===

                    displayMonth &&

                  selectedDate.getDate() ===

                    day;



                return (

                  <button

                    key={

                      day

                    }

                    type="button"

                    onClick={() =>

                      selectDay(

                        day

                      )

                    }

                    className={`

                      flex

                      h-9

                      items-center

                      justify-center



                      rounded-full



                      text-sm

                      font-extrabold



                      transition-all

                      duration-150



                      ${

                        selected

                          ? "bg-blue-600 !text-white shadow-md"

                          : "bg-transparent !text-slate-700 hover:bg-blue-50"

                      }

                    `}

                  >

                    {

                      day

                    }

                  </button>

                );

              }

            )}

          </div>



          {/* =============================================

              FOOTER

          ============================================= */}



          <div

            className="

              mt-3



              flex

              items-center

              justify-between



              border-t

              border-slate-200



              pt-3

            "

          >

            <button

              type="button"

              onClick={() => {

                onChange(

                  ""

                );



                setOpen(

                  false

                );

              }}

              className="

                rounded-[10px]



                px-3

                py-2



                text-xs

                font-extrabold



                !text-red-600



                hover:bg-red-50

              "

            >

              ล้างวันที่

            </button>



            <button

              type="button"

              onClick={

                selectToday

              }

              className="

                rounded-[10px]



                px-3

                py-2



                text-xs

                font-extrabold



                !text-blue-600



                hover:bg-blue-50

              "

            >

              วันนี้

            </button>

          </div>

        </div>

      )}

    </div>

  );

}



/* =========================================================

   HELPERS

\========================================================= */



function displayStockValue(

  value: number

) {

  if (

    !value

  ) {

    return "-";

  }



  return value.toLocaleString(

    "th-TH"

  );

}



function normalizeInspectorIds(

  value: string[]

) {

  const result =

    Array<string>(

      3

    ).fill("");



  value

    .slice(

      0,

      3

    )

    .forEach(

      (

        id,

        index

      ) => {

        result[index] =

          String(

            id ?? ""

          );

      }

    );



  return result;

}



function isValidOptionalInteger(

  value: string

) {

  if (

    value.trim() ===

    ""

  ) {

    return true;

  }



  const number =

    Number(

      value

    );



  return (

    Number.isInteger(

      number

    ) &&

    number >= 0

  );

}



/* =========================================================

   SAVE ICON

\========================================================= */



function SaveIcon() {

  return (

    <svg

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

      className="h-4 w-4"

      aria-hidden="true"

    >

      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />

      <path d="M17 21v-8H7v8" />

      <path d="M7 3v5h8" />

    </svg>

  );

}



/* =========================================================

   COMPONENT

\========================================================= */



export default function EditInspectionForm({

  fiscalYear,

  officers,

  initialData,

  submitUrl,

  cancelHref,

}: Props) {

  /* =======================================================

     STATE

  ======================================================= */



  const [

    inspectionDate,

    setInspectionDate,

  ] = useState(

    initialData.inspectionDate

  );



  const [inspectionEndDate, setInspectionEndDate] = useState(initialData.inspectionEndDate ?? "");



  const [

    inspectorIds,

    setInspectorIds,

  ] = useState<

    string[]

  >(

    () =>

      normalizeInspectorIds(

        initialData.inspectorIds

      )

  );



  const [

    rows,

    setRows,

  ] = useState<

    InspectionRow[]

  >(

    () =>

      initialData.rows.map(

        (

          row

        ) => ({

          ...row,

        })

      )

  );



  const [

    searchTerm,

    setSearchTerm,

  ] = useState(

    ""

  );



  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const topScrollRef = useRef<HTMLDivElement>(null);

  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  const [tableScrollWidth, setTableScrollWidth] = useState(2067);

  const [canScrollTable, setCanScrollTable] = useState(false);

  const syncTopScroll = useCallback(() => {

    if (topScrollRef.current && bottomScrollRef.current) {

      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;

    }

  }, []);

  const syncBottomScroll = useCallback(() => {

    if (topScrollRef.current && bottomScrollRef.current) {

      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;

    }

  }, []);

  useEffect(() => {

    const bottom = bottomScrollRef.current;

    const table = tableRef.current;

    if (!bottom || !table) return;

    const measure = () => {

      if (!bottomScrollRef.current || !tableRef.current) return;

      const width = Math.max(2067, tableRef.current.scrollWidth);

      setTableScrollWidth(width);

      setCanScrollTable(width > bottomScrollRef.current.clientWidth + 1);

      if (topScrollRef.current) {

        topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;

      }

    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(bottom);

    observer.observe(table);

    window.addEventListener("resize", measure);

    return () => {

      observer.disconnect();

      window.removeEventListener("resize", measure);

    };

  }, []);





  const [

    isSaving,

    setIsSaving,

  ] = useState(

    false

  );



  /* =======================================================

     OFFICER

  ======================================================= */



  function getOfficer(

    id: string

  ) {

    return officers.find(

      (

        officer

      ) =>

        String(

          officer.id

        ) === id

    );

  }



  function isOfficerSelected(

    officerId: string,

    currentIndex: number

  ) {

    return inspectorIds.some(

      (

        id,

        index

      ) =>

        index !==

          currentIndex &&

        id ===

          officerId

    );

  }



  function updateInspector(

    index: number,

    value: string

  ) {

    setInspectorIds(

      (

        current

      ) => {

        const next =

          [

            ...current,

          ];



        next[index] =

          value;



        return next;

      }

    );

  }



  /* =======================================================

     SEARCH

  ======================================================= */



  const filteredRows =

    useMemo(

      () => {

        const keyword =

          searchTerm

            .trim()

            .toLocaleLowerCase(

              "th"

            );



        const allowedRows = rows.filter((row) => {

          const name = row.name.trim();

          if (/\(ส\)\s*$/u.test(name)) return false;

          if (row.category === "ELECTRIC" && /ถ่านกระดุม/iu.test(name)) return false;

          return true;

        });



        const categoryRows = selectedCategory === "ALL"

          ? allowedRows

          : allowedRows.filter((row) => row.category === selectedCategory);



        if (!keyword) {

          return categoryRows;

        }



        return categoryRows.filter(

          (

            row

          ) => {

            const searchable =

              [

                row.code,

                row.name,

                row.unit,

                row.category,

                categoryName[

                  row.category

                ],

              ]

                .filter(

                  Boolean

                )

                .join(

                  " "

                )

                .toLocaleLowerCase(

                  "th"

                );



            return searchable.includes(

              keyword

            );

          }

        );

      },

      [

        rows,

        searchTerm,

        selectedCategory,

      ]

    );



  /* =======================================================

     GROUP ROWS

  ======================================================= */



  const groupedRows =

    useMemo(

      () => {

        return categoryOrder

          .map(

            (

              category

            ) => ({

              category,



              name:

                categoryName[

                  category

                ] ??

                category,



              rows:

                filteredRows.filter(

                  (

                    row

                  ) =>

                    row.category ===

                    category

                ),

            })

          )

          .filter(

            (

              group

            ) =>

              group.rows

                .length >

              0

          );

      },

      [

        filteredRows,

      ]

    );



  /* =======================================================

     UPDATE ROW

  ======================================================= */



  function updateRow(

    materialId: number,

    field:

      | "shortageQty"

      | "excessQty"

      | "baht"

      | "satang"

      | "damagedQty"

      | "deterioratedQty"

      | "unnecessaryQty"

      | "remark",

    value: string

  ) {

    setRows(

      (

        current

      ) =>

        current.map(

          (

            row

          ) =>

            row.materialId ===

            materialId

              ? {

                  ...row,



                  [field]:

                    value,

                }

              : row

        )

    );

  }



  function updateAccuracy(

    materialId: number,

    accuracy: string

  ) {

    setRows(

      (

        current

      ) =>

        current.map(

          (

            row

          ) =>

            row.materialId ===

            materialId

              ? {

                  ...row,

                  accuracy,

                }

              : row

        )

    );

  }



  /* =======================================================

     UPDATE ALL VISIBLE ACCURACY



     มีผลเฉพาะรายการที่กำลังแสดงจาก Search

  ======================================================= */



  function updateAllStatus(field: "damagedQty" | "deterioratedQty" | "unnecessaryQty" | "inUse") {
    const visibleIds = new Set(filteredRows.map((row) => row.materialId));
    setRows((current) => current.map((row) => {
      if (!visibleIds.has(row.materialId)) return row;
      if (field === "inUse") {
        return { ...row, damagedQty: "", deterioratedQty: "", unnecessaryQty: "" };
      }
      return {
        ...row,
        damagedQty: field === "damagedQty" ? String(Math.max(0, row.closingQty)) : "",
        deterioratedQty: field === "deterioratedQty" ? String(Math.max(0, row.closingQty)) : "",
        unnecessaryQty: field === "unnecessaryQty" ? String(Math.max(0, row.closingQty)) : "",
      };
    }));
  }

  function updateAllAccuracy(

    accuracy: string

  ) {

    const visibleIds =

      new Set(

        filteredRows.map(

          (

            row

          ) =>

            row.materialId

        )

      );



    setRows(

      (

        current

      ) =>

        current.map(

          (

            row

          ) =>

            visibleIds.has(

              row.materialId

            )

              ? {

                  ...row,

                  accuracy,

                }

              : row

        )

    );

  }



  /* =======================================================

     NUMBER INPUT

  ======================================================= */



  function handleNumberChange(

    materialId: number,

    field:

      | "shortageQty"

      | "excessQty"

      | "baht"

      | "satang"

      | "damagedQty"

      | "deterioratedQty"

      | "unnecessaryQty",

    value: string

  ) {

    if (

      value ===

      ""

    ) {

      updateRow(

        materialId,

        field,

        ""

      );



      return;

    }



    if (

      !/^\d+$/.test(

        value

      )

    ) {

      return;

    }



    updateRow(

      materialId,

      field,

      value

    );

  }



  /* =======================================================

     SAVE

  ======================================================= */



  async function handleSave() {

    if (

      isSaving

    ) {

      return;

    }



    /* ===============================================

       DATE

    =============================================== */



    if (

      !inspectionDate

    ) {

      alert(

        "กรุณาระบุวันที่ตรวจสอบ"

      );



      return;

    }



    if (

      !parseDateOnly(

        inspectionDate

      )

    ) {

      alert(

        "รูปแบบวันที่ตรวจสอบไม่ถูกต้อง"

      );



      return;

    }



    if (!inspectionEndDate || !parseDateOnly(inspectionEndDate)) {

      alert("กรุณาระบุวันที่ตรวจสอบแล้วเสร็จ");

      return;

    }

    if (inspectionEndDate < inspectionDate) {

      alert("วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ");

      return;

    }



    /* ===============================================

       INSPECTORS

    =============================================== */



    if (

      inspectorIds.length !==

        3 ||

      inspectorIds.some(

        (

          id

        ) =>

          !id

      )

    ) {

      alert(

        "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน"

      );



      return;

    }



    if (

      new Set(

        inspectorIds

      ).size !==

      3

    ) {

      alert(

        "ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้"

      );



      return;

    }



    /* ===============================================

       ROWS

    =============================================== */



    if (

      rows.length ===

      0

    ) {

      alert(

        "ไม่พบรายการพัสดุสำหรับตรวจสอบ"

      );



      return;

    }



    for (

      const row of

      rows

    ) {

      if (

        !row.accuracy

      ) {

        alert(

          `กรุณาระบุผลการตรวจสอบของรายการ "${row.name}"`

        );



        return;

      }



      const numericValues =

        [

          row.shortageQty,

          row.excessQty,

          row.baht,

          row.satang,

          row.damagedQty,

          row.deterioratedQty,

          row.unnecessaryQty,

        ];



      if (

        numericValues.some(

          (

            value

          ) =>

            !isValidOptionalInteger(

              value

            )

        )

      ) {

        alert(

          `จำนวนของรายการ "${row.name}" ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`

        );



        return;

      }

    }



    /* ===============================================

       REQUEST

    =============================================== */



    try {

      setIsSaving(

        true

      );



      const response =

        await fetch(

          submitUrl,

          {

            method:

              "PUT",



            headers: {

              "Content-Type":

                "application/json",

            },



            body:

              JSON.stringify(

                {

                  fiscalYear,



                  inspectionDate,

                  inspectionEndDate,



                  inspectorIds:

                    inspectorIds.map(

                      Number

                    ),



                  rows:

                    rows.map(

                      (

                        row

                      ) => ({

                        materialId:

                          row.materialId,



                        accuracy:

                          row.accuracy,



                        shortageQty:

                          row.shortageQty,



                        excessQty:

                          row.excessQty,



                        baht:

                          row.baht,



                        satang:

                          row.satang,



                        damagedQty:

                          row.damagedQty,



                        deterioratedQty:

                          row.deterioratedQty,



                        unnecessaryQty:

                          row.unnecessaryQty,



                        remark:

                          row.remark,

                      })

                    ),

                }

              ),

          }

        );



      let data:

        | {

            ok?: boolean;

            message?: string;

            error?: string;

          }

        | null =

        null;



      try {

        data =

          await response.json();

      } catch {

        data =

          null;

      }



      if (

        !response.ok

      ) {

        throw new Error(

          data?.message ||

            data?.error ||

            "ไม่สามารถแก้ไขข้อมูลการตรวจสอบได้"

        );

      }



      alert(

        data?.message ||

          "แก้ไขข้อมูลการตรวจสอบเรียบร้อยแล้ว"

      );



      window.location.href =

        cancelHref;

    } catch (

      error

    ) {

      console.error(

        error

      );



      alert(

        error instanceof

          Error

          ? error.message

          : "เกิดข้อผิดพลาดในการแก้ไขข้อมูล"

      );

    } finally {

      setIsSaving(

        false

      );

    }

  }



  /* =======================================================

     FIELD STYLE

  ======================================================= */



  const inspectionHeaderClass = "border border-black bg-gradient-to-r from-slate-800 to-slate-700 px-1 py-2 text-center align-middle text-[15px] font-extrabold leading-tight !text-white";



  const numberInputClass =

    `

      h-10

      w-full

      min-w-0



      rounded-[10px]



      border

      border-slate-300



      bg-white



      px-2



      text-center

      text-sm

      font-bold

      tabular-nums



      !text-slate-900



      outline-none



      transition



      focus:border-blue-500

      focus:ring-2

      focus:ring-blue-100

    `;



  /* =========================================================

     UI

  ========================================================= */



  return (

    <div

      className="

        relative



        w-full

        min-w-0



        space-y-4

      "

    >

      {/* =====================================================

          INSPECTION INFORMATION

      ===================================================== */}



      <AppCard

        padding={false}

        className="

          relative

          z-30



          w-full

          min-w-0



          !overflow-visible



          !rounded-[22px]

        "

      >

        <div className="p-3 sm:p-4">

        <div

          className="

            mb-3

          "

        >

          <h2

            className="

              text-lg

              font-black

              tracking-tight



              !text-slate-900

            "

          >

            ข้อมูลการตรวจสอบ

          </h2>



        </div>



        <div

          className="

            grid

            grid-cols-1



            gap-3



            md:grid-cols-2

          "

        >

          <div className="relative z-40 min-w-0">

            <label htmlFor="inspectionDate" className="mb-1.5 block text-sm font-extrabold !text-slate-700">วันที่เริ่มตรวจสอบ</label>

            <IOSDatePicker id="inspectionDate" value={inspectionDate} onChange={setInspectionDate} />

          </div>



          <div className="relative z-40 min-w-0">

            <label htmlFor="inspectionEndDate" className="mb-1.5 block text-sm font-extrabold !text-slate-700">วันที่ตรวจสอบแล้วเสร็จ</label>

            <IOSDatePicker id="inspectionEndDate" value={inspectionEndDate} onChange={setInspectionEndDate} />

          </div>

        </div>

        </div>

      </AppCard>



      {/* =====================================================

          SEARCH

      ===================================================== */}



      <div

        className="

          relative

          z-20

        "

      >

        <AppSearchInput

          value={

            searchTerm

          }

          onChange={(

            event

          ) =>

            setSearchTerm(

              event.target.value

            )

          }

          onSubmit={() =>

            setSearchTerm(

              searchTerm.trim()

            )

          }

          onClear={() =>

            setSearchTerm(

              ""

            )

          }

          placeholder="ค้นหารหัส / รายการพัสดุ / หน่วยนับ / หมวดหมู่"

          resultCount={

            filteredRows.length

          }

          resultLabel="รายการ"

          showSearchButton

          showClearButton

          searchButtonText="ค้นหา"

          clearButtonText="ล้าง"

        />

      </div>



      {/* =====================================================

          TABLE

      ===================================================== */}



      <AppTableCard

        title="รายการตรวจสอบบัญชีพัสดุ"

        subtitle={`แก้ไขผลการตรวจสอบบัญชีพัสดุ ประจำปีงบประมาณ ${fiscalYear}`}

        headerAction={

          <div className="flex flex-wrap items-center justify-end gap-2">

              <ExportInspectionPdf

                fiscalYear={fiscalYear}

                startShortYear={String(fiscalYear - 1).slice(-2)}

                endShortYear={String(fiscalYear).slice(-2)}

                materials={filteredRows.map((row) => ({

                  materialId: row.materialId,

                  code: row.code,

                  name: row.name,

                  unit: row.unit,

                  category: row.category,

                  openingBalance: row.openingQty,

                  receiveQty: row.receiveQty,

                  issueQty: row.issueQty,

                  closingBalance: row.closingQty,

                  latestPrice: row.latestPrice ?? null,

                }))}

                rows={rows.map((row) => ({

                  materialId: row.materialId,

                  accuracy: row.accuracy,

                  shortageQty: row.shortageQty,

                  excessQty: row.excessQty,

                  baht: row.baht,

                  satang: row.satang,

                  damagedQty: row.damagedQty,

                  deterioratedQty: row.deterioratedQty,

                  unnecessaryQty: row.unnecessaryQty,

                  remark: row.remark,

                }))}

                inspectionStartDate={inspectionDate}

                inspectionEndDate={inspectionEndDate}

                inspectorIds={inspectorIds}

                officers={officers.map((officer) => ({

                  ...officer,

                  position: officer.position ?? "",

                  type: "",

                  departmentId: officer.department?.id ?? null,

                  sectionId: officer.section?.id ?? null,

                }))}

              />

              <ExportInspectionExcel

                fiscalYear={fiscalYear}

                startShortYear={String(fiscalYear - 1).slice(-2)}

                endShortYear={String(fiscalYear).slice(-2)}

                materials={filteredRows.map((row) => ({

                  materialId: row.materialId,

                  code: row.code,

                  name: row.name,

                  unit: row.unit,

                  category: row.category,

                  openingBalance: row.openingQty,

                  receiveQty: row.receiveQty,

                  issueQty: row.issueQty,

                  closingBalance: row.closingQty,

                  latestPrice: row.latestPrice ?? null,

                }))}

                rows={rows.map((row) => ({

                  materialId: row.materialId,

                  accuracy: row.accuracy,

                  shortageQty: row.shortageQty,

                  excessQty: row.excessQty,

                  baht: row.baht,

                  satang: row.satang,

                  damagedQty: row.damagedQty,

                  deterioratedQty: row.deterioratedQty,

                  unnecessaryQty: row.unnecessaryQty,

                  remark: row.remark,

                }))}

                inspectionStartDate={inspectionDate}

                inspectionEndDate={inspectionEndDate}

                inUseChecks={Object.fromEntries(filteredRows.map((row) => [row.materialId, row.closingQty > 0 && Number(row.damagedQty || 0) === 0 && Number(row.deterioratedQty || 0) === 0 && Number(row.unnecessaryQty || 0) === 0]))}

                inspectorIds={inspectorIds}

                officers={officers.map((officer) => ({

                  ...officer,

                  position: officer.position ?? "",

                  type: "",

                  departmentId: officer.department?.id ?? null,

                  sectionId: officer.section?.id ?? null,

                }))}

              />

          </div>

        }

        className="

          relative

          z-10



          w-full

          min-w-0

          !max-w-full

        "

      >

        {/* เลือกหมวด: ชิดหัวการ์ด โดยไม่เปลี่ยนปุ่มและหัวตารางเดิม */}

        <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-0">

          <div className="relative z-30 w-full sm:max-w-[360px]">

            <label className="mb-1.5 block text-sm font-extrabold !text-slate-700">

              เลือกหมวด

            </label>

            <AppSearchableSelect

              value={selectedCategory}

              options={[

                { value: "ALL", label: "ทุกหมวด" },

                ...categoryOrder.map((category) => ({

                  value: category,

                  label: categoryName[category] ?? category,

                })),

              ]}

              placeholder="เลือกหมวด"

              searchPlaceholder="พิมพ์ค้นหาหมวด..."

              emptyText="ไม่พบหมวด"

              onChange={setSelectedCategory}

            />

          </div>

        </div>



        {/* ===================================================

            QUICK ACTION

        =================================================== */}



        <div

          className="

            border-b

            border-slate-200



            bg-slate-50/70



            px-3

            py-2

          "

        >

          <p

            className="

              mb-1



              text-sm

              font-extrabold



              !text-slate-700

            "

          >

            กำหนดผลให้รายการที่กำลังแสดงทั้งหมด

          </p>



          <div

            className="

              flex

              flex-wrap

              items-center

              justify-end

              gap-2

            "

          >

            <AppButton

              type="button"

              variant="success"

              size="sm"

              onClick={() =>

                updateAllAccuracy(

                  "CORRECT"

                )

              }

            >

              ถูกต้องทั้งหมด

            </AppButton>



            <AppButton

              type="button"

              variant="danger"

              size="sm"

              onClick={() =>

                updateAllAccuracy(

                  "INCORRECT"

                )

              }

            >

                            ไม่ถูกต้องทั้งหมด
            </AppButton>

            {([
              ["inUse", "ใช้การได้ทั้งหมด", "success"],
              ["damagedQty", "ชำรุดทั้งหมด", "success"],
              ["deterioratedQty", "เสื่อมสภาพทั้งหมด", "success"],
              ["unnecessaryQty", "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงานทั้งหมด", "danger"],
            ] as const).map(([field, label, variant]) => (
              <AppButton key={field} type="button" variant={variant} size="sm"
                onClick={() => updateAllStatus(field)}>
                {label}
              </AppButton>
            ))}



          </div>

        </div>



        {/* แถบเลื่อนแนวนอนด้านบน เชื่อมกับตารางด้านล่าง */}

        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">

          <div className="mb-1 flex items-center justify-between gap-2">

            <span className="text-xs font-bold !text-slate-600">เลื่อนตารางซ้าย–ขวา</span>

            <span className="text-xs font-semibold !text-slate-500">

              {canScrollTable ? "ลากแถบเลื่อนเพื่อดูคอลัมน์เพิ่มเติม" : "แสดงคอลัมน์ครบแล้ว"}

            </span>

          </div>

          <div

            ref={topScrollRef}

            onScroll={syncTopScroll}

            aria-label="แถบเลื่อนตารางด้านบน"

            className="w-full overflow-x-scroll overflow-y-hidden rounded-md border border-slate-300 bg-white"

            style={{ height: 18, scrollbarWidth: "auto" }}

          >

            <div style={{ width: tableScrollWidth, height: 1 }} />

          </div>

        </div>



        {/* ===================================================

            TABLE SCROLL

        =================================================== */}



        <div

          ref={bottomScrollRef}

          onScroll={syncBottomScroll}

          className="

            w-full

            min-w-0



            overflow-x-auto

            overscroll-x-contain

          "

        >

          <table

            ref={tableRef}

            className="

              w-[2067px]

              min-w-[2067px]



              table-fixed

              border-collapse



              bg-white



              text-[15px]

            "

          >

            <colgroup>

              {[46,360,74,105,140,90,90,105,75,82,75,75,125,90,90,90,195,160].map((width, index) => (

                <col key={index} style={{ width: `${width}px` }} />

              ))}

            </colgroup>

            {/* =================================================

                HEADER

            ================================================= */}



            <thead>

              <tr>

                <th rowSpan={2} className={inspectionHeaderClass}>ลำดับ</th>

                <th rowSpan={2} className={inspectionHeaderClass}>ชื่อหรือชนิดวัสดุหรือครุภัณฑ์</th>

                <th rowSpan={2} className={inspectionHeaderClass}>หน่วยนับ</th>

                <th rowSpan={2} className={inspectionHeaderClass}>ราคาต่อหน่วย</th>

                <th rowSpan={2} className={inspectionHeaderClass}>คงเหลือยอดยกมาเมื่อ<br />01 ต.ค. {String(fiscalYear - 1).slice(-2)}</th>

                <th colSpan={2} className={inspectionHeaderClass}>01 ต.ค. {String(fiscalYear - 1).slice(-2)} - 30 ก.ย. {String(fiscalYear).slice(-2)}</th>

                <th rowSpan={2} className={inspectionHeaderClass}>คงเหลือปัจจุบัน</th>

                <th colSpan={2} className={inspectionHeaderClass}>ผลการตรวจสอบ</th>

                <th colSpan={2} className={inspectionHeaderClass}>ถ้าไม่ถูกต้องระบุจำนวนที่ขาด/เกิน</th>

                <th className={inspectionHeaderClass}>จำนวนที่ขาดเกิน<br />คิดเป็นเงิน</th>

                <th colSpan={4} className={inspectionHeaderClass}>สถานะการใช้งานของวัสดุ (จำนวน)</th>

                <th rowSpan={2} className={inspectionHeaderClass}>หมายเหตุ</th>

              </tr>

              <tr>{["รับ","จ่าย","ถูกต้อง","ไม่ถูกต้อง","ขาด","เกิน","(บาท)","ใช้การได้","ชำรุด","เสื่อมสภาพ","สูญไปหรือไม่จำเป็นต้องใช้\nในหน่วยงาน"].map(label =>

                <th key={label} className={`${inspectionHeaderClass} !py-1 whitespace-pre-line`}>{label}</th>)}</tr>

            </thead>

            <tbody>

              {groupedRows.length ===

              0 ? (

                <tr>

                  <td

                    colSpan={

                      18

                    }

                    className="

                      border

                      border-black



                      bg-white



                      px-6

                      py-14



                      text-center

                      text-base

                      font-bold



                      !text-slate-500

                    "

                  >

                    ไม่พบรายการพัสดุ

                  </td>

                </tr>

              ) : (

                groupedRows.map(

                  (

                    group

                  ) => (

                    <CategoryRows

                      key={

                        group.category

                      }

                      categoryName={

                        group.name

                      }

                      rows={

                        group.rows

                      }

                      numberInputClass={

                        numberInputClass

                      }

                      onAccuracyChange={

                        updateAccuracy

                      }

                      onNumberChange={

                        handleNumberChange

                      }

                      onRemarkChange={(

                        materialId,

                        value

                      ) =>

                        updateRow(

                          materialId,

                          "remark",

                          value

                        )

                      }

                    />

                  )

                )

              )}

            </tbody>

          </table>

        </div>

      </AppTableCard>



      {/* =====================================================

          COMMITTEE

      ===================================================== */}



      <AppCard

        className="

          relative

          z-20



          w-full

          min-w-0



          !overflow-visible



          !p-4

          !rounded-[22px]

        "

      >

        <div>

          <h2

            className="

              text-xl

              font-black

              tracking-tight



              !text-slate-900

            "

          >

            คณะกรรมการตรวจสอบครุภัณฑ์

          </h2>



          <p

            className="

              mt-1



              text-sm

              font-semibold



              !text-slate-500

            "

          >

            เลือกผู้ตรวจสอบจำนวน 3 คน โดยไม่สามารถเลือกรายชื่อซ้ำกันได้

          </p>

        </div>



        <div

          className="

            mt-4



            grid

            grid-cols-1



            gap-3



            lg:grid-cols-3

          "

        >

          {inspectorIds.map(

            (

              inspectorId,

              index

            ) => {

              const officerOptions =

                officers

                  .filter(

                    (

                      officer

                    ) => {

                      const officerId =

                        String(

                          officer.id

                        );



                      return (

                        officerId ===

                          inspectorId ||

                        !isOfficerSelected(

                          officerId,

                          index

                        )

                      );

                    }

                  )

                  .map(

                    (

                      officer

                    ) => ({

                      value:

                        String(

                          officer.id

                        ),



                      label:

                        `${officer.firstName} ${officer.lastName}`.trim(),



                      description:

                        [

                          officer.position,

                          officer.department

                            ?.name,

                          officer.section

                            ?.name,

                        ]

                          .filter(

                            Boolean

                          )

                          .join(

                            " / "

                          ),

                    })

                  );



              return (

                <div

                  key={

                    index

                  }

                  className="

                    relative

                    min-w-0



                    rounded-[16px]



                    border

                    border-slate-200/80



                    bg-slate-50/60



                    p-3

                  "

                >

                  <label

                    className="

                      mb-2

                      block



                      text-sm

                      font-extrabold



                      !text-slate-700

                    "

                  >

                    {index ===

                    0

                      ? "ประธานกรรมการ"

                      : `กรรมการคนที่ ${index}`}

                  </label>



                  <AppSearchableSelect

                    value={

                      inspectorId

                    }

                    options={

                      officerOptions

                    }

                    placeholder="เลือกผู้ตรวจสอบ"

                    searchPlaceholder="พิมพ์ชื่อ / นามสกุล / ตำแหน่ง / กลุ่มงาน..."

                    emptyText="ไม่พบรายชื่อผู้ตรวจสอบ"

                    required

                    onChange={(

                      value

                    ) =>

                      updateInspector(

                        index,

                        value

                      )

                    }

                  />



                  {inspectorId && (

                    <p

                      className="

                        mt-2



                        text-xs

                        font-semibold



                        !text-slate-500

                      "

                    >

                      ตำแหน่ง:{" "}

                      {getOfficer(

                        inspectorId

                      )

                        ?.position ||

                        "-"}

                    </p>

                  )}

                </div>

              );

            }

          )}

        </div>

      </AppCard>



      {/* =====================================================

          ACTION

      ===================================================== */}



      <div

        className="

          flex

          w-full

          flex-col

          gap-2



          sm:flex-row

          sm:items-center

          sm:justify-end

        "

      >

        <AppButton

          href={

            cancelHref

          }

          variant="secondary"

          size="md"

        >

          ยกเลิก

        </AppButton>



        <AppButton

          type="button"

          variant="success"

          size="md"

          icon={

            <SaveIcon />

          }

          disabled={

            isSaving

          }

          onClick={

            handleSave

          }

        >

          {isSaving

            ? "กำลังบันทึก..."

            : "บันทึกการแก้ไข"}

        </AppButton>

      </div>

    </div>

  );

}



/* =========================================================

   CATEGORY ROWS

\========================================================= */



function CategoryRows({ categoryName, rows, numberInputClass, onAccuracyChange, onNumberChange, onRemarkChange }: {

  categoryName: string;

  rows: InspectionRow[];

  numberInputClass: string;

  onAccuracyChange: (materialId: number, accuracy: string) => void;

  onNumberChange: (materialId: number, field: "shortageQty" | "excessQty" | "baht" | "satang" | "damagedQty" | "deterioratedQty" | "unnecessaryQty", value: string) => void;

  onRemarkChange: (materialId: number, value: string) => void;

}) {

  const cell = "h-[23.25px] border border-black px-1 py-0 text-center text-[15px] font-normal leading-none tabular-nums !text-black";

  const fieldClass = "h-[22px] w-full min-w-0 rounded-[4px] border border-slate-200 bg-white px-1 text-center text-[15px] font-normal leading-none !text-slate-900 outline-none focus:ring-1 focus:ring-blue-100";

  const numberFields = ["shortageQty", "excessQty"] as const;

  const statusFields = ["damagedQty", "deterioratedQty", "unnecessaryQty"] as const;

  return <>

    <tr><td colSpan={18} className="h-[23.25px] border border-black bg-white px-2 py-0 text-left text-[15px] font-bold leading-none !text-black">{categoryName}</td></tr>

    {rows.map((row, index) => <tr key={row.materialId} className={index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/35 hover:bg-blue-50/50"}>

      <td className={cell}>{index + 1}</td>

      <td className={`${cell} px-2 text-left leading-tight`}>{row.name}</td>

      <td className={cell}>{row.unit || "-"}</td>

      <td className={cell}>{row.latestPrice == null ? "-" : row.latestPrice.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

      <td className={cell}>{displayStockValue(row.openingQty)}</td>

      <td className={cell}>{displayStockValue(row.receiveQty)}</td>

      <td className={cell}>{displayStockValue(row.issueQty)}</td>

      <td className={cell}>{Number(row.closingQty).toLocaleString("th-TH")}</td>

      {(["CORRECT", "INCORRECT"] as const).map(value => <td key={value} className={cell}>

        <label className="relative inline-flex h-5 w-5 cursor-pointer items-center justify-center align-middle">

          <input type="checkbox" className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"

            aria-label={`${row.name} ${value === "CORRECT" ? "ถูกต้อง" : "ไม่ถูกต้อง"}`}

            checked={row.accuracy === value}

            onChange={event => onAccuracyChange(row.materialId, event.target.checked ? value : "")} />

          <span aria-hidden="true" className="pointer-events-none flex h-[18px] w-[18px] items-center justify-center bg-white text-[17px] font-normal leading-none text-transparent peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-slate-300">✓</span>

        </label>

      </td>)}

      {numberFields.map(field => <td key={field} className={`${cell} p-0`}><input type="text" inputMode="numeric" value={row[field]} placeholder="" className={fieldClass} onChange={event => onNumberChange(row.materialId, field, event.target.value)} /></td>)}

      <td className={`${cell} p-0`}>

        <div className="flex items-center gap-px">

          <input aria-label={`${row.name} บาท`} title="บาท" type="text" inputMode="numeric" value={row.baht} placeholder="บาท" className={`${fieldClass} w-2/3`} onChange={event => onNumberChange(row.materialId, "baht", event.target.value)} />

          <span className="text-slate-500">.</span>

          <input aria-label={`${row.name} สตางค์`} title="สตางค์" type="text" inputMode="numeric" value={row.satang} placeholder="สต." className={`${fieldClass} w-1/3`} onChange={event => onNumberChange(row.materialId, "satang", event.target.value)} />

        </div>

      </td>

      <td className={cell}>{Math.max(0, row.closingQty - Number(row.damagedQty || 0) - Number(row.deterioratedQty || 0) - Number(row.unnecessaryQty || 0)).toLocaleString("th-TH")}</td>

      {statusFields.map(field => <td key={field} className={`${cell} p-0`}><input type="text" inputMode="numeric" value={row[field]} placeholder="" className={fieldClass} onChange={event => onNumberChange(row.materialId, field, event.target.value)} /></td>)}

      <td className={`${cell} p-0`}><input type="text" value={row.remark} className={`${fieldClass} text-left`} onChange={event => onRemarkChange(row.materialId, event.target.value)} /></td>

    </tr>)}

  </>;

}
