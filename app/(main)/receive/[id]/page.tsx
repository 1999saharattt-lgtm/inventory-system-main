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

/* =========================================================
   CATEGORY LABEL
========================================================= */

const categoryLabel: Record<
  string,
  string
> = {
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
  date: Date | null
) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (
    Number.isNaN(d.getTime())
  ) {
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
  return Number(
    value
  ).toLocaleString("th-TH", {
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

  const receive =
    await prisma.receive.findUnique(
      {
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
      }
    );

  if (!receive) {
    notFound();
  }

  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้มาตรฐานเดียวกับหน้าระบบ
      ===================================================== */}

      <AppPageHeader
        icon="📄"
        title="รายละเอียดเอกสารรับเข้า"
        subtitle="ตรวจสอบข้อมูลเอกสารและรายการพัสดุรับเข้า"
        actions={
          <>
            <AppButton
              href={`/receive/${receive.id}/edit`}
              variant="primary"
              size="md"
            >
              <span>✏️</span>
              <span>แก้ไข</span>
            </AppButton>

            <AppButton
              href="/receive"
              variant="back"
              size="md"
              icon={
                <span>←</span>
              }
            >
              กลับ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          DOCUMENT INFORMATION CARD
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden

          rounded-[28px]

          border
          border-slate-300

          bg-white/85

          p-4

          shadow-[0_22px_60px_-32px_rgba(15,23,42,0.4)]

          backdrop-blur-2xl

          sm:p-6
        "
      >
        {/* Ambient background */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20

            h-52
            w-52

            rounded-full

            bg-blue-400/10

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-20

            h-56
            w-56

            rounded-full

            bg-cyan-400/10

            blur-3xl
          "
        />

        <div className="relative">
          {/* =================================================
              INNER CARD
          ================================================= */}

          <div
            className="
              rounded-[24px]

              border
              border-slate-300

              bg-white/75

              p-4

              shadow-[0_12px_35px_-24px_rgba(15,23,42,0.3)]

              backdrop-blur-xl

              sm:p-5
            "
          >
            {/* ===============================================
                CARD HEADER
                ไม่มีเส้นดำใต้หัวข้อ
            =============================================== */}

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
                  วันที่ เอกสาร
                  และผู้จำหน่าย
                </p>
              </div>
            </div>

            {/* ===============================================
                INFORMATION GRID
            =============================================== */}

            <div
              className="
                grid
                min-w-0
                grid-cols-1
                gap-4

                md:grid-cols-2
              "
            >
              {/* =============================================
                  วันที่รับเข้า
              ============================================= */}

              <div className="min-w-0">
                <p
                  className="
                    mb-2

                    text-base
                    font-extrabold
                    !text-slate-800
                  "
                >
                  วันที่รับเข้า
                </p>

                <div
                  className="
                    flex
                    h-[52px]
                    w-full
                    min-w-0
                    items-center

                    rounded-[16px]

                    border
                    !border-black

                    bg-white

                    px-4

                    text-base
                    font-bold
                    !text-slate-900

                    shadow-sm
                  "
                >
                  {formatThaiDate(
                    receive.receiveDate
                  )}
                </div>
              </div>

              {/* =============================================
                  เลขที่เอกสาร
              ============================================= */}

              <div className="min-w-0">
                <p
                  className="
                    mb-2

                    text-base
                    font-extrabold
                    !text-slate-800
                  "
                >
                  เลขที่เอกสาร
                </p>

                <div
                  className="
                    flex
                    h-[52px]
                    w-full
                    min-w-0
                    items-center

                    rounded-[16px]

                    border
                    !border-black

                    bg-white

                    px-4

                    text-base
                    font-bold
                    !text-slate-900

                    shadow-sm
                  "
                >
                  <span
                    className="
                      min-w-0
                      truncate
                    "
                  >
                    {receive.documentNo}
                  </span>
                </div>
              </div>

              {/* =============================================
                  ผู้จำหน่าย
              ============================================= */}

              <div
                className="
                  min-w-0

                  md:col-span-2
                "
              >
                <p
                  className="
                    mb-2

                    text-base
                    font-extrabold
                    !text-slate-800
                  "
                >
                  ผู้จำหน่าย
                </p>

                <div
                  className="
                    flex
                    min-h-[52px]
                    w-full
                    min-w-0
                    items-center

                    rounded-[16px]

                    border
                    !border-black

                    bg-white

                    px-4
                    py-3

                    text-base
                    font-bold
                    !text-slate-900

                    shadow-sm
                  "
                >
                  <span
                    className="
                      min-w-0
                      break-words
                    "
                  >
                    {receive.vendor.name}
                  </span>
                </div>
              </div>

              {/* =============================================
                  จำนวนรายการ
              ============================================= */}

              <div className="min-w-0">
                <p
                  className="
                    mb-2

                    text-base
                    font-extrabold
                    !text-slate-800
                  "
                >
                  จำนวนรายการ
                </p>

                <div
                  className="
                    flex
                    h-[52px]
                    w-full
                    min-w-0
                    items-center

                    rounded-[16px]

                    border
                    !border-black

                    bg-white

                    px-4

                    text-base
                    font-bold
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

              {/* =============================================
                  หมายเหตุ
              ============================================= */}

              <div className="min-w-0">
                <p
                  className="
                    mb-2

                    text-base
                    font-extrabold
                    !text-slate-800
                  "
                >
                  หมายเหตุ
                </p>

                <div
                  className="
                    flex
                    min-h-[52px]
                    w-full
                    min-w-0
                    items-center

                    rounded-[16px]

                    border
                    !border-black

                    bg-white

                    px-4
                    py-3

                    text-base
                    font-bold
                    !text-slate-900

                    shadow-sm
                  "
                >
                  <span
                    className="
                      min-w-0
                      whitespace-pre-wrap
                      break-words
                    "
                  >
                    {receive.remark ||
                      "-"}
                  </span>
                </div>
              </div>
            </div>
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
            ไม่มีเส้นดำใต้หัวข้อ
        =================================================== */}

        <div
          className="
            flex
            flex-col
            gap-3

            bg-white/80

            px-5
            py-5

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
              inline-flex
              w-fit
              shrink-0
              items-center
              gap-2

              rounded-full

              border
              border-slate-300

              bg-slate-50

              px-3
              py-1.5

              text-sm
              font-extrabold
              !text-slate-700

              shadow-sm
            "
          >
            <span>
              ทั้งหมด
            </span>

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

            <tbody>
              {receive.items.length ===
              0 ? (
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
                        เอกสารรับเข้าฉบับนี้ไม่มีรายการพัสดุ
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
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* ลำดับ */}

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

                      {/* หมวดหมู่ */}

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
                          item.material
                            .category
                        ] ??
                          item.material
                            .category}
                      </td>

                      {/* รหัสพัสดุ */}

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
                        {item.material
                          .code || "-"}
                      </td>

                      {/* รายการพัสดุ */}

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
                        {item.material
                          .name || "-"}
                      </td>

                      {/* หน่วย */}

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
                        {item.material
                          .unit || "-"}
                      </td>

                      {/* จำนวน */}

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
                        {item.qty}
                      </td>

                      {/* ราคาต่อหน่วย */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-right
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {formatMoney(
                          item.unitPrice
                        )}
                      </td>

                      {/* วันผลิต */}

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

                      {/* วันหมดอายุ */}

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
      </section>
    </AppPage>
  );
}