import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
  date: Date | null
) {
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

  /* =======================================================
     LOAD RECEIVE
  ======================================================= */

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
        },
      },
    });

  if (!receive) {
    notFound();
  }

  /* =======================================================
     SHARED STYLE
  ======================================================= */

  const infoCardClass = `
    min-w-0

    rounded-[16px]

    border
    !border-black

    bg-white

    px-4
    py-3.5

    shadow-sm
  `;

  const infoLabelClass = `
    text-sm
    font-extrabold
    !text-slate-600
  `;

  const infoValueClass = `
    mt-1.5

    min-w-0

    break-words

    text-base
    font-extrabold
    !text-slate-900

    sm:text-lg
  `;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        w-full
        min-w-0

        space-y-4

        overflow-x-hidden

        sm:space-y-6
      "
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0

          items-center
          justify-between
          gap-3

          rounded-2xl

          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700

          px-3
          py-4

          text-white

          shadow-xl

          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words

              text-2xl
              font-extrabold
              leading-tight
              !text-white

              sm:text-3xl
            "
          >
            📄 รายละเอียดเอกสารรับเข้า
          </h1>

          <p
            className="
              mt-2

              break-words

              text-sm
              font-semibold
              leading-tight
              !text-slate-200

              sm:text-base
            "
          >
            รายละเอียดรายการรับเข้าพัสดุ
          </p>
        </div>

        <Link
          href="/receive"
          className="
            inline-flex
            h-11
            shrink-0

            items-center
            justify-center
            gap-2

            whitespace-nowrap

            rounded-[16px]

            bg-gradient-to-r
            from-emerald-600
            to-green-500

            px-4

            text-sm
            font-extrabold
            !text-white

            shadow-[0_12px_28px_-16px_rgba(5,150,105,0.55)]

            transition-all
            duration-300
            ease-out

            hover:-translate-y-0.5
            hover:from-emerald-700
            hover:to-green-600
            hover:shadow-[0_18px_34px_-18px_rgba(5,150,105,0.6)]

            active:translate-y-0
            active:scale-[0.97]

            sm:px-5
            sm:text-base
          "
        >
          <span>←</span>
          <span>กลับ</span>
        </Link>
      </div>

      {/* =====================================================
          DOCUMENT INFORMATION
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0

          overflow-visible

          rounded-[24px]

          border
          border-slate-300

          bg-white/80

          p-4

          shadow-[0_16px_40px_-26px_rgba(15,23,42,0.35)]

          backdrop-blur-xl

          sm:p-5
        "
      >
        {/* =================================================
            SECTION HEADER
            ไม่มีเส้นดำด้านล่าง
        ================================================= */}

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
          {/* วันที่รับเข้า */}

          <div className={infoCardClass}>
            <p
              className={
                infoLabelClass
              }
            >
              วันที่รับเข้า
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {formatThaiDate(
                receive.receiveDate
              )}
            </p>
          </div>

          {/* เลขที่เอกสาร */}

          <div className={infoCardClass}>
            <p
              className={
                infoLabelClass
              }
            >
              เลขที่เอกสาร
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {receive.documentNo}
            </p>
          </div>

          {/* ผู้จำหน่าย */}

          <div className={infoCardClass}>
            <p
              className={
                infoLabelClass
              }
            >
              ผู้จำหน่าย
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {receive.vendor.name}
            </p>
          </div>

          {/* จำนวนรายการ */}

          <div className={infoCardClass}>
            <p
              className={
                infoLabelClass
              }
            >
              จำนวนรายการ
            </p>

            <p
              className={
                infoValueClass
              }
            >
              {receive.items.length}{" "}
              รายการ
            </p>
          </div>

          {/* หมายเหตุ */}

          <div
            className={`
              ${infoCardClass}

              md:col-span-2
            `}
          >
            <p
              className={
                infoLabelClass
              }
            >
              หมายเหตุ
            </p>

            <p
              className="
                mt-1.5

                min-h-[28px]

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
      </section>

      {/* =====================================================
          รายการพัสดุ
      ===================================================== */}

      <section
        className="
          w-full
          min-w-0

          overflow-hidden

          rounded-[24px]

          border
          border-slate-300

          bg-white

          shadow-[0_16px_40px_-26px_rgba(15,23,42,0.35)]
        "
      >
        {/* =================================================
            TABLE HEADER
            ไม่มีเส้นดำใต้หัวข้อ
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-2

            bg-white/80

            px-4
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-5
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-lg
                font-black
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
              justify-center

              rounded-full

              border
              border-slate-300

              bg-slate-50

              px-4
              py-2

              text-sm
              font-extrabold
              !text-slate-700

              shadow-sm
            "
          >
            {receive.items.length}{" "}
            รายการ
          </div>
        </div>

        {/* =================================================
            TABLE
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

            <tbody className="text-slate-900">
              {receive.items.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="
                      border
                      border-black

                      px-4
                      py-12

                      text-center
                      text-lg
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
                        transition-colors
                        duration-200

                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        hover:bg-blue-50/60
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
                          text-sm
                          font-extrabold
                          !text-slate-800

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-sm
                          font-semibold
                          !text-slate-800

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-extrabold
                          !text-slate-800

                          sm:px-4
                          sm:text-base
                        "
                      >
                        {item.material
                          .code || "-"}
                      </td>

                      {/* รายการพัสดุ */}

                      <td
                        className="
                          min-w-[220px]

                          border
                          border-black

                          px-3
                          py-3

                          text-sm
                          font-bold
                          !text-slate-900

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-semibold
                          !text-slate-800

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-extrabold
                          !text-slate-900

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-right
                          text-sm
                          font-bold
                          !text-slate-900

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-semibold
                          !text-slate-800

                          sm:px-4
                          sm:text-base
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

                          px-3
                          py-3

                          text-center
                          text-sm
                          font-semibold
                          !text-slate-800

                          sm:px-4
                          sm:text-base
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
    </div>
  );
}