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

const categoryLabel: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

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
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  return `${d.getDate()} ${
    thaiMonths[d.getMonth()]
  } ${d.getFullYear() + 543}`;
}

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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      {/* =====================================================
          Header
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
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลเอกสาร
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          space-y-3
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-4
          text-sm
          text-white
          shadow-xl
          sm:space-y-4
          sm:p-6
          sm:text-base
        "
      >
        <p>
          <span className="font-extrabold">
            วันที่รับเข้า :
          </span>{" "}
          {formatThaiDate(receive.receiveDate)}
        </p>

        <p>
          <span className="font-extrabold">
            เลขที่เอกสาร :
          </span>{" "}
          {receive.documentNo}
        </p>

        <p>
          <span className="font-extrabold">
            ผู้จำหน่าย :
          </span>{" "}
          {receive.vendor.name}
        </p>

        <p className="break-words">
          <span className="font-extrabold">
            หมายเหตุ :
          </span>{" "}
          {receive.remark || "-"}
        </p>
      </div>

      {/* =====================================================
          ตารางรายการ
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-xl
        "
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
              min-w-[1000px]
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
                      py-3
                      text-center
                      text-base
                      font-extrabold
                      !text-white
                      sm:px-4
                      sm:py-4
                      sm:text-lg
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-slate-900">
              {receive.items.map(
                (item: ReceiveItem, index: number) => (
                  <tr
                    key={item.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-center
                        text-sm
                        font-bold
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-2.5
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {categoryLabel[
                        item.material.category
                      ] ?? item.material.category}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {item.material.code}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-2.5
                        text-sm
                        font-semibold
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {item.material.name}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-center
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {item.material.unit}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-center
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {item.qty}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-right
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {Number(
                        item.unitPrice
                      ).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-center
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {formatThaiDate(
                        item.manufacture
                      )}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-2.5
                        text-center
                        text-sm
                        sm:px-4
                        sm:py-3
                        sm:text-base
                      "
                    >
                      {formatThaiDate(item.expiry)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}