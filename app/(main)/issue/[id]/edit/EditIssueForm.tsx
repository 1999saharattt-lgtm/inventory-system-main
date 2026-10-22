"use client";
import {
  useState,
  useRef,
  useEffect,
} from "react";
import { updateIssue } from "./action";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";
type SearchOption = { value: string; label: string };

function SearchSelect({ value, options, onChange, disabled = false, placeholder = "เลือกข้อมูล", className = "", name, required = false }: {
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  useEffect(() => {
    function outside(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const matches = options.filter((option) => option.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return (
    <div ref={root} className="relative w-full min-w-0">
      {name && <input type="hidden" name={name} value={value} />}
      {required && <input tabIndex={-1} required value={value} onChange={() => {}} className="pointer-events-none absolute h-px w-px opacity-0" />}
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={open ? search : (selected?.label ?? "")}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={placeholder}
          aria-expanded={open}
          role="combobox"
          className={`${className} pr-9`}
          onFocus={() => { setSearch(""); setOpen(true); }}
          onChange={(event) => { setSearch(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && open) {
              event.preventDefault();
              if (matches.length > 0) { onChange(matches[0].value); setOpen(false); setSearch(""); }
            }
          }}
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">⌄</span>
      </div>
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">ไม่พบข้อมูล</div>
          ) : matches.map((option) => (
            <button key={option.value} type="button" className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50 ${option.value === value ? "bg-blue-50 font-bold" : ""}`}
              onClick={() => { onChange(option.value); setOpen(false); setSearch(""); }}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TYPES
========================================================= */
type Department = {
  id: number;
  name: string;
};
type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  latestPrice: number;
  balance: number;
};
type ReceiveItem = {
  id: number;
  materialId: number;
  qty: number;
  manufacture: Date | null;
  expiry: Date | null;
};
type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number | null;
  department?: {
    id: number;
  } | null;
  section?: {
    departmentId: number | null;
  } | null;
};
type IssueItem = {
  id: number;
  materialId: number;
  qty: number;
  issuedQty: number;
  remark: string | null;
  receiveItemId: number | null;
  material: {
    category: string;
  };
};
type Issue = {
  id: number;
  issueDate: Date | string;
  documentNo: string;
  departmentId: number;
  officerId?: number | null;
  status: string;
  items: IssueItem[];
  officer?: {
    id: number;
    firstName: string;
    lastName: string;
    departmentId: number | null;
    department?: {
      id: number;
    } | null;
    section?: {
      departmentId: number | null;
    } | null;
  } | null;
};
type Props = {
  issue: Issue;
  departments: Department[];
  materials: Material[];
  receiveItems: ReceiveItem[];
  officers: Officer[];
  canChangeDepartment: boolean;
};
type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
  issuedQty: string;
  remark: string;
  receiveItemId: string;
};
/* =========================================================
   CATEGORY
========================================================= */
const categories = [
  {
    value: "OFFICE",
    label: "วัสดุสำนักงาน",
  },
  {
    value: "COMPUTER",
    label: "วัสดุคอมพิวเตอร์",
  },
  {
    value: "ELECTRIC",
    label: "วัสดุไฟฟ้าและวิทยุ",
  },
  {
    value: "HOUSEHOLD",
    label: "วัสดุงานบ้านและงานครัว",
  },
  {
    value: "VEHICLE",
    label: "วัสดุยานพาหนะ",
  },
  {
    value: "PRINTING",
    label: "วัสดุสื่อสิ่งพิมพ์",
  },
];
/* =========================================================
   THAI MONTHS
========================================================= */
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
/* =========================================================
   DATE INPUT VALUE
========================================================= */
function toDateInputValue(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }
  if (
    typeof value === "string"
  ) {
    const match =
      value.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  const date =
    value instanceof Date
      ? value
      : new Date(value);
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}
/* =========================================================
   THAI DATE
========================================================= */
function formatThaiDate(
  dateString: string
) {
  if (!dateString) {
    return "";
  }
  const match =
    dateString.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );
  if (!match) {
    return "";
  }
  const year =
    Number(match[1]);
  const month =
    Number(match[2]);
  const day =
    Number(match[3]);
  if (
    !year ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }
  return `${String(
    day
  ).padStart(
    2,
    "0"
  )} ${
    thaiMonths[
      month - 1
    ]
  } ${year + 543}`;
}
/* =========================================================
   EMPTY ROW
========================================================= */
function createEmptyRow(): IssueRow {
  return {
    category: "",
    materialId: "",
    qty: "",
    issuedQty: "",
    remark: "",
    receiveItemId: "",
  };
}
/* =========================================================
   COMPONENT
========================================================= */
export default function EditIssueForm({
  issue,
  departments,
  materials,
  officers,
  canChangeDepartment,
}: Props) {
  const isPending =
    issue.status === "PENDING";
  const isApproved =
    issue.status === "APPROVED";
  const isEditable =
    isPending || isApproved;
  /* =======================================================
     DATE
  ======================================================= */
  const [
    issueDate,
    setIssueDate,
  ] = useState(
    toDateInputValue(
      issue.issueDate
    )
  );
  /* =======================================================
     DEPARTMENT
  ======================================================= */
  const [
    departmentId,
    setDepartmentId,
  ] = useState(
    String(
      issue.departmentId ??
        ""
    )
  );
  /* =======================================================
     OFFICER
  ======================================================= */
  const [
    officerId,
    setOfficerId,
  ] = useState(
    issue.officer?.id
      ? String(
          issue.officer.id
        )
      : ""
  );
  /* =======================================================
     DOCUMENT
  ======================================================= */
  const [
    documentValue,
    setDocumentValue,
  ] = useState(
    issue.documentNo
  );
  const [
    editDocumentNo,
    setEditDocumentNo,
  ] = useState(false);
  /* =======================================================
     ITEMS
  ======================================================= */
  const [items, setItems] =
    useState<IssueRow[]>(
      () => {
        const rows =
          issue.items.map(
            (item) => ({
              category:
                item.material
                  .category ??
                "",
              materialId:
                String(
                  item.materialId
                ),
              qty:
                String(
                  item.qty
                ),
              issuedQty:
                item.issuedQty == null || item.issuedQty === 0
                  ? ""
                  : String(item.issuedQty),
              remark:
                item.remark ??
                "",
              receiveItemId:
                item.receiveItemId !=
                null
                  ? String(
                      item.receiveItemId
                    )
                  : "",
            })
          );
        /*
         * พอ.101
         * ให้เหมือนหน้า create
         * 18 แถว
         */
        while (
          rows.length < 18
        ) {
          rows.push(
            createEmptyRow()
          );
        }
        return rows;
      }
    );
  /* =======================================================
     FILTER OFFICERS
  ======================================================= */
  const filteredOfficers =
    officers.filter(
      (officer) =>
        String(
          officer.departmentId
        ) === departmentId ||
        String(
          officer.section
            ?.departmentId
        ) === departmentId
    );
  /* =======================================================
     UPDATE ROW
  ======================================================= */
  function updateRow(
    index: number,
    key: keyof IssueRow,
    value: string
  ) {
    if (!isEditable) {
      return;
    }
    setItems(
      (current) => {
        const copy =
          current.map(
            (row) => ({
              ...row,
            })
          );
        copy[index] = {
          ...copy[index],
          [key]: value,
        };
        if (
          key === "category"
        ) {
          copy[index].materialId =
            "";
          copy[index].receiveItemId =
            "";
          copy[index].qty =
            "";
          copy[index].issuedQty =
            "";
        }
        if (
          key === "qty"
        ) {
          const newQty =
            Number(value);
          const currentIssued =
            Number(
              copy[index].issuedQty ||
                0
            );
          if (
            Number.isFinite(newQty) &&
            newQty >= 0 &&
            currentIssued > newQty
          ) {
            copy[index].issuedQty =
              String(newQty);
          }
        }
        if (
          key === "materialId"
        ) {
          copy[index].receiveItemId =
            "";
          copy[index].qty =
            "";
          copy[index].issuedQty =
            "";
        }
        return copy;
      }
    );
  }
  /* =======================================================
     UI
  ======================================================= */
  return (
    <div
      className="
        w-full
        min-w-0
        bg-white
      "
    >
      <form
        action={
          isEditable
            ? updateIssue
            : undefined
        }
        className="space-y-6"
      >
        {/* =================================================
            ISSUE ID
        ================================================= */}
        <input
          type="hidden"
          name="issueId"
          value={issue.id}
        />
        <input
          type="hidden"
          name="issueStatus"
          value={issue.status}
        />
        {isApproved && (
          <div
            className="
              rounded-[18px]
              border
              border-amber-200
              bg-amber-50/80
              px-4
              py-3
              text-sm
              font-bold
              leading-relaxed
              !text-amber-900
            "
          >
            ⚠️ ใบเบิกนี้บันทึกเบิกจ่ายแล้ว การบันทึกการแก้ไขต้องคืนสต็อกเดิม
            และตัดสต็อกใหม่ตามรายการที่แก้ไข
          </div>
        )}
        {/* =================================================
            DOCUMENT NUMBER
        ================================================= */}
        <div
          className="
            flex
            w-full
            justify-end
          "
        >
          <div
            className="
              w-full
              max-w-[220px]
            "
          >
            <label
              className="
                mb-1.5
                block
                text-sm
                font-extrabold
                !text-slate-700
              "
            >
              เลขที่เอกสาร
            </label>
            <input
              type="text"
              name="documentNo"
              value={
                documentValue
              }
              onChange={(event) =>
                setDocumentValue(
                  event.target
                    .value
                )
              }
              readOnly={
                !editDocumentNo ||
                !isEditable
              }
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                font-extrabold
                !text-slate-900
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                read-only:bg-slate-50
              "
            />
            {isEditable && (
              <label
                className="
                  mt-2
                  flex
                  w-fit
                  max-w-full
                  cursor-pointer
                  items-center
                  gap-2
                  whitespace-nowrap
                  text-xs
                  font-semibold
                  !text-slate-600
                "
              >
                <input
                  type="checkbox"
                  checked={
                    editDocumentNo
                  }
                  onChange={(
                    event
                  ) => {
                    const checked =
                      event.target
                        .checked;
                    setEditDocumentNo(
                      checked
                    );
                    if (
                      !checked
                    ) {
                      setDocumentValue(
                        issue.documentNo
                      );
                    }
                  }}
                  className="
                    h-4
                    w-4
                    shrink-0
                    cursor-pointer
                    rounded
                    border-slate-300
                  "
                />
                <span className="whitespace-nowrap">
                  แก้ไขเลขที่เอกสาร
                </span>
              </label>
            )}
          </div>
        </div>
        {/* =================================================
            DOCUMENT INFORMATION
        ================================================= */}
        <AppCard className="relative z-[5000] !mt-3 overflow-visible p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-blue-50/90 text-xl shadow-sm ring-1 ring-blue-100/80">🧾</div>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight !text-slate-900 sm:text-xl">ข้อมูลการเบิก</h2>
              <p className="mt-0.5 text-sm font-semibold !text-slate-500">ระบุวันที่ กลุ่มงาน และผู้ขอเบิก</p>
            </div>
          </div>
        <div
          className="
            grid
            gap-4
            md:grid-cols-3
          "
        >
          {/* ===============================================
              DATE
          =============================================== */}
          <AppInfoCard className="relative z-[7000] overflow-visible">
            <label
              className="
                mb-2
                block
                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              วันที่เบิก
            </label>
            <div className="relative w-full">
              <input
                type="date"
                name="issueDate"
                value={issueDate}
                disabled={!isEditable}
                onChange={(event) => setIssueDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold !text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {!isEditable && <input type="hidden" name="issueDate" value={issueDate} />}
              <div className="mt-1 text-xs text-slate-500">{formatThaiDate(issueDate)}</div>
            </div>
          </AppInfoCard>
          {/* ===============================================
              DEPARTMENT
          =============================================== */}
          <AppInfoCard className="relative z-[6000] overflow-visible">
            <label
              className="
                mb-2
                block
                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              หน่วยงาน / กลุ่มงาน
            </label>
            {(!canChangeDepartment ||
              !isEditable) && (
              <input
                type="hidden"
                name="departmentId"
                value={
                  departmentId
                }
              />
            )}
            <SearchSelect
              name={canChangeDepartment && isEditable ? "departmentId" : undefined}
              value={departmentId}
              disabled={!canChangeDepartment || !isEditable}
              onChange={(next) => { if (!canChangeDepartment || !isEditable) return; setDepartmentId(next); setOfficerId(""); }}
              placeholder="-- เลือกหน่วยงาน --"
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold !text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </AppInfoCard>
          {/* ===============================================
              REQUESTER
          =============================================== */}
          <AppInfoCard className="relative z-[5000] overflow-visible">
            <label
              className="
                mb-2
                block
                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              ผู้ขอเบิก
            </label>
            <SearchSelect
              name="officerId"
              value={officerId}
              disabled={!isEditable || !departmentId}
              required={isEditable}
              onChange={setOfficerId}
              placeholder="-- เลือกผู้ขอเบิก --"
              options={filteredOfficers.map((officer) => ({ value: String(officer.id), label: `${officer.firstName} ${officer.lastName}` }))}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold !text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {!isEditable &&
              officerId && (
                <input
                  type="hidden"
                  name="officerId"
                  value={
                    officerId
                  }
                />
              )}
          </AppInfoCard>
        </div>
        </AppCard>
        {/* =================================================
            TABLE
        ================================================= */}
        <AppTableCard
          title="รายการพัสดุที่ขอเบิก"
          subtitle={`ระบุหมวดหมู่ รายการ จำนวน และหมายเหตุ • ทั้งหมด ${items.length} รายการ`}
          className="relative z-10 overflow-visible"
        >
        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1400px]
              border-collapse
              bg-white
              text-sm
            "
          >
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "จำนวนที่ขอเบิก",
                  "จำนวนที่เบิกจ่าย",
                  "หน่วย",
                  "หมายเหตุ",
                ].map(
                  (title) => (
                    <th
                      key={title}
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-3
                        py-4
                        text-center
                        text-lg
                        font-extrabold
                        !text-white
                      "
                    >
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {items.map(
                (
                  row,
                  index
                ) => {
                  const list =
                    materials.filter(
                      (
                        material
                      ) =>
                        material.category ===
                        row.category
                    );
                  const selectedMaterial =
                    materials.find(
                      (
                        material
                      ) =>
                        String(
                          material.id
                        ) ===
                        row.materialId
                    );
                  const unit =
                    selectedMaterial
                      ?.unit ??
                    "";
                  return (
                    <tr
                      key={index}
                      className={`
                        transition-colors
                        duration-200
                        ${
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }
                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =====================================
                          NUMBER
                      ===================================== */}
                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {index + 1}
                      </td>
                      {/* =====================================
                          CATEGORY
                      ===================================== */}
                      <td
                        className="
                          min-w-[210px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <SearchSelect
                          value={row.category}
                          disabled={!isEditable}
                          onChange={(next) => updateRow(index, "category", next)}
                          placeholder="เลือกหมวดหมู่"
                          options={categories.map((category) => ({ value: category.value, label: category.label }))}
                          className="h-[46px] w-full rounded-[12px] border border-slate-300 bg-white px-3 font-semibold !text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </td>
                      {/* =====================================
                          MATERIAL
                      ===================================== */}
                      <td
                        className="
                          min-w-[330px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          type="hidden"
                          name={`items[${index}].materialId`}
                          value={
                            row.materialId
                          }
                        />
                        <input
                          type="hidden"
                          name={`items[${index}].receiveItemId`}
                          value={
                            row.receiveItemId
                          }
                        />
                        <SearchSelect
                          value={row.materialId}
                          disabled={!isEditable || !row.category}
                          onChange={(next) => updateRow(index, "materialId", next)}
                          placeholder={row.category ? "เลือกรายการพัสดุ" : "เลือกหมวดหมู่ก่อน"}
                          options={list.map((material) => ({ value: String(material.id), label: material.name }))}
                          className="h-[46px] w-full rounded-[12px] border border-slate-300 bg-white px-3 font-semibold !text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </td>
                      {/* =====================================
                          REQUEST QTY
                      ===================================== */}
                      <td
                        className="
                          min-w-[160px]
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        <input
                          name={`items[${index}].qty`}
                          type="number"
                          min="1"
                          value={
                            row.qty
                          }
                          disabled={
                            !isEditable
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "qty",
                              event.target
                                .value
                            )
                          }
                          className="
                            h-[46px]
                            w-full
                            rounded-[12px]
                            border
                            border-slate-300
                            bg-white
                            px-3
                            text-center
                            font-bold
                            !text-slate-900
                            outline-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                            [appearance:textfield]
                            [&::-webkit-inner-spin-button]:appearance-none
                            [&::-webkit-outer-spin-button]:appearance-none
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                          "
                        />
                      </td>
                      {/* =====================================
                          ISSUED QTY
                      ===================================== */}
                      <td
                        className="
                          min-w-[160px]
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                        "
                      >
                        <input
                          name={`items[${index}].issuedQty`}
                          type="number"
                          min="0"
                          max={
                            row.qty
                              ? Number(row.qty)
                              : undefined
                          }
                          value={
                            row.issuedQty
                          }
                          disabled={
                            !isEditable
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "issuedQty",
                              event.target.value
                            )
                          }
                          aria-label={`จำนวนที่เบิกจ่ายรายการที่ ${
                            index + 1
                          }`}
                          className="
                            h-[46px]
                            w-full
                            rounded-[12px]
                            border
                            border-slate-200
                            bg-white
                            px-3
                            text-center
                            font-bold
                            !text-slate-900
                            outline-none
                            transition
                            focus:border-blue-300
                            focus:ring-2
                            focus:ring-emerald-100
                            [appearance:textfield]
                            [&::-webkit-inner-spin-button]:appearance-none
                            [&::-webkit-outer-spin-button]:appearance-none
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                            disabled:!text-slate-500
                          "
                        />
                      </td>
                      {/* =====================================
                          UNIT
                      ===================================== */}
                      <td
                        className="
                          min-w-[120px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          type="text"
                          readOnly
                          value={unit}
                          className="
                            h-[46px]
                            w-full
                            rounded-[12px]
                            border
                            border-slate-300
                            bg-slate-50
                            px-3
                            text-center
                            font-bold
                            !text-slate-700
                            outline-none
                          "
                        />
                        <input
                          type="hidden"
                          name={`items[${index}].unit`}
                          value={unit}
                        />
                      </td>
                      {/* =====================================
                          REMARK
                      ===================================== */}
                      <td
                        className="
                          min-w-[240px]
                          border
                          border-black
                          px-3
                          py-3
                        "
                      >
                        <input
                          type="text"
                          name={`items[${index}].remark`}
                          value={
                            row.remark
                          }
                          disabled={
                            !isEditable
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              index,
                              "remark",
                              event.target
                                .value
                            )
                          }
                          placeholder="ระบุหมายเหตุ"
                          className="
                            h-[46px]
                            w-full
                            rounded-[12px]
                            border
                            border-slate-300
                            bg-white
                            px-3
                            font-semibold
                            !text-slate-900
                            outline-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                            disabled:cursor-not-allowed
                            disabled:bg-slate-100
                          "
                        />
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
        </AppTableCard>
        {/* =================================================
            SUBMIT
        ================================================= */}
        {isEditable && (
          <div
            className="
              flex
              justify-end
              border-t
              border-slate-200
              pt-5
            "
          >
            <AppButton
              type="submit"
              variant="success"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  💾
                </span>
              }
            >
              บันทึกการแก้ไข
            </AppButton>
          </div>
        )}
      </form>
    </div>
  );
}
