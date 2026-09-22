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

function formatThaiDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

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

function formatMoney(value: number | string) {
  return Number(value).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   PAGE
========================================================= */

export default async function ReceiveDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const receive = await prisma.receive.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      vendor: true,

      items: {
        include: {
          material: true,
        },
      },
    },
  });

  if (!receive) {
    notFound();
  }

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📄"
        title="รายละเอียดเอกสารรับเข้า"
        subtitle="รายละเอียดรายการรับเข้าพัสดุ"
        actions={
          <AppButton
            href="/receive"
            variant="back"
            size="md"
            icon={<span>←</span>}
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          DOCUMENT INFORMATION

          ใช้ AppCard กลางของระบบ
      ===================================================== */}

      <AppCard
        className="
          relative
          w-full
          min-w-0
          overflow-visible
          p-4
          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            TITLE
            ไม่มีเส้นดำใต้หัวข้อ
        =================================================== */}

        <div className="mb-5">
          <h2
            className="
              text-lg
              font-black
              tracking-tight
              !text-slate-900
              sm:text-xl
            "
          >
            ข้อมูลเอกสาร
          </h2>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              !text-slate-500
            "
          >
            ข้อมูลอ้างอิงการรับเข้าพัสดุ
          </p>
        </div>

        {/* ===================================================
            INFORMATION GRID
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
          "
        >
          {/* =================================================
              วันที่รับเข้า
          ================================================= */}

          <AppInfoCard
            label="วันที่รับเข้า"
            value={formatThaiDate(
              receive.receiveDate
            )}
          />

          {/* =================================================
              เลขที่เอกสาร
          ================================================= */}

          <AppInfoCard
            label="เลขที่เอกสาร"
            value={receive.documentNo}
          />

          {/* =================================================
              ผู้จำหน่าย
          ================================================= */}

          <AppInfoCard
            label="ผู้จำหน่าย"
            value={receive.vendor.name}
          />

          {/* =================================================
              จำนวนรายการ
              อยู่ระดับเดียวกับผู้จำหน่าย
          ================================================= */}

          <AppInfoCard
            label="จำนวนรายการ"
            value={`${receive.items.length.toLocaleString(
              "th-TH"
            )} รายการ`}
          />

          {/* =================================================
              หมายเหตุ
              เต็มความกว้าง 2 คอลัมน์
          ================================================= */}

          <AppInfoCard
            label="หมายเหตุ"
            value={receive.remark || "-"}
            className="
              md:col-span-2
              min-h-[96px]
            "
          />
        </div>
      </AppCard>

      {/* =====================================================
          MATERIAL TABLE

          ใช้ AppTableCard กลางของระบบ
      ===================================================== */}

      <AppTableCard
        title="รายการพัสดุรับเข้า"
        subtitle="รายละเอียดพัสดุภายในเอกสารรับเข้าฉบับนี้"
        count={receive.items.length}
        className="
          w-full
          min-w-0
        "
      >
        {/* ===================================================
            TABLE
        =================================================== */}

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
              min-w-[1100px]
              border-collapse
              bg-white
              text-sm
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "หมวดหมู่",
                  "รหัสพัสดุ",
                  "รายการพัสดุ",
                  "หน่วย",
                  "จำนวน",
                  "ราคาต่อหน่วย",
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
                      text-base
                      font-extrabold
                      !text-white

                      sm:px-4
                      sm:text-lg
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {receive.items.length === 0 ? (
                /* =============================================
                   EMPTY STATE
                ============================================= */

                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-black

                      bg-white

                      px-4
                      py-14

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center

                          rounded-[20px]

                          border
                          border-slate-200/80

                          bg-white/90

                          text-3xl

                          shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]

                          ring-1
                          ring-black/[0.025]

                          backdrop-blur-xl
                        "
                      >
                        📦
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight
                          !text-slate-900
                        "
                      >
                        ไม่พบรายการพัสดุ
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        ไม่มีรายการพัสดุในเอกสารรับเข้าฉบับนี้
                      </p>
                    </div>
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
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ลำดับ
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {index + 1}
                      </td>

                      {/* =======================================
                          หมวดหมู่
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          font-bold
                          !text-slate-800
                        "
                      >
                        {categoryLabel[
                          item.material.category
                        ] ??
                          item.material.category}
                      </td>

                      {/* =======================================
                          รหัสพัสดุ
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {item.material.code || "-"}
                      </td>

                      {/* =======================================
                          รายการพัสดุ
                      ======================================= */}

                      <td
                        className="
                          min-w-[220px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-bold
                          !text-slate-900
                        "
                      >
                        {item.material.name || "-"}
                      </td>

                      {/* =======================================
                          หน่วย
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-800
                        "
                      >
                        {item.material.unit || "-"}
                      </td>

                      {/* =======================================
                          จำนวน
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {item.qty.toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* =======================================
                          ราคาต่อหน่วย
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

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

                      {/* =======================================
                          วันผลิต
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-800
                        "
                      >
                        {formatThaiDate(
                          item.manufacture
                        )}
                      </td>

                      {/* =======================================
                          วันหมดอายุ
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-800
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
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}