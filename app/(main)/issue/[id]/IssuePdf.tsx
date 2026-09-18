"use client";

import "@/lib/fonts/THSarabunNew-normal";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type IssueItem = {
  id: number;
  qty: number;
  issuedQty: number;
  remark?: string | null;

  material: {
    code: string;
    name: string;
    unit: string;
    category: string;
    latestPrice: {
      toString(): string;
    };
  };
};

type IssuePdfProps = {
  issueId: number;
  documentNo: string;
  issueDate: Date | string;
  departmentName: string;
  requesterName?: string | null;
  items: IssueItem[];
};

// =====================================================
// เดือนภาษาไทย
// =====================================================

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

// =====================================================
// ขนาดตัวอักษรตาราง
//
// HEADER = 16
// BODY   = 12 เท่ากันทุกช่อง
// =====================================================

const TABLE_HEADER_FONT_SIZE = 16;
const TABLE_BODY_FONT_SIZE = 12;

// =====================================================
// วันที่ภาษาไทย
// =====================================================

function formatThaiDate(
  value: Date | string
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return `${date.getDate()} ${
    thaiMonths[
      date.getMonth()
    ]
  } ${
    date.getFullYear() + 543
  }`;
}

// =====================================================
// วาดข้อความหัวเอกสารแบบหนา
// =====================================================

function drawBoldCenterText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fontSize: number
) {
  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  doc.setFontSize(
    fontSize
  );

  doc.setTextColor(
    0,
    0,
    0
  );

  doc.text(
    text,
    x,
    y,
    {
      align: "center",
    }
  );

  doc.text(
    text,
    x + 0.12,
    y,
    {
      align: "center",
    }
  );
}

// =====================================================
// ลายเซ็น
//
// สำคัญ:
// ไม่กำหนด roleX จากความกว้างสมมุติ
//
// แต่ใช้ doc.getTextWidth(dotText)
// วัดความยาวเส้นจุดจริง
//
// ดังนั้น:
//
// ลงชื่อ ......................... ผู้รับของ
//
// "ผู้รับของ" จะเริ่มหลังจุดจริงเสมอ
// ไม่มีทางทับจุด
// =====================================================

function drawSignatureBlock(
  doc: jsPDF,
  x: number,
  y: number,
  role: string
) {
  doc.setFont(
    "2.3.2 THSarabunNew",
    "normal"
  );

  doc.setFontSize(16);

  doc.setTextColor(
    0,
    0,
    0
  );

  // ===================================================
  // ข้อความเส้นลงชื่อ
  // ===================================================

  const dotText =
    "............................................................";

  // ===================================================
  // ตำแหน่งเริ่มต้น
  // ===================================================

  const labelX = x;

  const lineStartX =
    x + 11;

  // ===================================================
  // วัดความกว้างจุดจาก Font จริง
  // ===================================================

  const actualDotWidth =
    doc.getTextWidth(
      dotText
    );

  // ===================================================
  // กึ่งกลางของเส้นจุด
  // ===================================================

  const lineCenterX =
    lineStartX +
    actualDotWidth / 2;

  // ===================================================
  // role อยู่ต่อจากจุดจริง
  //
  // + 1.5 mm เป็นช่องว่าง
  // ===================================================

  const roleX =
    lineStartX +
    actualDotWidth +
    1.5;

  // ===================================================
  // ลงชื่อ
  // ===================================================

  doc.text(
    "ลงชื่อ",
    labelX,
    y
  );

  // ===================================================
  // เส้นจุด
  // ===================================================

  doc.text(
    dotText,
    lineStartX,
    y
  );

  // ===================================================
  // ตำแหน่ง
  //
  // อยู่ต่อจากจุดเท่านั้น
  // ===================================================

  doc.text(
    role,
    roleX,
    y
  );

  // ===================================================
  // วงเล็บชื่อ
  //
  // กึ่งกลางใต้เส้นจุด
  // ===================================================

  doc.text(
    "(.........................................................)",
    lineCenterX,
    y + 6,
    {
      align: "center",
    }
  );

  // ===================================================
  // วันที่
  //
  // กึ่งกลางใต้เส้นจุด
  // ===================================================

  doc.text(
    "วันที่ ................................................",
    lineCenterX,
    y + 12,
    {
      align: "center",
    }
  );
}

