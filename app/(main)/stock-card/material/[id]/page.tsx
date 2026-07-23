import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExportPdf from "./ExportPdf";
import ExportExcel from "./ExportExcel";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

function formatDateAD(date: Date | string) {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export default async function StockCardPage({
  params,
}: Props) {
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      vendor: true,

      receiveItems: {
        include: {
          receive: {
            include: {
              vendor: true,
            },
          },
        },
        orderBy: {
          receive: {
            receiveDate: "asc",
          },
        },
      },

      issueItems: {
        include: {
          issue: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          issue: {
            issueDate: "asc",
          },
        },
      },
    },
  });

  if (!material) {
    return (
      <div className="p-10 text-center text-gray-900">
        ไม่พบข้อมูลพัสดุ
      </div>
    );
  }

  const rows = [
    ...material.receiveItems.map((item) => ({
      date: item.receive.receiveDate,
      documentNo: item.receive.documentNo,
      owner: item.receive.vendor?.name ?? "-",
      unitPrice: Number(item.unitPrice),
      receiveQty: item.qty,
      issueQty: 0,
      manufacture: item.manufacture,
      expiry: item.expiry,
    })),

    ...material.issueItems.map((item) => ({
      date: item.issue.issueDate,
      documentNo: item.issue.documentNo,
      owner: item.issue.department?.name ?? "-",
      unitPrice: Number(material.latestPrice),
      receiveQty: 0,
      issueQty: item.qty,
      manufacture: null,
      expiry: null,
    })),
  ].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  let balance = 0;

  const stockRows = rows.map((row) => {
    balance += row.receiveQty;
    balance -= row.issueQty;

    return {
      ...row,
      balance,
    };
  });

  return (
    <div className="min-h-screen space-y-6 bg-gray-100 p-6 text-gray-900">

      <div className="flex items-center justify-between">

        <Link
          href={`/stock-card/${material.category}`}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          ← กลับ
        </Link>

        <div className="flex gap-3">
          <ExportPdf
            material={material}
            rows={stockRows}
          />

          <ExportExcel
            material={material}
            rows={stockRows}
          />
        </div>

      </div>

      <div className="rounded-xl bg-white p-6 shadow">

        <h1 className=" text-center text-3xl font-bold text-gray-900">
          บัญชีพัสดุ
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-4 text-gray-900">

          <div>
            <b>รหัสพัสดุ :</b> {material.code}
          </div>

          <div>
            <b>รายการพัสดุ :</b> {material.name}
          </div>

          <div>
            <b>หมวดหมู่ :</b>{" "}
            {categoryName[material.category]}
          </div>

          <div>
            <b>หน่วย :</b> {material.unit}
          </div>

          <div>
            <b>ผู้จำหน่าย :</b>{" "}
            {material.vendor?.name ?? "-"}
          </div>

          <div>
            <b>ราคาล่าสุด :</b>{" "}
{Number(material.latestPrice).toLocaleString("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}{" "}
บาท
  
          </div>

        </div>

      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full border-collapse border border-gray-300 text-sm">

          <thead className="bg-slate-100">

            <tr>

              <th className="border border-gray-300 p-2">
                วันที่
              </th>

              <th className="border border-gray-300 p-2">
                เลขที่เอกสาร
              </th>

              <th className="border border-gray-300 p-2">
                ผู้จำหน่าย / หน่วยงาน
              </th>

              <th className="border border-gray-300 p-2">
                ราคาล่าสุด
              </th>
                            <th className="border border-gray-300 p-2">
                รับเข้า
              </th>

              <th className="border border-gray-300 p-2">
                เบิกจ่าย
              </th>

              <th className="border border-gray-300 p-2">
                คงเหลือ
              </th>

              <th className="border border-gray-300 p-2">
                วันผลิต
              </th>

              <th className="border border-gray-300 p-2">
                วันหมดอายุ
              </th>

            </tr>

          </thead>

          <tbody>

            {stockRows.length === 0 ? (

              <tr>

                <td
                  colSpan={9}
                  className="border border-gray-300 p-8 text-center"
                >
                  ยังไม่มีข้อมูล
                </td>

              </tr>

            ) : (

              <>

                {stockRows.map((row, index) => (

                  <tr
                    key={index}
                    className="hover:bg-gray-50"
                  >

                    <td className="border border-gray-300 p-2">
  {formatDateAD(row.date)}
</td>

                    <td className="border border-gray-300 p-2">
                      {row.documentNo}
                    </td>

                    <td className="border border-gray-300 p-2">
                      {row.owner}
                    </td>

                    <td className="border border-gray-300 p-2 text-right">
  {Number(row.unitPrice).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>

                    <td className="border border-gray-300 p-2 text-center">
                      {row.receiveQty || "-"}
                    </td>

                    <td className="border border-gray-300 p-2 text-center">
                      {row.issueQty || "-"}
                    </td>

                    <td className="border border-gray-300 p-2 text-center font-semibold">
                      {row.balance}
                    </td>

                    <td className="border border-gray-300 p-2 text-center">
  {row.manufacture
    ? formatDateAD(row.manufacture)
    : "-"}
</td>

                    <td className="border border-gray-300 p-2 text-center">
  {row.expiry
    ? formatDateAD(row.expiry)
    : "-"}
</td>

                  </tr>

                ))}
                                {Array.from({
                  length: Math.max(
                    20 - stockRows.length,
                    0
                  ),
                }).map((_, index) => (

                  <tr key={index}>

                    <td className="h-10 border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>
                    <td className="border border-gray-300"></td>

                  </tr>

                ))}

              </>

            )}

          </tbody>

        </table>

      </div>
          </div>

  );
}