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

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}


export default async function StockCardPage({ params }: Props) {
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
    return <div>ไม่พบข้อมูลพัสดุ</div>;
  }


  // ==========================================
  // รายการรับเข้าล่าสุด
  // ใช้ข้อมูลนี้เป็นผู้จำหน่ายและราคาล่าสุด
  // ==========================================


  const latestReceiveItem =
    material.receiveItems.length > 0
      ? material.receiveItems[material.receiveItems.length - 1]
      : null;


  const latestVendor =
    latestReceiveItem?.receive.vendor?.name ?? "-";


  const latestPrice =
    latestReceiveItem
      ? Number(latestReceiveItem.unitPrice)
      : 0;


  // ==========================================
  // สร้างข้อมูลล็อตสำหรับจำลอง FEFO
  // ==========================================


  type Lot = {
    id: number;
    qty: number;
    manufacture: Date | null;
    expiry: Date | null;
  };


  const lots: Lot[] = material.receiveItems.map((item) => ({
    id: item.id,
    qty: Number(item.qty),
    manufacture: item.manufacture,
    expiry: item.expiry,
  }));


  // ==========================================
  // รวมรายการรับเข้าและรายการเบิกจ่าย
  // แล้วเรียงตามวันที่
  // ==========================================


  const events = [
    ...material.receiveItems.map((item) => ({
      type: "receive" as const,
      date: item.receive.receiveDate,
      item,
    })),

    ...material.issueItems.map((item) => ({
      type: "issue" as const,
      date: item.issue.issueDate,
      item,
    })),
  ].sort((a, b) => {
    const dateDiff =
      new Date(a.date).getTime() -
      new Date(b.date).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }


    // ถ้าวันเดียวกัน ให้รายการรับเข้ามาก่อนรายการเบิก
    if (
      a.type === "receive" &&
      b.type === "issue"
    ) {
      return -1;
    }


    if (
      a.type === "issue" &&
      b.type === "receive"
    ) {
      return 1;
    }


    return 0;
  });


  // ==========================================
  // เก็บว่ารายการเบิกแต่ละรายการ
  // ถูกตัดออกจากล็อตไหน
  // ==========================================


  const issueLotMap = new Map<
    number,
    {
      manufacture: Date | null;
      expiry: Date | null;
    }
  >();


  // ==========================================
  // จำลองการตัดสต็อกแบบ FEFO
  // ==========================================


  for (const event of events) {

    // ถ้าเป็นรายการรับเข้า
    // ไม่ต้องทำอะไร เพราะล็อตถูกสร้างไว้แล้ว
    if (event.type === "receive") {
      continue;
    }


    const issueItem = event.item;


    let remainingQty = Number(issueItem.qty);


    // เลือกลอตที่ยังเหลือ
    // เรียงตามวันหมดอายุเร็วที่สุดก่อน
    const availableLots = lots
      .filter((lot) => lot.qty > 0)
      .sort((a, b) => {

        const aExpiry = a.expiry
          ? new Date(a.expiry).getTime()
          : Number.MAX_SAFE_INTEGER;


        const bExpiry = b.expiry
          ? new Date(b.expiry).getTime()
          : Number.MAX_SAFE_INTEGER;


        if (aExpiry !== bExpiry) {
          return aExpiry - bExpiry;
        }


        // ถ้าวันหมดอายุเท่ากัน
        // ใช้วันผลิตเก่าก่อน
        const aManufacture = a.manufacture
          ? new Date(a.manufacture).getTime()
          : Number.MAX_SAFE_INTEGER;


        const bManufacture = b.manufacture
          ? new Date(b.manufacture).getTime()
          : Number.MAX_SAFE_INTEGER;


        if (
          aManufacture !== bManufacture
        ) {
          return (
            aManufacture -
            bManufacture
          );
        }


        // ถ้าเหมือนกันทั้งหมด
        // ใช้ล็อตที่สร้างก่อน
        return a.id - b.id;
      });


    // เก็บล็อตแรกที่รายการเบิกนี้ใช้
    let selectedLot: Lot | null = null;


    for (const lot of availableLots) {

      if (remainingQty <= 0) {
        break;
      }


      const issueQty = Math.min(
        remainingQty,
        lot.qty
      );


      // จำล็อตแรกที่ถูกตัด
      if (!selectedLot) {
        selectedLot = lot;
      }


      // หักจำนวนออกจากล็อต
      lot.qty -= issueQty;


      // หักจำนวนที่ยังต้องเบิก
      remainingQty -= issueQty;
    }


    // ถ้าหาล็อตได้
    // บันทึกวันผลิตและวันหมดอายุของล็อต
    if (selectedLot) {
      issueLotMap.set(
        issueItem.id,
        {
          manufacture:
            selectedLot.manufacture,

          expiry:
            selectedLot.expiry,
        }
      );
    }
  }


  // ==========================================
  // สร้างข้อมูล Stock Card
  // ==========================================


  const rows = [
    ...material.receiveItems.map((item) => ({
      date: item.receive.receiveDate,


      documentNo: item.receive.documentNo,


      owner:
        item.receive.vendor?.name ?? "-",


      unitPrice: Number(item.unitPrice),


      receiveQty: item.qty,


      issueQty: 0,


      manufacture: item.manufacture,


      expiry: item.expiry,
    })),


    ...material.issueItems.map((item) => {

      // ค้นหาล็อตที่รายการเบิกนี้ถูกตัด
      const lot =
        issueLotMap.get(item.id);


      return {
        date: item.issue.issueDate,


        documentNo: item.issue.documentNo,


        owner:
          item.issue.department?.name ?? "-",


        // ใช้ราคาจากรายการรับเข้าล่าสุด
        unitPrice: latestPrice,


        receiveQty: 0,


        issueQty: item.qty,


        // ใช้วันผลิตจากล็อตที่ถูกตัด
        manufacture:
          lot?.manufacture ?? null,


        // ใช้วันหมดอายุจากล็อตที่ถูกตัด
        expiry:
          lot?.expiry ?? null,
      };
    }),
  ].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );


  // ==========================================
  // คำนวณยอดคงเหลือ
  // ==========================================


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
    <div className="space-y-6">


      {/* Header */}


      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          text-white
          shadow-xl
        "
      >


        <div>


          <h1
            className="
              text-5xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            📒 บัญชีพัสดุ
          </h1>


          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            {material.name}
          </p>


        </div>


        <Link
          href={`/stock-card/${material.category}`}
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          ← กลับ
        </Link>


      </div>


      {/* รายละเอียดพัสดุ */}


      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-xl
        "
      >


        <div className="grid gap-6 md:grid-cols-2">


          <div>


            <p
              className="
                text-lg
                font-bold
                text-slate-500
              "
            >
              รหัสพัสดุ
            </p>


            <p
              className="
                mt-1
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {material.code || "-"}
            </p>


          </div>


          <div>


            <p
              className="
                text-lg
                font-bold
                text-slate-500
              "
            >
              รายการพัสดุ
            </p>


            <p
              className="
                mt-1
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {material.name || "-"}
            </p>


          </div>


          <div>


            <p
              className="
                text-lg
                font-bold
                text-slate-500
              "
            >
              หมวดหมู่
            </p>


            <p
              className="
                mt-1
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {categoryName[material.category] ??
                material.category ??
                "-"}
            </p>


          </div>


          <div>


            <p
              className="
                text-lg
                font-bold
                text-slate-500
              "
            >
              หน่วย
            </p>


            <p
              className="
                mt-1
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {material.unit || "-"}
            </p>


          </div>


          <div>


            <p
              className="
                text-lg
                font-bold
                text-slate-500
              "
            >
              ผู้จำหน่ายล่าสุด
            </p>


            <p
              className="
                mt-1
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {latestVendor}
            </p>


          </div>


          <div>


            <p
              className="
                text-lg
                font-bold
                text-slate-500
              "
            >
              ราคาล่าสุด
            </p>


            <p
              className="
                mt-1
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {latestReceiveItem
                ? latestPrice.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "-"}{" "}
              บาท
            </p>


          </div>


        </div>


      </div>


      {/* ตารางบัญชีพัสดุ */}


      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-xl
        "
      >


        <div className="overflow-x-auto">


          <table
            className="
              min-w-full
              border-collapse
            "
          >


            <thead>


              <tr>


                {[
                  "วันที่",
                  "เลขที่เอกสาร",
                  "ผู้จำหน่าย / หน่วยงาน",
                  "ราคาล่าสุด",
                  "รับเข้า",
                  "เบิกจ่าย",
                  "คงเหลือ",
                  "วันผลิต",
                  "วันหมดอายุ",
                ].map((title) => (


                  <th
                    key={title}
                    className="
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      text-white
                    "
                  >
                    {title}
                  </th>


                ))}


              </tr>


            </thead>


            <tbody>


              {stockRows.length === 0 ? (


                <tr>


                  <td
                    colSpan={9}
                    className="
                      py-12
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ยังไม่มีข้อมูล
                  </td>


                </tr>


              ) : (


                stockRows.map((row, index) => (


                  <tr
                    key={index}
                    className="
                      border
                      border-slate-900
                      hover:bg-blue-50
                    "
                  >


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-slate-700
                      "
                    >
                      {formatDateAD(row.date)}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-semibold
                        text-slate-700
                      "
                    >
                      {row.documentNo}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-semibold
                        text-slate-700
                      "
                    >
                      {row.owner}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-right
                        font-semibold
                        text-slate-700
                      "
                    >
                      {Number(row.unitPrice).toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {row.receiveQty || "-"}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {row.issueQty || "-"}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-extrabold
                        text-slate-900
                      "
                    >
                      {row.balance}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-slate-700
                      "
                    >
                      {row.manufacture
                        ? formatDateAD(row.manufacture)
                        : "-"}
                    </td>


                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-slate-700
                      "
                    >
                      {row.expiry
                        ? formatDateAD(row.expiry)
                        : "-"}
                    </td>


                  </tr>


                ))


              )}


            </tbody>


          </table>


        </div>


      </div>


      {/* Export */}


      <div className="flex gap-3">


        <ExportPdf
          material={{
            ...material,
            vendor:
              latestReceiveItem?.receive.vendor ?? null,
            latestPrice,
          }}
          rows={stockRows}
        />


        <ExportExcel
          material={{
            ...material,
            vendor:
              latestReceiveItem?.receive.vendor ?? null,
            latestPrice,
          }}
          rows={stockRows}
        />


      </div>


    </div>
  );
}