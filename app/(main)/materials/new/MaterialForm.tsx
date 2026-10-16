"use client";



import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";



import { MATERIALS } from "@/lib/materials";

import { UNITS } from "@/lib/units";



import AppButton from "@/components/AppButton";

import AppCard from "@/components/AppCard";

import AppInfoCard from "@/components/AppInfoCard";



/* =========================================================

   TYPES

========================================================= */



type Vendor = {

  id: number;

  name: string;

};



type MaterialMaster = {

  id: number;

  category: string;

  name: string;

  unit: string;

};



type MaterialCodeItem = {

  code: string;

  category: string;

};



type Props = {

  vendors: Vendor[];

  materialMasters: MaterialMaster[];

  initialCategory?: string;

  backHref?: string;

};



type SearchableOption = {

  value: string;

  label: string;

};



type EditableMaterialInputProps = {

  id: string;

  value: string;

  options: SearchableOption[];

  placeholder?: string;

  disabled?: boolean;

  required?: boolean;

  onChange: (value: string) => void;

};

type SearchableSelectProps = {

  id: string;

  value: string;

  options: SearchableOption[];

  placeholder: string;

  searchPlaceholder?: string;

  emptyText?: string;

  disabled?: boolean;

  required?: boolean;

  onChange: (value: string) => void;

};



/* =========================================================

   CATEGORY

========================================================= */



const categoryMap: Record<

  string,

  string

> = {

  "วัสดุสำนักงาน": "OFFICE",

  "วัสดุคอมพิวเตอร์":

    "COMPUTER",

  "วัสดุไฟฟ้าและวิทยุ":

    "ELECTRIC",

  "วัสดุงานบ้านและงานครัว":

    "HOUSEHOLD",

  "วัสดุยานพาหนะ":

    "VEHICLE",

  "วัสดุสื่อสิ่งพิมพ์":

    "PRINTING",

};



const categoryCodeToName =

  Object.fromEntries(

    Object.entries(

      categoryMap

    ).map(([name, code]) => [

      code,

      name,

    ])

  ) as Record<string, string>;



/* =========================================================

   MATERIAL CODE HELPERS



   หลักการ:

   - รหัสแยกตามหมวด

   - หาเลขสูงสุดของหมวดนั้นจากข้อมูลเดิม

   - สร้างเลขถัดไปอัตโนมัติ

   - ถ้ารหัสเดิมเป็น 001 -> 002

   - ถ้ารหัสเดิมเป็น 110 -> 111

   - ถ้ารหัสเดิมมี prefix เช่น COM-009 -> COM-010

========================================================= */



function extractMaterialCodeItems(

  payload: unknown

): MaterialCodeItem[] {

  let source: unknown[] = [];



  if (Array.isArray(payload)) {

    source = payload;

  } else if (

    payload &&

    typeof payload === "object"

  ) {

    const record =

      payload as Record<

        string,

        unknown

      >;



    const candidate =

      record.materials ??

      record.data ??

      record.items;



    if (Array.isArray(candidate)) {

      source = candidate;

    }

  }



  return source

    .filter(

      (item): item is Record<

        string,

        unknown

      > =>

        Boolean(

          item &&

            typeof item ===

              "object"

        )

    )

    .map((item) => ({

      code: String(

        item.code ?? ""

      ).trim(),

      category: String(

        item.category ?? ""

      ).trim(),

    }))

    .filter(

      (item) =>

        item.code.length > 0 &&

        item.category.length > 0

    );

}



