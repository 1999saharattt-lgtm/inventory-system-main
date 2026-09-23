"use client";

import "@/lib/fonts/THSarabunNew-normal";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import AppButton from "@/components/AppButton";

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

const TABLE_HEADER_FONT_SIZE = 16;
const TABLE_BODY_FONT_SIZE = 12;

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

  return `${String(
    date.getDate()
  ).padStart(2, "0")} ${
    thaiMonths[
      date.getMonth()
    ]
  } ${
    date.getFullYear() + 543
  }`;
}

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

  const dotText =
    "............................................................";

  const labelX = x;

  const lineStartX =
    x + 11;

  const actualDotWidth =
    doc.getTextWidth(
      dotText
    );

  const lineCenterX =
    lineStartX +
    actualDotWidth / 2;

  const roleX =
    lineStartX +
    actualDotWidth +
    1.5;

  doc.text(
    "ลงชื่อ",
    labelX,
    y
  );

  doc.text(
    dotText,
    lineStartX,
    y
  );

  doc.text(
    role,
    roleX,
    y
  );

  doc.text(
    "(.........................................................)",
    lineCenterX,
    y + 6,
    {
      align: "center",
    }
  );

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

  async function exportPdf() {
    if (loading) {
      return;
    }

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

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const centerX =
        pageWidth / 2;

      const leftX =
        10;

      const rightX =
        pageWidth - 10;

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

      /* =================================================
         พอ.101
         ขนาดเท่ากับ "ใบเบิกพัสดุ"
      ================================================= */

      drawBoldCenterText(
        doc,
        "พอ.101",
        centerX,
        10,
        25
      );

      drawBoldCenterText(
        doc,
        "ใบเบิกพัสดุ",
        centerX,
        18,
        25
      );

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

      doc.text(
        "ประสงค์จะขอเบิกสิ่งของต่างๆ สำหรับใช้ในราชการ ดังมีรายการต่อไปนี้",
        leftX,
        43
      );

      const tableHeaders = [
        "ลำดับ",
        "รายการพัสดุ",
        "จำนวนที่ขอเบิก",
        "จำนวนที่พัสดุจ่าย",
        "หมายเหตุ",
      ];

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

            /*
             * ช่อง "จำนวนที่พัสดุจ่าย"
             * ต้องเว้นว่างใน PDF เสมอ
             * ไม่ดึง issuedQty มาแสดง
             */
            "",

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

      const finalTableY =
        (
          doc as any
        ).lastAutoTable
          ?.finalY ??
        200;

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

      const accountDateY =
        summaryY +
        9;

      doc.text(
        "วันที่ลงบัญชีหักพัสดุ ................................................",
        12,
        accountDateY
      );

      const firstSignatureY =
        accountDateY +
        15;

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
    <AppButton
      type="button"
      variant="danger"
      onClick={exportPdf}
      disabled={loading}
      className="
        w-full
        sm:w-auto
      "
    >
      {loading ? (
        <>
          <span
            className="
              h-4
              w-4
              animate-spin
              rounded-full
              border-2
              border-white/40
              border-t-white
            "
          />

          <span>
            กำลังสร้าง PDF...
          </span>
        </>
      ) : (
        <>
          <span>📄</span>
          <span>ส่งออก PDF</span>
        </>
      )}
    </AppButton>
  );
}
