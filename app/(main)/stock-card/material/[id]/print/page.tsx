import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PrintStockCard({
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
      },

      issueItems: {
        include: {
          issue: {
            include: {
              department: true,
            },
          },
        },
      },
    },
  });

  if (!material) {
    return <div className="p-10">ไม่พบข้อมูล</div>;
  }

  const rows = [
    ...material.receiveItems.map((item) => ({
      date: item.receive.receiveDate,
      type: "รับเข้า",
      owner: item.receive.vendor.name,
      documentNo: item.receive.documentNo,
      receiveQty: item.qty,
      issueQty: 0,
      unitPrice: item.unitPrice,
    })),

    ...material.issueItems.map((item) => ({
      date: item.issue.issueDate,
      type: "เบิกจ่าย",
      owner: item.issue.department.name,
      documentNo: item.issue.documentNo,
      receiveQty: 0,
      issueQty: item.qty,
      unitPrice: material.latestPrice,
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
    <div className="bg-white p-8 text-black">

      <h1 className="text-center text-2xl font-bold">
        STOCK CARD
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">

        <div>
          <b>รหัสพัสดุ :</b> {material.code}
        </div>

        <div>
          <b>ชื่อพัสดุ :</b> {material.name}
        </div>

        <div>
          <b>หมวด :</b> {material.category}
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
          {material.latestPrice.toLocaleString()}
        </div>

      </div>

      <table className="mt-6 w-full border-collapse border text-xs">

        <thead>

          <tr>

            <th className="border p-2">วันที่</th>

            <th className="border p-2">
              รับเข้า / เบิกจ่าย
            </th>

            <th className="border p-2">
              ผู้จำหน่าย / หน่วยงาน
            </th>

            <th className="border p-2">
              เลขที่เอกสาร
            </th>

            <th className="border p-2">
              รับเข้า
            </th>

            <th className="border p-2">
              เบิกจ่าย
            </th>

            <th className="border p-2">
              คงเหลือ
            </th>

            <th className="border p-2">
              ราคาต่อหน่วย
            </th>

          </tr>

        </thead>

        <tbody>

          {stockRows.map((row, index) => (

            <tr key={index}>

              <td className="border p-2">
                {new Date(row.date).toLocaleDateString(
                  "th-TH"
                )}
              </td>

              <td className="border text-center">
                {row.type}
              </td>

              <td className="border p-2">
                {row.owner}
              </td>

              <td className="border p-2">
                {row.documentNo}
              </td>

              {/* รับเข้า */}
              <td className="border text-center">
                {row.receiveQty
                  ? row.receiveQty
                  : "-"}
              </td>

              {/* เบิกจ่าย */}
              <td className="border text-center">
                {row.issueQty
                  ? row.issueQty
                  : "-"}
              </td>

              <td className="border text-center font-bold">
                {row.balance}
              </td>

              <td className="border text-right pr-2">
                {row.unitPrice.toLocaleString()}
              </td>

            </tr>

          ))}

          {Array.from({
            length: Math.max(20 - stockRows.length, 0),
          }).map((_, index) => (
            <tr key={index}>
              <td className="border h-8"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
            </tr>
          ))}

        </tbody>

      </table>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = () => {
              window.print();
            }
          `,
        }}
      />

    </div>
  );
}