function getNextMaterialCode(

  materials: MaterialCodeItem[],

  categoryCode: string

) {

  const categoryMaterials =

    materials.filter(

      (item) =>

        item.category ===

          categoryCode &&

        item.code.trim()

    );



  if (

    categoryMaterials.length === 0

  ) {

    return "1";

  }



  /* =======================================================

     กรณีรหัสเป็นตัวเลขล้วน

     เช่น 1, 2, 9, 10, 110

  ======================================================= */



  const numericCodes =

    categoryMaterials

      .map((item) => {

        const code =

          item.code.trim();



        if (!/^\d+$/.test(code)) {

          return null;

        }



        const numberValue =

          Number(code);



        if (

          !Number.isSafeInteger(

            numberValue

          )

        ) {

          return null;

        }



        return {

          raw: code,

          numberValue,

        };

      })

      .filter(

        (

          item

        ): item is {

          raw: string;

          numberValue: number;

        } => item !== null

      );



  if (numericCodes.length > 0) {

    const highest =

      numericCodes.reduce(

        (current, item) =>

          item.numberValue >

          current.numberValue

            ? item

            : current

      );



    const nextNumber =

      highest.numberValue + 1;



    const hasLeadingZero =

      highest.raw.length > 1 &&

      highest.raw.startsWith("0");



    return hasLeadingZero

      ? String(nextNumber).padStart(

          highest.raw.length,

          "0"

        )

      : String(nextNumber);

  }



  /* =======================================================

     กรณีมี prefix / suffix

     เช่น COM-009 -> COM-010

  ======================================================= */



  let highest:

    | {

        prefix: string;

        numberValue: number;

        width: number;

        suffix: string;

      }

    | null = null;



  for (const item of

    categoryMaterials) {

    const code =

      item.code.trim();



    const match = code.match(

      /^(.*?)(\d+)(\D*)$/

    );



    if (!match) {

      continue;

    }



    const numberValue =

      Number(match[2]);



    if (

      !Number.isSafeInteger(

        numberValue

      )

    ) {

      continue;

    }



    if (

      !highest ||

      numberValue >

        highest.numberValue

    ) {

      highest = {

        prefix: match[1],

        numberValue,

        width: match[2].length,

        suffix: match[3],

      };

    }

  }



  if (highest) {

    const nextNumber =

      highest.numberValue + 1;



    const nextDigits =

      String(nextNumber).padStart(

        highest.width,

        "0"

      );



    return `${highest.prefix}${nextDigits}${highest.suffix}`;

  }



  /* =======================================================

     Fallback

  ======================================================= */



  return String(

    categoryMaterials.length + 1

  );

}



async function fetchNextMaterialCode(

  categoryCode: string,

  signal?: AbortSignal

) {

  const response = await fetch(

    `/api/materials?category=${encodeURIComponent(

      categoryCode

    )}`,

    {

      method: "GET",

      cache: "no-store",

      signal,

      headers: {

        Accept: "application/json",

      },

    }

  );



  if (!response.ok) {

    throw new Error(

      "ไม่สามารถอ่านรหัสพัสดุเดิมได้"

    );

  }



  const payload: unknown =

    await response.json();



  const materials =

    extractMaterialCodeItems(

      payload

    );



  return getNextMaterialCode(

    materials,

    categoryCode

  );

}



/* =========================================================

   MONEY HELPERS

========================================================= */



