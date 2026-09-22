import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

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

const categoryLabel: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

/* =========================================================
   วันที่ไทยแบบย่อ
   ตัวอย่าง 22 ก.ย. 69
========================================================= */

const thaiShortMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiShortDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month =
    thaiShortMonths[
      date.getMonth()
    ];

  const buddhistYear = String(
    date.getFullYear() + 543
  ).slice(-2);

  return `${day} ${month} ${buddhistYear}`;
}

/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(
  value: number | string
) {
  return Number(value).toLocaleString(
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
  const { id } = await params;

  const receive =
    await prisma.receive.findUnique({
      where: {
        id: Number(id),
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
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden

          rounded-[28px]

          border
          border-slate-300

          bg-white/85

          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <div
          className="
            flex
            items-center
            gap-3

            border-b
            border-black

            bg-white/70

            px-5
            py-4

            sm:px-6
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

              bg-blue-50

              text-xl

              shadow-sm

              ring-1
              ring-blue-100
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
              ข้อมูลเอกสาร
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              ข้อมูลอ้างอิงการรับเข้าพัสดุ
            </p>
          </div>
        </div>

        {/* ===================================================
            INFORMATION GRID
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4

            p-4

            sm:grid-cols-2
            sm:p-6
          "
        >
          {/* ===============================================
              วันที่รับเข้า
          =============================================== */}

          <div
            className="
              rounded-[16px]

              border
              border-slate-300

              bg-white

              p-4
            "
          >
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              วันที่รับเข้า
            </p>

            <p
              className="
                mt-1.5

                text-base
                font-extrabold
                !text-slate-900

                sm:text-lg
              "
            >
              {formatThaiShortDate(
                receive.receiveDate
              )}
            </p>
          </div>

          {/* ===============================================
              เลขที่เอกสาร
          =============================================== */}

          <div
            className="
              rounded-[16px]

              border
              border-slate-300

              bg-white

              p-4
            "
          >
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              เลขที่เอกสาร
            </p>

            <p
              className="
                mt-1.5

                break-words

                text-base
                font-extrabold
                !text-slate-900

                sm:text-lg
              "
            >
              {receive.documentNo}
            </p>
          </div>

          {/* ===============================================
              ผู้จำหน่าย
          =============================================== */}

          <div
            className="
              rounded-[16px]

              border
              border-slate-300

              bg-white

              p-4
            "
          >
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              ผู้จำหน่าย
            </p>

            <p
              className="
                mt-1.5

                break-words

                text-base
                font-extrabold
                !text-slate-900

                sm:text-lg
              "
            >
              {receive.vendor.name}
            </p>
          </div>

          {/* ===============================================
              จำนวนรายการ
          =============================================== */}

          <div
            className="
              rounded-[16px]

              border
              border-slate-300

              bg-white

              p-4
            "
          >
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              จำนวนรายการ
            </p>

            <p
              className="
                mt-1.5

                text-base
                font-extrabold
                !text-slate-900

                sm:text-lg
              "
            >
              {receive.items.length.toLocaleString(
                "th-TH"
              )}{" "}
              รายการ
            </p>
          </div>

          {/* ===============================================
              หมายเหตุ
          =============================================== */}

          <div
            className="
              rounded-[16px]

              border
              border-slate-300

              bg-white

              p-4

              sm:col-span-2
            "
          >
            <p
              className="
                text-sm
                font-bold
                !text-slate-500
              "
            >
              หมายเหตุ
            </p>

            <p
              className="
                mt-1.5

                whitespace-pre-wrap
                break-words

                text-base
                font-semibold
                leading-relaxed
                !text-slate-900
              "
            >
              {receive.remark || "-"}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MATERIAL TABLE CARD
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0
          overflow-hidden

          rounded-[28px]

          border
          border-slate-300

          bg-white/85

          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            TABLE CARD HEADER
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2

            border-b
            border-black

            bg-white/70

            px-5
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
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
              รายการพัสดุรับเข้า
            </h2>

            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              รายละเอียดพัสดุภายในเอกสารรับเข้าฉบับนี้
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2

              rounded-full

              border
              border-slate-300

              bg-slate-100/80

              px-3
              py-1.5

              text-sm
              font-extrabold
              !text-slate-700
            "
          >
            <span>ทั้งหมด</span>

            <span
              className="
                inline-flex
                min-w-6
                items-center
                justify-center

                rounded-full

                bg-white

                px-2
                py-0.5

                !text-slate-900

                shadow-sm
              "
            >
              {receive.items.length.toLocaleString(
                "th-TH"
              )}
            </span>
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div
          className="
            w-full
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              w-full
              min-w-[1100px]

              border-collapse

              border
              border-black

              bg-white
            "
          >
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
                ].map(
                  (tableTitle) => (
                    <th
                      key={tableTitle}
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-4
                        py-4

                        text-center
                        text-base
                        font-extrabold
                        !text-white

                        sm:text-lg
                      "
                    >
                      {tableTitle}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {receive.items.length >
              0 ? (
                receive.items.map(
                  (
                    item: ReceiveItem,
                    index: number
                  ) => (
                    <tr
                      key={item.id}
                      className={`
                        transition-colors
                        duration-200

                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =====================================
                          ลำดับ
                      ===================================== */}

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

                      {/* =====================================
                          หมวดหมู่
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          font-bold
                          !text-slate-700
                        "
                      >
                        {categoryLabel[
                          item.material
                            .category
                        ] ??
                          item.material
                            .category}
                      </td>

                      {/* =====================================
                          รหัสพัสดุ
                      ===================================== */}

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
                        <span
                          className="
                            inline-flex
                            min-h-[32px]
                            min-w-[80px]
                            items-center
                            justify-center

                            rounded-[10px]

                            border
                            border-black

                            bg-white

                            px-3
                            py-1

                            text-center
                            text-sm
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {item.material.code ||
                            "-"}
                        </span>
                      </td>

                      {/* =====================================
                          รายการพัสดุ
                      ===================================== */}

                      <td
                        className="
                          min-w-[240px]

                          border
                          border-black

                          px-4
                          py-3.5

                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {item.material.name ||
                          "-"}
                      </td>

                      {/* =====================================
                          หน่วย
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {item.material.unit ||
                          "-"}
                      </td>

                      {/* =====================================
                          จำนวน
                      ===================================== */}

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
                        <span
                          className="
                            inline-flex
                            min-h-[32px]
                            min-w-[70px]
                            items-center
                            justify-center

                            rounded-[10px]

                            border
                            border-black

                            bg-white

                            px-3
                            py-1

                            text-center
                            text-sm
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {item.qty.toLocaleString(
                            "th-TH"
                          )}
                        </span>
                      </td>

                      {/* =====================================
                          ราคาต่อหน่วย
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-right
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {formatMoney(
                          item.unitPrice
                        )}
                      </td>

                      {/* =====================================
                          วันผลิต
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          item.manufacture
                        )}
                      </td>

                      {/* =====================================
                          วันหมดอายุ
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          font-bold
                          !text-slate-700
                        "
                      >
                        {formatThaiShortDate(
                          item.expiry
                        )}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

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

                          bg-slate-100

                          text-3xl

                          shadow-inner
                        "
                      >
                        📦
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        ไม่พบรายการพัสดุในเอกสารนี้
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          !text-slate-500
                        "
                      >
                        เอกสารรับเข้านี้ยังไม่มีรายการพัสดุ
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppPage>
  );
}