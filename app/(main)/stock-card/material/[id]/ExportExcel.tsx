"use client";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type Props = {
  material: any;
  rows: any[];
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

export default function ExportExcel({
  material,
  rows,
}: Props) {

  async function exportExcel() {

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Stock System";
    workbook.created = new Date();

    const worksheet =
      workbook.addWorksheet("Stock Card");

    worksheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    };

    worksheet.columns = [
      { width: 15 },
      { width: 18 },
      { width: 35 },
      { width: 15 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 15 },
      { width: 15 },
    ];

    // ===========================
    // HEADER
    // ===========================

    worksheet.mergeCells("A1:I2");

    const title = worksheet.getCell("A1");

    title.value = "บัญชีพัสดุ";

    title.font = {
      bold: true,
      size: 28,
    };

    title.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getRow(1).height = 28;
    worksheet.getRow(2).height = 28;

    worksheet.mergeCells("G3:I3");

    const gov = worksheet.getCell("G3");

    gov.value =
      "ส่วนราชการ กระทรวงสาธารณสุข กรมอนามัย";

    gov.font = {
      bold: true,
      size: 11,
    };

    gov.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    worksheet.mergeCells("G4:I4");

    const dept = worksheet.getCell("G4");

    dept.value =
      "หน่วยงาน สำนักอนามัยการเจริญพันธุ์";

    dept.font = {
      bold: true,
      size: 11,
    };

    dept.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    worksheet.getRow(3).height = 22;
    worksheet.getRow(4).height = 22;

    // ===========================
    // ข้อมูลพัสดุ
    // ===========================

    worksheet.getCell("A6").value = "รหัสพัสดุ";
    worksheet.getCell("B6").value =
      material.code || "-";

    worksheet.getCell("A7").value = "รายการพัสดุ";
    worksheet.getCell("B7").value =
      material.name || "-";

    worksheet.getCell("A8").value = "หมวดหมู่";
    worksheet.getCell("B8").value =
      categoryName[material.category] ??
      material.category ??
      "-";

    worksheet.getCell("A9").value = "หน่วย";
    worksheet.getCell("B9").value =
      material.unit || "-";

    worksheet.getCell("A10").value = "ผู้จำหน่าย";
    worksheet.getCell("B10").value =
      material.vendor?.name ?? "-";

    worksheet.getCell("A11").value = "ราคาล่าสุด";
    worksheet.getCell("B11").value =
      material.latestPrice !== null &&
      material.latestPrice !== undefined
        ? Number(material.latestPrice)
        : "-";

    // จัดรูปแบบข้อมูลพัสดุ
    for (let i = 6; i <= 11; i++) {

      worksheet.getCell(`A${i}`).font = {
        bold: true,
      };

      worksheet.getCell(`A${i}`).alignment = {
        horizontal: "left",
        vertical: "middle",
      };

      worksheet.getCell(`B${i}`).alignment = {
        horizontal: "left",
        vertical: "middle",
      };

      worksheet.getRow(i).height = 22;
    }

    // ===========================
    // หัวตาราง
    // ===========================

    const headerRow =
      worksheet.getRow(13);

    headerRow.values = [
      "วันที่",
      "เลขที่เอกสาร",
      "ผู้จำหน่าย / หน่วยงาน",
      "ราคาล่าสุด",
      "รับเข้า",
      "เบิกจ่าย",
      "คงเหลือ",
      "วันผลิต",
      "วันหมดอายุ",
    ];

    headerRow.height = 24;

    headerRow.eachCell((cell) => {

      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "D9D9D9",
        },
      };

      cell.border = {
        top: {
          style: "thin",
        },
        left: {
          style: "thin",
        },
        bottom: {
          style: "thin",
        },
        right: {
          style: "thin",
        },
      };

    });

    // ===========================
    // ข้อมูล Stock Card
    // ===========================

    rows.forEach((r) => {

      const hasReceive =
        r.receiveQty !== null &&
        r.receiveQty !== undefined &&
        r.receiveQty !== "" &&
        Number(r.receiveQty) !== 0;

      const hasIssue =
        r.issueQty !== null &&
        r.issueQty !== undefined &&
        r.issueQty !== "" &&
        Number(r.issueQty) !== 0;

      const row =
        worksheet.addRow([

          // วันที่
          r.date
            ? new Date(r.date)
                .toLocaleDateString("th-TH")
            : "-",

          // เลขที่เอกสาร
          r.documentNo || "-",

          // ผู้จำหน่าย / หน่วยงาน
          r.owner || "-",

          // ราคาล่าสุด
          r.unitPrice !== null &&
          r.unitPrice !== undefined &&
          r.unitPrice !== ""
            ? Number(r.unitPrice)
            : "-",

          // รับเข้า
          hasReceive
            ? r.receiveQty
            : "-",

          // เบิกจ่าย
          hasIssue
            ? r.issueQty
            : "-",

          // คงเหลือ
          r.balance !== null &&
          r.balance !== undefined &&
          r.balance !== ""
            ? r.balance
            : "-",

          // วันผลิต
          r.manufacture
            ? new Date(r.manufacture)
                .toLocaleDateString("th-TH")
            : "-",

          // วันหมดอายุ
          r.expiry
            ? new Date(r.expiry)
                .toLocaleDateString("th-TH")
            : "-",

        ]);

      row.height = 22;

      row.eachCell((cell) => {

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        };

      });

    });

    // ===========================
    // เติมแถวว่างให้ครบ 20 รายการ
    // ===========================

    const currentRows =
      rows.length;

    const emptyRows =
      Math.max(
        20 - currentRows,
        0
      );

    for (
      let i = 0;
      i < emptyRows;
      i++
    ) {

      const row =
        worksheet.addRow([
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

      row.height = 22;

      row.eachCell((cell) => {

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        cell.border = {
          top: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        };

      });

    }

    // ===========================
    // รูปแบบตัวเลข
    // ===========================

    worksheet.getColumn(4).numFmt =
      "#,##0.00";

    worksheet.getColumn(5).numFmt =
      "#,##0";

    worksheet.getColumn(6).numFmt =
      "#,##0";

    worksheet.getColumn(7).numFmt =
      "#,##0";

    // ===========================
    // Freeze หัวตาราง
    // ===========================

    worksheet.views = [
      {
        state: "frozen",
        ySplit: 13,
      },
    ];

    // ===========================
    // ไม่มีเส้นขอบส่วน Header
    // ===========================

    [
      "A1",
      "G3",
      "G4",
      "A6",
      "B6",
      "A7",
      "B7",
      "A8",
      "B8",
      "A9",
      "B9",
      "A10",
      "B10",
      "A11",
      "B11",
    ].forEach((addr) => {

      worksheet.getCell(addr).border = {};

    });

    // ลบเส้นขอบของเซลล์ที่ Merge
    for (
      let r = 1;
      r <= 11;
      r++
    ) {

      for (
        let c = 1;
        c <= 9;
        c++
      ) {

        worksheet
          .getCell(r, c)
          .border = {};

      }

    }

    // ===========================
    // ความสูงทุกแถว
    // ===========================

    worksheet.eachRow((row) => {

      if (!row.height) {
        row.height = 22;
      }

    });

    // ===========================
    // จัดกึ่งกลางทุกเซลล์ในตาราง
    // ===========================

    for (
      let r = 13;
      r <= worksheet.rowCount;
      r++
    ) {

      worksheet
        .getRow(r)
        .eachCell((cell) => {

          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };

        });

    }

    // ===========================
    // ดาวน์โหลดไฟล์
    // ===========================

    const buffer =
      await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      `${material.code}-stock-card.xlsx`
    );

  }

  return (

    <button
      onClick={exportExcel}
      className="
        rounded-xl
        bg-emerald-600
        px-5
        py-2
        font-bold
        text-white
        shadow
        transition
        hover:bg-emerald-700
      "
    >
      Export Excel
    </button>

  );
}