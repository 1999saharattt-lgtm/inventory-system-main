import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type ReceiveItem = {
  id: number;
  qty: number;
  unitPrice: number | string;
  manufacture: Date | null;
  expiry: Date | null;

  material: {
    category: string;
    code: string;
    name: string;
    unit: string;
  };
};

/* =========================================================
   CATEGORY
========================================================= */

const categoryLabel: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   THAI DATE
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

function formatThaiDate(
  date: Date | string | null
) {
  if (!date) {
    return "-";
  }

  const d =
    date instanceof Date
      ? date
      : new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return `${d.getDate()} ${
    thaiMonths[d.getMonth()]
  } ${d.getFullYear() + 543}`;
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number | string
) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "0.00";
  }

  return numberValue.toLocaleString(
    "th-TH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function ReceiveDetailPage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

  const receiveId = Number(id);

  if (
    !Number.isInteger(receiveId) ||
    receiveId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     RECEIVE
  ======================================================= */

  const receive =
    await prisma.receive.findUnique({
      where: {
        id: receiveId,
      },

      include: {
        vendor: true,

        items: {
          include: {
            material: true,
          },

          orderBy: {
            id: "asc",
          },
        },
      },
    });

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!receive) {
    notFound();
  }

  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalQty =
    receive.items.reduce(
      (total, item) =>
        total + Number(item.qty),
      0
    );

  const totalAmount =
    receive.items.reduce(
      (total, item) =>
        total +
        Number(item.qty) *
          Number(item.unitPrice),
      0
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
        icon="📥"
        title="รายละเอียดเอกสารรับเข้า"
        subtitle="รายละเอียดรายการรับเข้าพัสดุ"
        actions={
          <AppButton
            href="/receive"
            variant="back"
            size="md"
            icon={
              <span aria-hidden="true">
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          DOCUMENT INFORMATION
      ===================================================== */}

      <AppCard
        className="
          relative
          overflow-visible
          p-4
          sm:p-5
        "
      >
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-[15px]
              bg-blue-50/90
              text-xl
              shadow-sm
              ring-1
              ring-blue-100/80
            "
          >
            🧾
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                !text-slate-900
                sm:text-xl
              "
            >
              ข้อมูลการรับเข้า
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ข้อมูลวันที่ เอกสาร และผู้จำหน่าย
            </p>
          </div>
        </div>

        <div
          className="
            grid
            min-w-0
            gap-4
            md:grid-cols-2
          "
        >
          {/* วันที่รับเข้า */}

          <AppInfoCard>
            <div
              className="
                mb-2
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              วันที่รับเข้า
            </div>

            <div
              className="
                text-base
                font-bold
                !text-slate-900
              "
            >
              {formatThaiDate(
                receive.receiveDate
              )}
            </div>
          </AppInfoCard>

          {/* เลขที่เอกสาร */}

          <AppInfoCard>
            <div
              className="
                mb-2
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              เลขที่เอกสาร
            </div>

            <div
              className="
                break-words
                text-base
                font-bold
                !text-slate-900
              "
            >
              {receive.documentNo || "-"}
            </div>
          </AppInfoCard>

          {/* ผู้จำหน่าย */}

          <AppInfoCard
            className="
              md:col-span-2
            "
          >
            <div
              className="
                mb-2
                text-base
                font-extrabold
                !text-slate-800
              "
            >
              ผู้จำหน่าย
            </div>

            <div
              className="
                break-words
                text-base
                font-bold
                !text-slate-900
              "
            >
              {receive.vendor?.name || "-"}
            </div>
          </AppInfoCard>
        </div>
      </AppCard>

      {/* =====================================================
          MATERIAL TABLE
          ใช้ AppTableCard ตัวกลาง
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุรับเข้า"
        subtitle={`รายละเอียดพัสดุภายในเอกสารรับเข้าฉบับนี้ • ทั้งหมด ${receive.items.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          relative
          z-10
          overflow-visible
        "
      >
        <div
          className="
            relative
            w-full
            overflow-x-auto
            overflow-y-visible
          "
        >
          <table
            className="
              relative
              w-full
              min-w-[1200px]
              border-collapse
              bg-white
              text-sm
            "
          >
            {/* =============================================
                TABLE HEADER
            ============================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รายการพัสดุ",
                  "หน่วย",
                  "ราคา",
                  "จำนวน",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title) => (
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
                ))}
              </tr>
            </thead>

            {/* =============================================
                TABLE BODY
            ============================================= */}

            <tbody>
              {receive.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      border
                      border-black
                      px-4
                      py-10
                      text-center
                      font-bold
                      !text-slate-500
                    "
                  >
                    ไม่พบรายการพัสดุ
                  </td>
                </tr>
              ) : (
                receive.items.map(
                  (
                    item: ReceiveItem,
                    index: number
                  ) => (
                    <tr
                      key={item.id}
                      className={`
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/50"
                        }

                        transition-colors
                        duration-200
                        hover:bg-blue-50/70
                      `}
                    >
                      {/* ลำดับ */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                          !text-slate-800
                        "
                      >
                        {index + 1}
                      </td>

                      {/* หมวดหมู่ */}

                      <td
                        className="
                          min-w-[210px]
                          border
                          border-black
                          px-3
                          py-3
                          font-semibold
                          !text-slate-900
                        "
                      >
                        {categoryLabel[
                          item.material.category
                        ] ??
                          item.material.category}
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          min-w-[320px]
                          border
                          border-black
                          px-3
                          py-3
                          font-semibold
                          !text-slate-900
                        "
                      >
                        <div
                          className="
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {item.material.code ||
                            "-"}
                        </div>

                        <div
                          className="
                            mt-1
                            !text-slate-700
                          "
                        >
                          {item.material.name ||
                            "-"}
                        </div>
                      </td>

                      {/* หน่วย */}

                      <td
                        className="
                          min-w-[120px]
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                          !text-slate-900
                        "
                      >
                        {item.material.unit ||
                          "-"}
                      </td>

                      {/* ราคา */}

                      <td
                        className="
                          min-w-[150px]
                          border
                          border-black
                          px-3
                          py-3
                          text-right
                          font-bold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {formatMoney(
                          item.unitPrice
                        )}
                      </td>

                      {/* จำนวน */}

                      <td
                        className="
                          min-w-[120px]
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {Number(
                          item.qty
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* วันผลิต */}

                      <td
                        className="
                          min-w-[200px]
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                          !text-slate-900
                        "
                      >
                        {formatThaiDate(
                          item.manufacture
                        )}
                      </td>

                      {/* วันหมดอายุ */}

                      <td
                        className="
                          min-w-[200px]
                          border
                          border-black
                          px-3
                          py-3
                          text-center
                          font-bold
                          !text-slate-900
                        "
                      >
                        {formatThaiDate(
                          item.expiry
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>

            {/* =============================================
                SUMMARY
            ============================================= */}

            {receive.items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50">
                  <td
                    colSpan={4}
                    className="
                      border
                      border-black
                      px-4
                      py-4
                      text-right
                      font-extrabold
                      !text-slate-900
                    "
                  >
                    รวม
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                      text-right
                      font-extrabold
                      tabular-nums
                      !text-slate-900
                    "
                  >
                    {formatMoney(
                      totalAmount
                    )}
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-4
                      text-center
                      font-extrabold
                      tabular-nums
                      !text-slate-900
                    "
                  >
                    {totalQty.toLocaleString(
                      "th-TH"
                    )}
                  </td>

                  <td
                    colSpan={2}
                    className="
                      border
                      border-black
                      px-3
                      py-4
                    "
                  />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </AppTableCard>

      {/* =====================================================
          REMARK
          อยู่ด้านล่างตารางเหมือนมาตรฐาน
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0
          overflow-visible
          p-4
          sm:p-5
        "
      >
        <AppInfoCard>
          <div
            className="
              mb-2
              text-base
              font-extrabold
              !text-slate-800
            "
          >
            หมายเหตุ
          </div>

          <div
            className="
              min-h-[80px]
              whitespace-pre-wrap
              break-words
              text-base
              font-bold
              leading-relaxed
              !text-slate-900
            "
          >
            {receive.remark || "-"}
          </div>
        </AppInfoCard>
      </AppCard>
    </AppPage>
  );
}