function SearchableSelect({

  id,

  value,

  options,

  placeholder,

  searchPlaceholder = "พิมพ์เพื่อค้นหา...",

  emptyText = "ไม่พบข้อมูล",

  disabled = false,

  required = false,

  onChange,

}: SearchableSelectProps) {

  const containerRef =

    useRef<HTMLDivElement>(null);



  const inputRef =

    useRef<HTMLInputElement>(null);



  const [open, setOpen] =

    useState(false);



  const [search, setSearch] =

    useState("");



  const selectedOption =

    options.find(

      (option) =>

        option.value === value

    );



  const filteredOptions =

    useMemo(() => {

      const keyword =

        search

          .trim()

          .toLocaleLowerCase("th");



      if (!keyword) {

        return options;

      }



      return options.filter(

        (option) =>

          option.label

            .toLocaleLowerCase(

              "th"

            )

            .includes(keyword) ||

          option.value

            .toLocaleLowerCase(

              "th"

            )

            .includes(keyword)

      );

    }, [options, search]);



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

        setOpen(false);

        setSearch("");

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



  useEffect(() => {

    if (!open) {

      return;

    }



    const timer =

      window.setTimeout(() => {

        inputRef.current?.focus();

      }, 0);



    return () => {

      window.clearTimeout(

        timer

      );

    };

  }, [open]);



  return (

    <div

      ref={containerRef}

      className={`

        relative

        w-full



        ${

          open

            ? "z-[200]"

            : "z-0"

        }

      `}

    >

      {required && (

        <input

          tabIndex={-1}

          aria-hidden="true"

          value={value}

          onChange={() => {}}

          required

          className="

            pointer-events-none

            absolute

            h-px

            w-px

            opacity-0

          "

        />

      )}



      <button

        id={id}

        type="button"

        disabled={disabled}

        aria-haspopup="listbox"

        aria-expanded={open}

        onClick={() => {

          if (disabled) {

            return;

          }



          setOpen(

            (current) => {

              const next =

                !current;



              if (!next) {

                setSearch("");

              }



              return next;

            }

          );

        }}

        className="

          flex

          min-h-[50px]

          w-full

          items-center

          justify-between

          gap-3



          rounded-[14px]



          border

          border-slate-300



          bg-white



          px-4

          py-3



          text-left

          text-base

          font-bold

          !text-slate-900



          shadow-sm

          outline-none



          transition-all

          duration-200



          hover:border-slate-400

          hover:bg-slate-50



          focus:border-blue-400

          focus:bg-white

          focus:ring-4

          focus:ring-blue-500/10



          disabled:cursor-not-allowed

          disabled:border-slate-200

          disabled:bg-slate-100

          disabled:!text-slate-400

          disabled:opacity-70

        "

      >

        <span

          className={`

            min-w-0

            flex-1

            truncate



            ${

              selectedOption

                ? "!text-slate-900"

                : "!text-slate-400"

            }

          `}

        >

          {selectedOption?.label ??

            placeholder}

        </span>



        <span

          aria-hidden="true"

          className={`

            shrink-0

            text-xs

            !text-slate-500



            transition-transform

            duration-200



            ${

              open

                ? "rotate-180"

                : ""

            }

          `}

        >

          ▼

        </span>

      </button>



      {open && !disabled && (

        <div

          className="

            absolute

            left-0

            right-0

            top-[calc(100%+8px)]



            z-[9999]



            overflow-hidden



            rounded-[16px]



            border

            border-slate-200



            bg-white



            shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)]

          "

        >

          <div

            className="

              border-b

              border-slate-200

              bg-slate-50

              p-3

            "

          >

            <input

              ref={inputRef}

              type="text"

              value={search}

              autoComplete="off"

              placeholder={

                searchPlaceholder

              }

              onChange={(

                event

              ) =>

                setSearch(

                  event.target

                    .value

                )

              }

              onKeyDown={(

                event

              ) => {

                if (

                  event.key ===

                  "Escape"

                ) {

                  setOpen(

                    false

                  );

                  setSearch("");

                }



                if (

                  event.key ===

                    "Enter" &&

                  filteredOptions.length ===

                    1

                ) {

                  event.preventDefault();



                  onChange(

                    filteredOptions[0]

                      .value

                  );



                  setOpen(

                    false

                  );

                  setSearch("");

                }

              }}

              className="

                min-h-[46px]

                w-full



                rounded-[12px]



                border

                border-slate-300



                bg-white



                px-4

                py-2.5



                text-base

                font-bold

                !text-slate-900



                shadow-sm

                outline-none



                transition-all

                duration-200



                placeholder:!text-slate-400



                hover:border-slate-400



                focus:border-blue-400

                focus:ring-4

                focus:ring-blue-500/10

              "

            />

          </div>



          <div

            role="listbox"

            className="

              max-h-[260px]

              overflow-y-auto

              overscroll-contain

              bg-white

              p-2

            "

          >

            {filteredOptions.length >

            0 ? (

              filteredOptions.map(

                (option) => {

                  const active =

                    option.value ===

                    value;



                  return (

                    <button

                      key={

                        option.value

                      }

                      type="button"

                      role="option"

                      aria-selected={

                        active

                      }

                      onClick={() => {

                        onChange(

                          option.value

                        );



                        setOpen(

                          false

                        );

                        setSearch("");

                      }}

                      className={`

                        flex

                        w-full

                        items-center

                        justify-between

                        gap-3



                        rounded-[10px]



                        px-3

                        py-2.5



                        text-left

                        text-base

                        font-bold



                        transition-colors



                        ${

                          active

                            ? `

                              bg-slate-900

                              !text-white

                            `

                            : `

                              bg-white

                              !text-slate-900

                              hover:bg-slate-100

                            `

                        }

                      `}

                    >

                      <span

                        className="

                          min-w-0

                          flex-1

                          break-words

                        "

                      >

                        {option.label}

                      </span>



                      {active && (

                        <span

                          aria-hidden="true"

                          className="

                            shrink-0

                            !text-white

                          "

                        >

                          ✓

                        </span>

                      )}

                    </button>

                  );

                }

              )

            ) : (

              <div

                className="

                  px-4

                  py-8

                  text-center

                  text-sm

                  font-bold

                  !text-slate-500

                "

              >

                {emptyText}

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}



/* =========================================================

   MATERIAL FORM

========================================================= */



function EditableMaterialInput({

  id,

  value,

  options,

  placeholder = "พิมพ์ชื่อรายการพัสดุ",

  disabled = false,

  required = false,

  onChange,

}: EditableMaterialInputProps) {

  const containerRef =

    useRef<HTMLDivElement>(null);



  const [open, setOpen] =

    useState(false);



  const filteredOptions =

    useMemo(() => {

      const keyword =

        value

          .trim()

          .toLocaleLowerCase("th");



      if (!keyword) {

        return options;

      }



      return options.filter(

        (option) =>

          option.label

            .toLocaleLowerCase("th")

            .includes(keyword) ||

          option.value

            .toLocaleLowerCase("th")

            .includes(keyword)

      );

    }, [options, value]);



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

        setOpen(false);

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



  return (

    <div

      ref={containerRef}

      className={`

        relative

        w-full

        ${open ? "z-[200]" : "z-0"}

      `}

    >

      <div

        className="

          relative

          flex

          min-h-[50px]

          w-full

          items-center



          rounded-[14px]



          border-2

          border-slate-200



          bg-white



          shadow-sm



          transition-all

          duration-200



          focus-within:border-blue-500

          focus-within:ring-4

          focus-within:ring-blue-500/10

        "

      >

        <input

          id={id}

          type="text"

          value={value}

          disabled={disabled}

          required={required}

          autoComplete="off"

          placeholder={placeholder}

          onFocus={() => {

            if (!disabled) {

              setOpen(true);

            }

          }}

          onChange={(event) => {

            onChange(

              event.target.value

            );



            if (!disabled) {

              setOpen(true);

            }

          }}

          onKeyDown={(event) => {

            if (

              event.key ===

              "Escape"

            ) {

              setOpen(false);

            }



            if (

              event.key ===

                "ArrowDown"

            ) {

              setOpen(true);

            }

          }}

          className="

            min-h-[48px]

            min-w-0

            flex-1



            rounded-[12px]



            border-0

            bg-transparent



            px-4

            py-3



            text-base

            font-bold

            !text-slate-900



            outline-none



            placeholder:!text-slate-400



            disabled:cursor-not-allowed

            disabled:bg-slate-100

            disabled:!text-slate-400

          "

        />



        <button

          type="button"

          tabIndex={-1}

          disabled={disabled}

          onClick={() => {

            if (disabled) {

              return;

            }



            setOpen(

              (current) =>

                !current

            );

          }}

          className="

            flex

            h-full

            shrink-0

            items-center

            justify-center



            px-4



            text-xs

            !text-slate-500



            disabled:cursor-not-allowed

          "

          aria-label="แสดงรายการพัสดุ"

        >

          <span

            className={`

              transition-transform

              duration-200



              ${

                open

                  ? "rotate-180"

                  : ""

              }

            `}

          >

            ▼

          </span>

        </button>

      </div>



      {open && !disabled && (

        <div

          className="

            absolute

            left-0

            right-0

            top-[calc(100%+8px)]



            z-[9999]



            overflow-hidden



            rounded-[16px]



            border

            border-slate-200



            bg-white



            shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)]

          "

        >

          <div

            className="

              border-b

              border-slate-200



              bg-slate-50



              px-4

              py-3



              text-xs

              font-bold

              !text-slate-500

            "

          >

            พิมพ์แก้ไขชื่อได้โดยตรง หรือเลือกรายการเดิมด้านล่าง

          </div>



          <div

            role="listbox"

            className="

              max-h-[260px]

              overflow-y-auto

              overscroll-contain



              bg-white



              p-2

            "

          >

            {filteredOptions.length >

            0 ? (

              filteredOptions.map(

                (option) => {

                  const selected =

                    option.value ===

                    value;



                  return (

                    <button

                      key={

                        option.value

                      }

                      type="button"

                      role="option"

                      aria-selected={

                        selected

                      }

                      onClick={() => {

                        onChange(

                          option.value

                        );



                        setOpen(

                          false

                        );

                      }}

                      className={`

                        flex

                        w-full

                        items-center

                        justify-between

                        gap-3



                        rounded-[10px]



                        px-3

                        py-2.5



                        text-left

                        text-base

                        font-bold



                        transition-colors



                        ${

                          selected

                            ? `

                              bg-slate-900

                              !text-white

                            `

                            : `

                              bg-white

                              !text-slate-900

                              hover:bg-slate-100

                            `

                        }

                      `}

                    >

                      <span

                        className="

                          min-w-0

                          flex-1

                          break-words

                        "

                      >

                        {option.label}

                      </span>



                      {selected && (

                        <span

                          aria-hidden="true"

                          className="

                            shrink-0

                            !text-white

                          "

                        >

                          ✓

                        </span>

                      )}

                    </button>

                  );

                }

              )

            ) : (

              <div

                className="

                  px-4

                  py-6

                  text-center

                "

              >

                <p

                  className="

                    text-sm

                    font-bold

                    !text-slate-700

                  "

                >

                  ใช้ชื่อที่พิมพ์นี้ได้

                </p>



                <p

                  className="

                    mt-1

                    break-words

                    text-sm

                    font-extrabold

                    !text-blue-600

                  "

                >

                  {value.trim() ||

                    "-"}

                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}




export default function MaterialForm({

  vendors,

  materialMasters,

  initialCategory = "",

  backHref = "/materials",

}: Props) {

  const categories =

    Object.keys(categoryMap);



  const initialCategoryName =

    categoryCodeToName[

      initialCategory

    ] ?? "";



  const [vendorId, setVendorId] =

    useState("");



  const [category, setCategory] =

    useState(

      initialCategoryName

    );



  const [name, setName] =

    useState("");



  const [materialCode, setMaterialCode] =

    useState("");



  const [isLoadingCode, setIsLoadingCode] =

    useState(false);



  const [codeError, setCodeError] =

    useState("");



  const [

    isSubmitting,

    setIsSubmitting,

  ] = useState(false);



  /* =======================================================

     AUTO MATERIAL CODE



     ทุกครั้งที่เปลี่ยนหมวด:

     - อ่านรหัสเดิมของหมวดนั้น

     - หาเลขสูงสุด

     - แสดงเลขถัดไปอัตโนมัติ

  ======================================================= */



  useEffect(() => {

    const categoryCode =

      categoryMap[category];



    if (!categoryCode) {

      setMaterialCode("");

      setCodeError("");

      setIsLoadingCode(false);

      return;

    }



    const controller =

      new AbortController();



    async function loadCode() {

      try {

        setIsLoadingCode(true);

        setCodeError("");



        const nextCode =

          await fetchNextMaterialCode(

            categoryCode,

            controller.signal

          );



        setMaterialCode(

          nextCode

        );

      } catch (error) {

        if (

          error instanceof DOMException &&

          error.name === "AbortError"

        ) {

          return;

        }



        console.error(

          "ไม่สามารถคำนวณรหัสพัสดุอัตโนมัติได้:",

          error

        );



        setMaterialCode("");

        setCodeError(

          "ไม่สามารถคำนวณรหัสอัตโนมัติได้"

        );

      } finally {

        if (

          !controller.signal.aborted

        ) {

          setIsLoadingCode(false);

        }

      }

    }



    loadCode();



    return () => {

      controller.abort();

    };

  }, [category]);



  /* =======================================================

     OPTIONS

  ======================================================= */



  const vendorOptions =

    useMemo<SearchableOption[]>(

      () => [

        {

          value: "",

          label:

            "-- ไม่ระบุผู้จำหน่าย --",

        },

        ...vendors.map(

          (vendor) => ({

            value: String(

              vendor.id

            ),

            label: vendor.name,

          })

        ),

      ],

      [vendors]

    );



  const categoryOptions =

    useMemo<SearchableOption[]>(

      () =>

        categories.map(

          (item) => ({

            value: item,

            label: item,

          })

        ),

      [categories]

    );



  /* =======================================================

     MATERIAL NAMES

  ======================================================= */



  const names = useMemo(() => {

    if (!category) {

      return [];

    }



    const oldNames =

      MATERIALS[

        category as keyof typeof MATERIALS

      ] ?? [];



    const newNames =

      materialMasters

        .filter(

          (item) =>

            item.category ===

            categoryMap[

              category

            ]

        )

        .map(

          (item) =>

            item.name

        );



    return Array.from(

      new Set([

        ...oldNames,

        ...newNames,

      ])

    );

  }, [

    category,

    materialMasters,

  ]);



  const materialOptions =

    useMemo<SearchableOption[]>(

      () => [

        ...names.map(

          (item) => ({

            value: item,

            label: item,

          })

        ),

      ],

      [names]

    );



  /* =======================================================

     UNIT

  ======================================================= */



  const [unit, setUnit] = useState("");

  function handleMaterialNameChange(nextName: string) {
    setName(nextName);
    const selectedName = nextName.trim();
    const mappedUnit = UNITS[selectedName] ?? materialMasters.find(
      (item) => item.name === selectedName && item.category === categoryMap[category]
    )?.unit;
    if (mappedUnit) setUnit(mappedUnit);
  }

  /* =======================================================

     SUBMIT

  ======================================================= */



  async function handleSubmit(

    e: React.FormEvent<HTMLFormElement>

  ) {

    e.preventDefault();



    if (isSubmitting) {

      return;

    }







    const materialName = name.trim();



    const categoryCode =

      categoryMap[category];



    if (!categoryCode) {

      alert(

        "กรุณาเลือกหมวดหมู่"

      );

      return;

    }



    if (!materialName) {

      alert(

        "กรุณาระบุชื่อรายการพัสดุ"

      );

      return;

    }



    if (!unit) {

      alert(

        "กรุณาระบุหน่วย"

      );

      return;

    }



    try {

      setIsSubmitting(true);



      /* =====================================================

         ตรวจรหัสอีกครั้งก่อนบันทึก

         เพื่อให้ได้เลขล่าสุดที่สุด

      ===================================================== */



      const latestCode =

        await fetchNextMaterialCode(

          categoryCode

        );



      setMaterialCode(

        latestCode

      );



      const body = {

        code: latestCode,



        vendorId: vendorId

          ? Number(vendorId)

          : null,



        category:

          categoryCode,



        name: materialName,



        unit,



        balance: 0,



        latestPrice: 0,

      };



      const res = await fetch(

        "/api/materials",

        {

          method: "POST",



          headers: {

            "Content-Type":

              "application/json",

          },



          body: JSON.stringify(

            body

          ),

        }

      );



      if (res.ok) {

        window.location.href =

          `/materials/category/${categoryCode}`;



        return;

      }



      const data =

        await res

          .json()

          .catch(() => null);



      alert(

        data?.message ??

          "บันทึกไม่สำเร็จ"

      );

    } catch (error) {

      console.error(

        "เกิดข้อผิดพลาดในการบันทึกพัสดุ:",

        error

      );



      alert(

        "ไม่สามารถสร้างรหัสพัสดุอัตโนมัติหรือบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"

      );

    } finally {

      setIsSubmitting(false);

    }

  }



  /* =======================================================

     SHARED CLASSES

  ======================================================= */



  const labelClassName = `

    mb-2

    block

    text-sm

    font-extrabold

    !text-slate-700

    sm:text-base

  `;



  const inputClassName = `

    min-h-[50px]

    w-full



    rounded-[14px]



    border

    border-slate-300



    bg-white



    px-4

    py-3



    text-base

    font-bold

    !text-slate-900



    shadow-sm

    outline-none



    transition-all

    duration-200



    placeholder:!text-slate-400



    hover:border-slate-400

    hover:bg-slate-50



    focus:border-blue-400

    focus:bg-white

    focus:ring-4

    focus:ring-blue-500/10

  `;



  /* =======================================================

     UI

  ======================================================= */



  return (

    <form

      onSubmit={handleSubmit}

      className="

        relative

        z-0

        w-full

        min-w-0

        overflow-visible

      "

    >

      <AppCard

        className="

          relative

          w-full

          !overflow-visible

        "

      >

        {/* =================================================

            HEADER + AUTO CODE

        ================================================= */}



        <div

          className="

            mb-6

            flex

            flex-col

            gap-4

            sm:flex-row

            sm:items-start

            sm:justify-between

          "

        >

          <div className="min-w-0">

            <h2

              className="

                text-lg

                font-extrabold

                !text-slate-900

              "

            >

              ข้อมูลพัสดุ

            </h2>



            <p

              className="

                mt-1

                text-sm

                font-semibold

                !text-slate-500

              "

            >

              ระบุรายละเอียดของพัสดุที่ต้องการเพิ่ม

            </p>

          </div>



          {/* ===============================================

              รหัสพัสดุอัตโนมัติ

              อยู่ด้านบนขวาของการ์ด

              ผู้ใช้แก้ไขไม่ได้

          =============================================== */}



          <div

            className="

              w-full

              shrink-0

              sm:w-[230px]

            "

          >

            <AppInfoCard

              className="

                !p-3

                sm:!p-3.5

              "

            >

              <div

                className="

                  mb-1.5

                  flex

                  items-center

                  justify-between

                  gap-2

                "

              >

                <label

                  htmlFor="code"

                  className="

                    text-xs

                    font-extrabold

                    !text-slate-600

                  "

                >

                  รหัสพัสดุ

                </label>



                <span

                  className="

                    rounded-full

                    bg-emerald-50

                    px-2

                    py-0.5

                    text-[10px]

                    font-extrabold

                    !text-emerald-700

                  "

                >

                  อัตโนมัติ

                </span>

              </div>



              <input

                id="code"

                name="code"

                type="text"

                value={

                  isLoadingCode

                    ? "กำลังรันรหัส..."

                    : materialCode

                      ? materialCode

                      : category

                        ? "-"

                        : "เลือกหมวดหมู่"

                }

                readOnly

                aria-readonly="true"

                tabIndex={-1}

                className="

                  h-10

                  w-full

                  cursor-default



                  rounded-[12px]



                  border-2

                  !border-slate-200



                  bg-slate-100



                  px-3



                  text-center

                  text-base

                  font-black

                  tabular-nums

                  !text-slate-900



                  shadow-inner

                  outline-none

                "

              />



              {codeError && (

                <p

                  className="

                    mt-1.5

                    text-[11px]

                    font-bold

                    !text-red-600

                  "

                >

                  {codeError}

                </p>

              )}

            </AppInfoCard>

          </div>

        </div>



        {/* =================================================

            GRID

        ================================================= */}



        <div

          className="

            relative

            grid

            grid-cols-1

            gap-4

            overflow-visible

            lg:grid-cols-2

          "

        >

          {/* VENDOR */}



          <div className="relative z-20 focus-within:z-[300]">

            <AppInfoCard

              className="!overflow-visible"

            >

              <label

                htmlFor="vendorId"

                className={

                  labelClassName

                }

              >

                ผู้จำหน่าย

              </label>



              <SearchableSelect

                id="vendorId"

                value={vendorId}

                options={

                  vendorOptions

                }

                placeholder="เลือกผู้จำหน่าย"

                searchPlaceholder="พิมพ์ค้นหาผู้จำหน่าย..."

                emptyText="ไม่พบผู้จำหน่าย"

                onChange={

                  setVendorId

                }

              />

            </AppInfoCard>

          </div>



          {/* CATEGORY */}



          <div className="relative z-20 focus-within:z-[300]">

            <AppInfoCard

              className="!overflow-visible"

            >

              <label

                htmlFor="category"

                className={

                  labelClassName

                }

              >

                หมวดหมู่

              </label>



              <SearchableSelect

                id="category"

                value={category}

                options={

                  categoryOptions

                }

                placeholder="เลือกหมวดหมู่"

                searchPlaceholder="พิมพ์ค้นหาหมวดหมู่..."

                required

                onChange={(

                  value

                ) => {

                  setCategory(

                    value

                  );

                  setName("");

                  setUnit("");

                  

                }}

              />

            </AppInfoCard>

          </div>



                      {/* MATERIAL */}
            <div className="relative z-20 focus-within:z-[300]">
              <AppInfoCard className="h-full !overflow-visible">
                <label htmlFor="materialName" className={labelClassName}>รายการพัสดุ</label>
                <EditableMaterialInput
                  id="materialName"
                  value={name}
                  options={materialOptions}
                  placeholder={category ? "พิมพ์หรือเลือกรายการพัสดุ" : "กรุณาเลือกหมวดหมู่ก่อน"}
                  disabled={!category}
                  required
                  onChange={handleMaterialNameChange}
                />
              </AppInfoCard>
            </div>

            {/* UNIT */}
            <div className="relative z-10">
              <AppInfoCard className="h-full">
                <label htmlFor="unit" className={labelClassName}>หน่วย</label>
                <input
                  id="unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="ระบุหรือแก้ไขหน่วย"
                  required
                  className={inputClassName}
                />
              </AppInfoCard>
            </div>

        </div>

{/* =================================================

            ACTIONS

        ================================================= */}



        <div

          className="

            mt-6



            flex

            flex-col-reverse

            gap-3



            border-t

            border-slate-200



            pt-5



            sm:flex-row

            sm:justify-end

          "

        >

          <AppButton

            href={backHref}

            variant="secondary"

            size="md"

          >

            ยกเลิก

          </AppButton>



          <AppButton

            type="submit"

            variant="success"

            size="md"

            disabled={

              isSubmitting ||

              isLoadingCode ||

              Boolean(codeError) ||

              !materialCode

            }

            icon={

              isSubmitting ? (

                <span

                  className="

                    h-4

                    w-4

                    animate-spin

                    rounded-full

                    border-2

                    border-current

                    border-t-transparent

                  "

                />

              ) : (

                <span>💾</span>

              )

            }

          >

            {isSubmitting

              ? "กำลังบันทึก..."

              : isLoadingCode

                ? "กำลังสร้างรหัส..."

                : "บันทึก"}

          </AppButton>

        </div>

      </AppCard>

    </form>

  );

}
