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
     CREATE-LIKE DISPLAY ROWS

     หน้า create มีลักษณะเป็นแบบฟอร์มหลายแถว
     หน้ารายละเอียดจึงเติมแถวว่างให้ครบ 15 แถว
     เพื่อให้หน้าตาและสัดส่วนใกล้เคียงกัน
  ======================================================= */

  const DISPLAY_ROW_COUNT = 15;

  const displayRows = Array.from(
    {
      length: Math.max(
        DISPLAY_ROW_COUNT,
        receive.items.length
      ),
    },
    (_, index) =>
      receive.items[index] ??
      null
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
          ใช้โครงสร้างเดียวกับ /receive/create
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
          "
        >
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
                max-w-[260px]
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

                  shadow-sm
                "
              >
                {receive.documentNo ||
                  "-"}
              </div>
            </div>
          </div>

          {/* =================================================
              TITLE
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
              การรับเข้าพัสดุ
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
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold
                  !text-slate-800
                "
              >
                วันที่รับเข้า
              </label>

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
                DOCUMENT NUMBER
            =============================================== */}

            <div>
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold
                  !text-slate-800
                "
              >
                เลขที่เอกสาร
              </label>

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
                  !text-slate-900

                  shadow-sm
                "
              >
                {receive.documentNo ||
                  "-"}
              </div>
            </div>

            {/* ===============================================
                VENDOR
            =============================================== */}

            <div>
              <label
                className="
                  mb-2
                  block

                  text-sm
                  font-extrabold
                  !text-slate-800
                "
              >
                ผู้จำหน่าย
              </label>

              <div
                className="
                  flex
                  h-11
                  w-full
                  items-center

                  overflow-hidden

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
                <span
                  className="
                    block
                    w-full
                    truncate
                  "
                >
                  {receive.vendor
                    ?.name || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              REMARK
          ================================================= */}

          <div
            className="
              mt-4
            "
          >
            <label
              className="
                mb-2
                block

                text-sm
                font-extrabold
                !text-slate-800
              "
            >
              หมายเหตุ
            </label>

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
              mb-3
              mt-6

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
                รายละเอียดรายการพัสดุที่รับเข้า
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
                min-w-[1400px]

                border-collapse

                bg-white

                text-sm
              "
            >
              {/* =============================================
                  HEADER
              ============================================= */}

              <thead>
                <tr>
                  <th
                    className="
                      w-[70px]
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
                    "
                  >
                    ลำดับ
                  </th>

                  <th
                    className="
                      min-w-[190px]
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
                    "
                  >
                    หมวดหมู่
                  </th>

                  <th
                    className="
                      min-w-[150px]
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
                    "
                  >
                    รหัสพัสดุ
                  </th>

                  <th
                    className="
                      min-w-[300px]
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
                    "
                  >
                    รายการพัสดุ
                  </th>

                  <th
                    className="
                      min-w-[120px]
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
                    "
                  >
                    หน่วย
                  </th>

                  <th
                    className="
                      min-w-[120px]
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
                    "
                  >
                    จำนวน
                  </th>

                  <th
                    className="
                      min-w-[150px]
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
                    "
                  >
                    ราคาต่อหน่วย
                  </th>

                  <th
                    className="
                      min-w-[170px]
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
                    "
                  >
                    วันผลิต
                  </th>

                  <th
                    className="
                      min-w-[170px]
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
                    "
                  >
                    วันหมดอายุ
                  </th>
                </tr>
              </thead>

              {/* =============================================
                  BODY
              ============================================= */}

              <tbody>
                {displayRows.map(
                  (
                    item,
                    index
                  ) => {
                    if (!item) {
                      return (
                        <tr
                          key={`empty-${index}`}
                          className={`
                            ${
                              index %
                                2 ===
                              0
                                ? "bg-white"
                                : "bg-slate-50/60"
                            }
                          `}
                        >
                          {/* ลำดับ */}

                          <td
                            className="
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

                          {/* หมวดหมู่ */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* รหัส */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* รายการ */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* หน่วย */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* จำนวน */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* ราคา */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* วันผลิต */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>

                          {/* วันหมดอายุ */}

                          <td
                            className="
                              border
                              border-black
                              px-3
                              py-3
                            "
                          >
                            <div
                              className="
                                h-10
                                w-full

                                rounded-xl

                                border
                                border-slate-200

                                bg-slate-50
                              "
                            />
                          </td>
                        </tr>
                      );
                    }

                    return (
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
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

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
                          </div>
                        </td>

                        {/* ===================================
                            MATERIAL CODE
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

                              font-extrabold
                              !text-slate-900
                            "
                          >
                            {item.material
                              .code ||
                              "-"}
                          </div>
                        </td>

                        {/* ===================================
                            MATERIAL NAME
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

                              font-semibold
                              !text-slate-900
                            "
                          >
                            {item.material
                              .name ||
                              "-"}
                          </div>
                        </td>

                        {/* ===================================
                            UNIT
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

                              font-bold
                              !text-slate-700
                            "
                          >
                            {item.material
                              .unit ||
                              "-"}
                          </div>
                        </td>

                        {/* ===================================
                            QTY
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

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
                          </div>
                        </td>

                        {/* ===================================
                            UNIT PRICE
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center
                              justify-end

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

                              font-bold
                              tabular-nums
                              !text-slate-900
                            "
                          >
                            {formatMoney(
                              item.unitPrice
                            )}
                          </div>
                        </td>

                        {/* ===================================
                            MANUFACTURE
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

                              font-bold
                              !text-slate-800
                            "
                          >
                            {formatThaiDate(
                              item.manufacture
                            )}
                          </div>
                        </td>

                        {/* ===================================
                            EXPIRY
                        =================================== */}

                        <td
                          className="
                            border
                            border-black

                            px-3
                            py-3
                          "
                        >
                          <div
                            className="
                              flex
                              min-h-10
                              w-full
                              items-center
                              justify-center

                              rounded-xl

                              border
                              border-slate-200

                              bg-slate-50

                              px-3

                              font-bold
                              !text-slate-800
                            "
                          >
                            {formatThaiDate(
                              item.expiry
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
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
                      bg-slate-100
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
                        text-base
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
                        text-base
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
                        text-base
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

          {/* =================================================
              SUMMARY FOOTER
          ================================================= */}

          <div
            className="
              mt-5

              flex
              flex-col
              gap-3

              border-t
              border-slate-200

              pt-5

              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >
            <div
              className="
                rounded-xl

                border
                border-slate-200

                bg-slate-50

                px-4
                py-2.5

                text-sm
                font-bold
                !text-slate-700
              "
            >
              จำนวนรวม{" "}
              <span
                className="
                  font-extrabold
                  !text-slate-900
                "
              >
                {totalQty.toLocaleString(
                  "th-TH"
                )}
              </span>{" "}
              หน่วย
            </div>

            <div
              className="
                rounded-xl

                border
                border-slate-200

                bg-slate-50

                px-4
                py-2.5

                text-sm
                font-bold
                !text-slate-700
              "
            >
              มูลค่ารวม{" "}
              <span
                className="
                  font-extrabold
                  !text-slate-900
                "
              >
                {formatMoney(
                  totalAmount
                )}
              </span>{" "}
              บาท
            </div>
          </div>
        </div>
      </AppCard>
    </AppPage>
  );
}