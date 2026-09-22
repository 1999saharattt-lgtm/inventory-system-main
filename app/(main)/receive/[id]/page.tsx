import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";

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
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden

          rounded-[28px]

          border
          border-slate-200/90

          bg-white/80

          p-4

          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl

          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            IOS AMBIENT BACKGROUND
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20

            h-48
            w-48

            rounded-full

            bg-blue-400/[0.07]

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

            h-52
            w-52

            rounded-full

            bg-cyan-400/[0.07]

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-1/2
            top-8

            h-36
            w-72

            -translate-x-1/2

            rounded-full

            bg-slate-200/20

            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
          "
        >
          {/* =================================================
              SECTION TITLE
              ไม่มีเส้นดำใต้หัวข้อ
          ================================================= */}

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

          {/* =================================================
              INFORMATION GRID
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-4

              md:grid-cols-2
            "
          >
            {/* ===============================================
                วันที่รับเข้า
            =============================================== */}

            <div
              className="
                flex
                min-h-[96px]
                flex-col
                justify-center

                rounded-[18px]

                border
                !border-black

                bg-white/90

                px-4
                py-3.5

                shadow-sm

                backdrop-blur-xl
              "
            >
              <p
                className="
                  text-sm
                  font-extrabold
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
                {formatThaiDate(
                  receive.receiveDate
                )}
              </p>
            </div>

            {/* ===============================================
                เลขที่เอกสาร
            =============================================== */}

            <div
              className="
                flex
                min-h-[96px]
                flex-col
                justify-center

                rounded-[18px]

                border
                !border-black

                bg-white/90

                px-4
                py-3.5

                shadow-sm

                backdrop-blur-xl
              "
            >
              <p
                className="
                  text-sm
                  font-extrabold
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
                flex
                min-h-[96px]
                flex-col
                justify-center

                rounded-[18px]

                border
                !border-black

                bg-white/90

                px-4
                py-3.5

                shadow-sm

                backdrop-blur-xl
              "
            >
              <p
                className="
                  text-sm
                  font-extrabold
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
                อยู่แถวเดียวกับผู้จำหน่าย
                ขนาดเท่ากันทุกช่อง
            =============================================== */}

            <div
              className="
                flex
                min-h-[96px]
                flex-col
                justify-center

                rounded-[18px]

                border
                !border-black

                bg-white/90

                px-4
                py-3.5

                shadow-sm

                backdrop-blur-xl
              "
            >
              <p
                className="
                  text-sm
                  font-extrabold
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
                  tabular-nums
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
                ยาวเต็มแถว
            =============================================== */}

            <div
              className="
                flex
                min-h-[96px]
                flex-col
                justify-center

                rounded-[18px]

                border
                !border-black

                bg-white/90

                px-4
                py-3.5

                shadow-sm

                backdrop-blur-xl

                md:col-span-2
              "
            >
              <p
                className="
                  text-sm
                  font-extrabold
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
                  font-bold
                  leading-relaxed
                  !text-slate-900
                "
              >
                {receive.remark || "-"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MATERIAL TABLE
      ===================================================== */}

      <section
        className="
          relative
          w-full
          min-w-0
          overflow-hidden

          rounded-[28px]

          border
          border-slate-200/90

          bg-white/80

          shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl
        "
      >
        {/* ===================================================
            IOS AMBIENT BACKGROUND
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16

            h-40
            w-40

            rounded-full

            bg-blue-400/[0.06]

            blur-3xl
          "
        />

        {/* ===================================================
            TABLE TITLE
            ไม่มีเส้นดำใต้หัวข้อ
        =================================================== */}

        <div
          className="
            relative
            z-10

            flex
            flex-col
            gap-2

            px-5
            py-5

            sm:flex-row
            sm:items-center
            sm:justify-between
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
              border-slate-200

              bg-slate-100/80

              px-3
              py-1.5

              text-sm
              font-extrabold
              !text-slate-700

              shadow-sm

              backdrop-blur-xl
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
            relative
            z-10

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
              {receive.items.length === 0 ? (
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
                      text-base
                      font-bold
                      !text-slate-500
                    "
                  >
                    ไม่พบรายการพัสดุในเอกสารนี้
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
                          item.material.category
                        ] ??
                          item.material.category}
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
                        {item.material.code ||
                          "-"}
                      </td>

                      {/* รายการพัสดุ */}

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
                        {item.material.name ||
                          "-"}
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
                        {item.material.unit ||
                          "-"}
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
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {item.qty.toLocaleString(
                          "th-TH"
                        )}
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
                          font-bold
                          tabular-nums
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