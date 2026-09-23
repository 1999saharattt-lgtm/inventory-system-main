import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

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
  const numberValue =
    Number(value);

  if (
    Number.isNaN(numberValue)
  ) {
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

  const receiveId =
    Number(id);

  if (
    !Number.isInteger(
      receiveId
    ) ||
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
        total +
        Number(item.qty),
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
          รูปแบบเดียวกับ /receive/create
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
              <span
                aria-hidden="true"
              >
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          MAIN CARD
          ใช้ Card หลักแบบเดียวกับ /receive/create
      ===================================================== */}

      <AppCard
        className="
          relative
          z-0

          w-full
          min-w-0

          overflow-visible

          p-4

          sm:p-5
          lg:p-6
        "
      >
        <div
          className="
            relative
            z-10

            w-full
            min-w-0

            overflow-visible

            bg-white
          "
        >
          {/* =================================================
              DOCUMENT NUMBER
              วางด้านขวาบนเหมือน Form
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
                max-w-[260px]
              "
            >
              <div
                className="
                  mb-1.5
                  text-sm
                  font-extrabold
                  !text-slate-700
                "
              >
                เลขที่เอกสาร
              </div>

              <div
                className="
                  flex
                  h-10
                  w-full
                  items-center

                  rounded-xl

                  border
                  border-slate-300

                  bg-slate-50

                  px-3

                  text-sm
                  font-extrabold
                  !text-slate-900
                "
              >
                {receive.documentNo ||
                  "-"}
              </div>
            </div>
          </div>

          {/* =================================================
              FORM TITLE
          ================================================= */}

          <div
            className="
              border-b
              border-slate-200

              pb-5

              text-center
            "
          >
            <h2
              className="
                text-2xl
                font-extrabold
                !text-slate-900
              "
            >
              รายละเอียดการรับเข้าพัสดุ
            </h2>
          </div>

          {/* =================================================
              DOCUMENT INFORMATION
          ================================================= */}

          <div
            className="
              mt-6

              grid
              gap-4

              md:grid-cols-3
            "
          >
            {/* ===============================================
                RECEIVE DATE
            =============================================== */}

            <div>
              <div
                className="
                  mb-2
                  text-sm
                  font-extrabold
                  !text-slate-800
                "
              >
                วันที่รับเข้า
              </div>

              <div
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-between

                  rounded-xl

                  border
                  border-slate-300

                  bg-white

                  px-3

                  text-sm
                  font-bold
                  !text-slate-900

                  shadow-sm
                "
              >
                <span>
                  {formatThaiDate(
                    receive.receiveDate
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className="
                    shrink-0
                    text-lg
                  "
                >
                  📅
                </span>
              </div>
            </div>

            {/* ===============================================
                VENDOR
            =============================================== */}

            <div>
              <div
                className="
                  mb-2
                  text-sm
                  font-extrabold
                  !text-slate-800
                "
              >
                ผู้จำหน่าย
              </div>

              <div
                className="
                  flex
                  min-h-11
                  w-full
                  items-center

                  rounded-xl

                  border
                  border-slate-300

                  bg-white

                  px-3
                  py-2

                  text-sm
                  font-bold
                  !text-slate-900

                  shadow-sm
                "
              >
                {receive.vendor
                  ?.name || "-"}
              </div>
            </div>

            {/* ===============================================
                ITEM COUNT
            =============================================== */}

            <div>
              <div
                className="
                  mb-2
                  text-sm
                  font-extrabold
                  !text-slate-800
                "
              >
                จำนวนรายการ
              </div>

              <div
                className="
                  flex
                  h-11
                  w-full
                  items-center

                  rounded-xl

                  border
                  border-slate-300

                  bg-white

                  px-3

                  text-sm
                  font-bold
                  tabular-nums
                  !text-slate-900

                  shadow-sm
                "
              >
                {receive.items.length.toLocaleString(
                  "th-TH"
                )}{" "}
                รายการ
              </div>
            </div>
          </div>

          {/* =================================================
              REMARK
          ================================================= */}

          <div className="mt-4">
            <div
              className="
                mb-2
                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              หมายเหตุ
            </div>

            <div
              className="
                min-h-[72px]
                w-full

                rounded-xl

                border
                border-slate-300

                bg-white

                px-3
                py-3

                text-sm
                font-semibold
                leading-relaxed
                !text-slate-900

                shadow-sm

                whitespace-pre-wrap
                break-words
              "
            >
              {receive.remark ||
                "-"}
            </div>
          </div>

          {/* =================================================
              TABLE TITLE
          ================================================= */}

          <div
            className="
              mt-6
              mb-3

              flex
              flex-col
              gap-1

              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <h3
                className="
                  text-lg
                  font-extrabold
                  !text-slate-900
                "
              >
                รายการพัสดุรับเข้า
              </h3>

              <p
                className="
                  mt-1
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
                text-sm
                font-extrabold
                !text-slate-600
              "
            >
              {receive.items.length.toLocaleString(
                "th-TH"
              )}{" "}
              รายการ
            </div>
          </div>

          {/* =================================================
              MATERIAL TABLE
          ================================================= */}

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
                min-w-[1250px]

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
                    "รหัสพัสดุ",
                    "รายการพัสดุ",
                    "หน่วย",
                    "จำนวน",
                    "ราคาต่อหน่วย",
                    "วันผลิต",
                    "วันหมดอายุ",
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

                          px-4
                          py-4

                          text-center
                          text-base
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

              {/* =============================================
                  TABLE BODY
              ============================================= */}

              <tbody>
                {receive.items
                  .length === 0 ? (
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
                            border-slate-200

                            bg-slate-50

                            text-3xl
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
                          transition-colors
                          duration-200

                          ${
                            index %
                              2 ===
                            0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }

                          hover:bg-blue-50/70
                        `}
                      >
                        {/* ===================================
                            NUMBER
                        =================================== */}

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

                        {/* ===================================
                            CATEGORY
                        =================================== */}

                        <td
                          className="
                            min-w-[190px]

                            border
                            border-black

                            px-3
                            py-3

                            font-semibold
                            !text-slate-900
                          "
                        >
                          {categoryLabel[
                            item
                              .material
                              .category
                          ] ??
                            item
                              .material
                              .category}
                        </td>

                        {/* ===================================
                            MATERIAL CODE
                        =================================== */}

                        <td
                          className="
                            min-w-[140px]

                            border
                            border-black

                            px-3
                            py-3

                            text-center
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {item.material
                            .code ||
                            "-"}
                        </td>

                        {/* ===================================
                            MATERIAL NAME
                        =================================== */}

                        <td
                          className="
                            min-w-[300px]

                            border
                            border-black

                            px-3
                            py-3

                            font-semibold
                            !text-slate-900
                          "
                        >
                          {item.material
                            .name ||
                            "-"}
                        </td>

                        {/* ===================================
                            UNIT
                        =================================== */}

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
                          {item.material
                            .unit ||
                            "-"}
                        </td>

                        {/* ===================================
                            QTY
                        =================================== */}

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

                        {/* ===================================
                            UNIT PRICE
                        =================================== */}

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

                        {/* ===================================
                            MANUFACTURE DATE
                        =================================== */}

                        <td
                          className="
                            min-w-[170px]

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

                        {/* ===================================
                            EXPIRY DATE
                        =================================== */}

                        <td
                          className="
                            min-w-[170px]

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

              {receive.items.length >
                0 && (
                <tfoot>
                  <tr
                    className="
                      bg-slate-50
                    "
                  >
                    <td
                      colSpan={5}
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
        </div>
      </AppCard>
    </AppPage>
  );
}