export default function IssuePdf({
  issueId,
  documentNo,
  issueDate,
  departmentName,
  items,
}: IssuePdfProps) {
  const [loading, setLoading] =
    React.useState(false);

  // =====================================================
  // Export PDF
  // =====================================================

  async function exportPdf() {
    if (loading) {
      return;
    }

    // =================================================
    // เปิด Preview ก่อน
    // =================================================

    const previewWindow =
      window.open(
        "",
        "_blank"
      );

    if (!previewWindow) {
      alert(
        "ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"
      );

      return;
    }

    try {
      setLoading(true);

      // =================================================
      // PDF A4 Portrait
      // =================================================

      const doc =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",
        });

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      // =================================================
      // ขนาดหน้า
      // =================================================

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const centerX =
        pageWidth / 2;

      const leftX =
        10;

      const rightX =
        pageWidth - 10;

      // =================================================
      // เลขที่เอกสาร
      // =================================================

      doc.setFontSize(16);

      doc.text(
        `เลขที่เอกสาร ${
          documentNo ||
          "-"
        }`,
        rightX,
        9,
        {
          align: "right",
        }
      );

      // =================================================
      // พอ.101
      // =================================================

      drawBoldCenterText(
        doc,
        "พอ.101",
        centerX,
        10,
        23
      );

      // =================================================
      // ใบเบิกพัสดุ
      // =================================================

      drawBoldCenterText(
        doc,
        "ใบเบิกพัสดุ",
        centerX,
        18,
        25
      );

      // =================================================
      // กลุ่ม/งาน
      // =================================================

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setFontSize(16);

      doc.text(
        "กลุ่ม/งาน :",
        leftX,
        29
      );

      doc.text(
        departmentName ||
          "-",
        31,
        29
      );

      doc.text(
        "สำนักอนามัยการเจริญพันธุ์ กรมอนามัย",
        72,
        29
      );

      // =================================================
      // วันที่
      // =================================================

      doc.text(
        "วันที่ :",
        leftX,
        36
      );

      doc.text(
        formatThaiDate(
          issueDate
        ),
        31,
        36
      );

      // =================================================
      // ข้อความประสงค์
      // =================================================

      doc.text(
        "ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ ดังมีรายการต่อไปนี้",
        leftX,
        43
      );

      // =================================================
      // Header ตาราง
      // =================================================

      const tableHeaders = [
        "ลำดับ",
        "รายการพัสดุ",
        "จำนวนที่ขอเบิก",
        "จำนวนที่พัสดุจ่าย",
        "หมายเหตุ",
      ];

      // =================================================
      // Body 18 แถว
      // =================================================

      const body: string[][] =
        [];

      for (
        let index = 0;
        index < 18;
        index++
      ) {
        const item =
          items[index];

        if (item) {
          body.push([
            String(
              index + 1
            ),

            item.material
              .name || "",

            String(
              item.qty
            ),

            item.issuedQty >
            0
              ? String(
                  item.issuedQty
                )
              : "",

            item.remark ??
              "",
          ]);
        } else {
          body.push([
            "",
            "",
            "",
            "",
            "",
          ]);
        }
      }

      // =================================================
      // ตาราง
      // =================================================

      autoTable(
        doc,
        {
          startY:
            48,

          margin: {
            left:
              10,

            right:
              10,
          },

          tableWidth:
            190,

          head: [
            tableHeaders,
          ],

          body,

          theme:
            "grid",

          // =================================================
          // BODY
          //
          // ลดเหลือ 14 ทั้ง Body
          // ทุกช่องเท่ากัน
          // =================================================

          styles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize:
              TABLE_BODY_FONT_SIZE,

            cellPadding: {
              top:
                1.2,

              right:
                1,

              bottom:
                1.2,

              left:
                1,
            },

            textColor:
              0,

            halign:
              "center",

            valign:
              "middle",

            lineColor: [
              0,
              0,
              0,
            ],

            lineWidth:
              0.25,

            minCellHeight:
              8,

            overflow:
              "visible",
          },

          // =================================================
          // HEADER
          //
          // ยัง 16 เท่าเดิม
          // =================================================

          headStyles: {
            font:
              "2.3.2 THSarabunNew",

            fontStyle:
              "normal",

            fontSize:
              TABLE_HEADER_FONT_SIZE,

            fillColor: [
              255,
              255,
              255,
            ],

            textColor:
              0,

            halign:
              "center",

            valign:
              "middle",

            lineColor: [
              0,
              0,
              0,
            ],

            lineWidth:
              0.25,

            cellPadding: {
              top:
                1.2,

              right:
                1,

              bottom:
                1.2,

              left:
                1,
            },

            minCellHeight:
              8,

            overflow:
              "visible",
          },

          // =================================================
          // ความกว้าง
          // =================================================

          columnStyles: {
            0: {
              cellWidth:
                14,

              halign:
                "center",
            },

            1: {
              cellWidth:
                87,

              halign:
                "left",
            },

            2: {
              cellWidth:
                27,

              halign:
                "center",
            },

            3: {
              cellWidth:
                28,

              halign:
                "center",
            },

            4: {
              cellWidth:
                34,

              halign:
                "left",
            },
          },

          rowPageBreak:
            "avoid",
        }
      );

      // =================================================
      // หลังตาราง
      // =================================================

      const finalTableY =
        (
          doc as any
        ).lastAutoTable
          ?.finalY ??
        200;

      // =================================================
      // Summary
      // =================================================

      const summaryY =
        finalTableY +
        9;

      doc.setFont(
        "2.3.2 THSarabunNew",
        "normal"
      );

      doc.setFontSize(
        16
      );

      doc.text(
        "ได้รับของจากงานพัสดุเรียบร้อยแล้ว",
        12,
        summaryY
      );

      doc.text(
        `รวมทั้งสิ้น ${items.length} รายการ`,
        198,
        summaryY,
        {
          align:
            "right",
        }
      );

      // =================================================
      // วันที่ลงบัญชีหักพัสดุ
      // =================================================

      const accountDateY =
        summaryY +
        9;

      doc.text(
        "วันที่ลงบัญชีหักพัสดุ ................................................",
        12,
        accountDateY
      );

      // =================================================
      // ลายเซ็น
      // =================================================

      const firstSignatureY =
        accountDateY +
        15;

      // =================================================
      // แถวบน
      // =================================================

      drawSignatureBlock(
        doc,
        12,
        firstSignatureY,
        "ผู้รับของ"
      );

      drawSignatureBlock(
        doc,
        110,
        firstSignatureY,
        "ผู้เบิก"
      );

      // =================================================
      // แถวล่าง
      // =================================================

      const secondSignatureY =
        firstSignatureY +
        27;

      drawSignatureBlock(
        doc,
        12,
        secondSignatureY,
        "ผู้จ่าย"
      );

      drawSignatureBlock(
        doc,
        110,
        secondSignatureY,
        "ผู้อนุญาต"
      );

      // =================================================
      // PDF Preview
      // =================================================

      const pdfBlob =
        doc.output(
          "blob"
        );

      const pdfUrl =
        URL.createObjectURL(
          pdfBlob
        );

      previewWindow.location.replace(
        pdfUrl
      );

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            pdfUrl
          );
        },
        5 * 60 * 1000
      );
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      if (
        previewWindow &&
        !previewWindow.closed
      ) {
        previewWindow.close();
      }

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={
        exportPdf
      }
      disabled={
        loading
      }
      className="
        rounded-xl
        bg-gradient-to-r
        from-emerald-600
        to-green-500
        px-5
        py-2.5
        text-sm
        font-extrabold
        text-white
        shadow-lg
        transition
        hover:scale-105
        disabled:cursor-not-allowed
        disabled:opacity-60
        sm:px-6
        sm:py-3
        sm:text-base
      "
    >
      {loading
        ? "กำลังสร้าง PDF..."
        : "📄 ส่งออก PDF"}
    </button>
  );
}