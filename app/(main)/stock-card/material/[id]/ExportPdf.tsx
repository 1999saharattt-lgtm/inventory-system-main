"use client";

import "@/lib/fonts/THSarabunNew-normal";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Props = {
material: any;
rows: any;
};

const categoryName: Record<string, string> = {
OFFICE: "วัสดุสำนักงาน",
COMPUTER: "วัสดุคอมพิวเตอร์",
ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
VEHICLE: "วัสดุยานพาหนะ",
PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

function formatDate(date: any) {
if (!date) return "-";

const d = new Date(date);

return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatMoney(value: number | null | undefined) {
if (value === null || value === undefined) {
return "-";
}

return Number(value).toLocaleString("en-US", {
minimumFractionDigits: 2,
maximumFractionDigits: 2,
});
}

export default function ExportPdf({
material,
rows,
}: Props) {
async function exportPdf() {
const doc = new jsPDF({
orientation: "landscape",
unit: "mm",
format: "a4",
});

```
doc.setFont("2.3.2 THSarabunNew", "normal");

const pageWidth = doc.internal.pageSize.getWidth();
const center = pageWidth / 2;

const leftX = 14;
const rightX = 150;

const pageSize = 10;
const pages: any[][] = [];

for (let i = 0; i < rows.length; i += pageSize) {
  pages.push(rows.slice(i, i + pageSize));
}

if (pages.length === 0) {
  pages.push([]);
}

pages.forEach((pageRows, pageIndex) => {
  if (pageIndex > 0) {
    doc.addPage();
  }

  // ==========================
  // HEADER
  // ==========================

  doc.setFontSize(26);

  doc.text("บัญชีพัสดุ", center, 16, {
    align: "center",
  });

  doc.setFontSize(16);

  doc.text(
    "ส่วนราชการ  กระทรวงสาธารณสุข  กรมอนามัย",
    232,
    18,
    {
      align: "center",
    }
  );

  doc.text(
    "หน่วยงาน  สำนักอนามัยการเจริญพันธุ์",
    232,
    24,
    {
      align: "center",
    }
  );

  doc.text(
    `รหัสพัสดุ : ${material.code || "-"}`,
    leftX,
    38
  );

  doc.text(
    `รายการพัสดุ : ${material.name || "-"}`,
    rightX,
    38
  );

  doc.text(
    `หมวดหมู่ : ${
      categoryName[material.category] ??
      material.category ??
      "-"
    }`,
    leftX,
    46
  );

  doc.text(
    `หน่วย : ${material.unit || "-"}`,
    rightX,
    46
  );

  doc.text(
    `ผู้จำหน่าย : ${material.vendor?.name ?? "-"}`,
    leftX,
    54
  );

  doc.text(
    `ราคาล่าสุด : ${formatMoney(
      material.latestPrice
    )} บาท`,
    rightX,
    54
  );

  // ==========================
  // TABLE DATA
  // ==========================

  const body = pageRows.map((r: any) => {
    /*
     * ถ้ามี receiveQty = เป็นรายการรับเข้า
     * ถ้ามี issueQty = เป็นรายการเบิกจ่าย
     */

    const hasReceive =
      r.receiveQty !== null &&
      r.receiveQty !== undefined &&
      r.receiveQty !== "";

    const hasIssue =
      r.issueQty !== null &&
      r.issueQty !== undefined &&
      r.issueQty !== "";

    return [
      // วันที่
      formatDate(r.date),

      // เลขที่เอกสาร
      r.documentNo || "-",

      // ผู้จำหน่าย / หน่วยงาน
      r.owner || "-",

      // ราคาล่าสุด
      formatMoney(r.unitPrice),

      // รับเข้า
      hasReceive ? r.receiveQty : "-",

      // เบิกจ่าย
      hasIssue ? r.issueQty : "-",

      // คงเหลือ
      r.balance !== null &&
      r.balance !== undefined &&
      r.balance !== ""
        ? r.balance
        : "-",

      // วันผลิต
      formatDate(r.manufacture),

      // วันหมดอายุ
      formatDate(r.expiry),
    ];
  });

  /*
   * เติมแถวเปล่าให้ครบ 10 แถว
   * แถวเหล่านี้ไม่ใช่ข้อมูลจริง
   * จึงไม่ใส่ "-"
   */
  while (body.length < 10) {
    body.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  autoTable(doc, {
    startY: 60,

    head: [
      [
        "วันที่",
        "เลขที่เอกสาร",
        "ผู้จำหน่าย / หน่วยงาน",
        "ราคาล่าสุด",
        "รับเข้า",
        "เบิกจ่าย",
        "คงเหลือ",
        "วันผลิต",
        "วันหมดอายุ",
      ],
    ],

    body,

    theme: "grid",

    styles: {
      font: "2.3.2 THSarabunNew",
      fontStyle: "normal",
      fontSize: 16,
      cellPadding: 2.5,
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      minCellHeight: 8,
    },

    headStyles: {
      font: "2.3.2 THSarabunNew",
      fontStyle: "normal",
      fontSize: 16,
      fillColor: [255, 255, 255],
      textColor: 0,
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },

    columnStyles: {
      0: {
        cellWidth: 28,
      },

      1: {
        cellWidth: 38,
      },

      2: {
        cellWidth: 72,
        halign: "left",
      },

      3: {
        cellWidth: 28,
        halign: "right",
      },

      4: {
        cellWidth: 18,
      },

      5: {
        cellWidth: 18,
      },

      6: {
        cellWidth: 18,
      },

      7: {
        cellWidth: 28,
      },

      8: {
        cellWidth: 28,
      },
    },
  });
});

doc.save(
  `${material.code}-stock-card.pdf`
);
```

}

return ( <button
   onClick={exportPdf}
   className="
     rounded-xl
     bg-red-600
     px-5
     py-2
     font-bold
     text-white
     shadow
     transition
     hover:bg-red-700
   "
 >
Export PDF </button>
);
}
