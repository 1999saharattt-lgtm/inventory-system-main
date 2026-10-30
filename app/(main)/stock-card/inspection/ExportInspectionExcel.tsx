"use client";

import { useState } from "react";
import AppButton from "@/components/AppButton";

type Material = {
  materialId: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  openingBalance: number;
  receiveQty: number;
  issueQty: number;
  closingBalance: number;
  latestPrice?: number | null;
};

type InspectionRow = {
  materialId: number;
  accuracy: string;
  shortageQty: string;
  excessQty: string;
  baht: string;
  satang: string;
  damagedQty: string;
  deterioratedQty: string;
  unnecessaryQty: string;
  remark: string;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  type: string;
  departmentId: number | null;
  sectionId: number | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};

type Props = {
  fiscalYear: number;
  startShortYear: string;
  endShortYear: string;
  materials: Material[];
  rows: InspectionRow[];
  inspectionStartDate: string;
  inspectionEndDate: string;
  inspectorIds: string[];
  officers: Officer[];
  inUseChecks: Record<number, boolean>;
};

const CATEGORY_ORDER = ["OFFICE", "COMPUTER", "ELECTRIC", "HOUSEHOLD", "VEHICLE", "PRINTING"];
const CATEGORY_NAME: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function thaiDateParts(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "................................";
  const month = Number(match[2]);
  if (month < 1 || month > 12) return "................................";
  return `${Number(match[3])} เดือน ${THAI_MONTHS[month - 1]} พ.ศ. ${Number(match[1]) + 543}`;
}

function optionalNumber(value: string): number | "" {
  return value.trim() === "" ? "" : Number(value);
}

export default function ExportInspectionExcel({
  fiscalYear, startShortYear, endShortYear, materials, rows,
  inspectionStartDate, inspectionEndDate, inspectorIds, officers, inUseChecks,
}: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function exportExcel() {
    if (isExporting) return;
    if (!materials.length) {
      alert("ไม่มีรายการพัสดุสำหรับส่งออก Excel");
      return;
    }
    setIsExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "สำนักอนามัยการเจริญพันธุ์ กรมอนามัย";
      workbook.created = new Date();
      const rowMap = new Map(rows.map(row => [row.materialId, row]));
      const officerMap = new Map(officers.map(officer => [String(officer.id), officer]));
      // ปรับความกว้างคอลัมน์ชื่อวัสดุตามชื่อที่ยาวที่สุดในข้อมูลจริง
      // จำกัดความกว้างเพื่อให้ยังพิมพ์ลง A4 แนวนอนได้ และตัดบรรทัดเมื่อจำเป็น
      const nameColumnWidth = Math.min(90, Math.max(45,
        ...materials.map(material => Array.from(material.name ?? "").reduce(
          (sum, char) => sum + (/[\u0E00-\u0E7F]/.test(char) ? 1.15 : 1), 0
        ) + 4)
      ));
      const widths = [7, nameColumnWidth, 11, 14, 19, 11, 11, 17, 11, 13, 10, 10, 18, 12, 12, 14, 30, 20];
      const borderSide = { style: "thin" as const, color: { argb: "FF000000" } };
      const border = { top: borderSide, bottom: borderSide, left: borderSide, right: borderSide };
      const font = "TH SarabunPSK";
      const black = { argb: "FF000000" };
      let pageNumber = 0;
      let sheetCount = 0;

      for (const category of CATEGORY_ORDER) {
        const items = materials.filter(material => material.category === category);
        if (!items.length) continue;
        sheetCount++;
        const sheet = workbook.addWorksheet(CATEGORY_NAME[category], {
          views: [{ showGridLines: false }],
          pageSetup: {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: true,
            margins: { left: 0.15, right: 0.15, top: 0.2, bottom: 0.2, header: 0, footer: 0 },
          },
        });
        sheet.properties.defaultRowHeight = 23.25;
        widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });

        const mergeText = (row: number, first: number, last: number, text: string, align: "center" | "right" | "left" = "center") => {
          if (first !== last) sheet.mergeCells(row, first, row, last);
          const cell = sheet.getCell(row, first);
          cell.value = text;
          cell.font = { name: font, size: 18, color: black };
          cell.alignment = { horizontal: align, vertical: "middle", wrapText: true };
        };

        let nextRow = 1;
        for (let offset = 0; offset < items.length; offset += 15) {
          if (nextRow > 1) sheet.getRow(nextRow - 1).addPageBreak();
          pageNumber++;
          const top = nextRow;
          mergeText(top, 15, 18, `แผ่นที่ ${pageNumber}`, "right");
          mergeText(top + 1, 1, 18, `บัญชีตรวจสอบพัสดุประจำปี งบประมาณ พ.ศ. ${fiscalYear}`);
          mergeText(top + 2, 1, 18, "สำนักอนามัยการเจริญพันธุ์ กรมอนามัย");
          mergeText(top + 3, 1, 18, `ประเภท ${CATEGORY_NAME[category]}`);
          mergeText(top + 4, 1, 18, `วันที่เริ่มตรวจสอบ ${thaiDateParts(inspectionStartDate)} ตรวจสอบแล้วเสร็จวันที่ ${thaiDateParts(inspectionEndDate)}`);
          mergeText(top + 5, 1, 18, `เป็นยอดคงเหลือตามบัญชีหรือทะเบียน เมื่อวันที่ 30 กันยายน พ.ศ. ${fiscalYear}`);
          for (let r = top; r <= top + 5; r++) sheet.getRow(r).height = 25;
          sheet.getRow(top + 6).height = 9;

          const h = top + 7;
          const headers: Array<[number, number, string, boolean]> = [
            [1, 1, "ลำดับ", true],
            [2, 2, "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์", true],
            [3, 3, "หน่วย\nนับ", true],
            [4, 4, "ราคา\nต่อหน่วย", true],
            [5, 5, `คงเหลือยอดยกมา\nเมื่อ 01 ต.ค. ${startShortYear}`, true],
            [6, 7, `01 ต.ค. ${startShortYear} ถึง 30 ก.ย. ${endShortYear}`, false],
            [8, 8, "คงเหลือ\nปัจจุบัน", true],
            [9, 10, "ผลการตรวจสอบ", false],
            [11, 12, "ถ้าไม่ถูกต้องระบุ\nจำนวนที่ขาด/เกิน", false],
            [13, 13, "จำนวนที่ขาดเกิน\nคิดเป็นเงิน", false],
            [14, 17, "สถานะการใช้งานของวัสดุ (จำนวน)", false],
            [18, 18, "หมายเหตุ", true],
          ];
          for (const [first, last, label, rowspan] of headers) {
            if (rowspan) sheet.mergeCells(h, first, h + 1, last);
            else if (first !== last) sheet.mergeCells(h, first, h, last);
            sheet.getCell(h, first).value = label;
          }
          const lower = new Map<number, string>([
            [6, "รับ"], [7, "จ่าย"], [9, "ถูกต้อง"], [10, "ไม่ถูกต้อง"],
            [11, "ขาด"], [12, "เกิน"], [13, "(บาท)"], [14, "ใช้การได้"],
            [15, "ชำรุด"], [16, "เสื่อมสภาพ"], [17, "สูญไปหรือไม่จำเป็นต้องใช้\nในหน่วยงาน"],
          ]);
          for (const [column, label] of lower) sheet.getCell(h + 1, column).value = label;
          sheet.getRow(h).height = 50;
          sheet.getRow(h + 1).height = 46;
          for (let r = h; r <= h + 1; r++) {
            for (let c = 1; c <= 18; c++) {
              const cell = sheet.getCell(r, c);
              cell.font = { name: font, size: 16, bold: true, color: black };
              cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
              cell.border = border;
            }
          }

          const chunk = items.slice(offset, offset + 15);
          chunk.forEach((material, index) => {
            const record = rowMap.get(material.materialId);
            const row = sheet.getRow(h + 2 + index);
            const money = record && (record.baht.trim() !== "" || record.satang.trim() !== "")
              ? Number(record.baht || "0") + Number(record.satang || "0") / 100
              : "";
            const values: Array<string | number> = [
              offset + index + 1,
              material.name,
              material.unit || "",
              material.latestPrice ?? "",
              material.openingBalance || "",
              material.receiveQty || "",
              material.issueQty || "",
              Number.isFinite(material.closingBalance) ? material.closingBalance : 0,
              record?.accuracy === "CORRECT" ? "✓" : "",
              record?.accuracy === "INCORRECT" ? "✓" : "",
              record ? optionalNumber(record.shortageQty) : "",
              record ? optionalNumber(record.excessQty) : "",
              money,
              inUseChecks[material.materialId] ? "✓" : "",
              record && Number(record.damagedQty || 0) > 0 ? "✓" : "",
              record && Number(record.deterioratedQty || 0) > 0 ? "✓" : "",
              record && Number(record.unnecessaryQty || 0) > 0 ? "✓" : "",
              record?.remark ?? "",
            ];
            values.forEach((value, column) => { row.getCell(column + 1).value = value; });
            row.height = 23.25;
            for (let c = 1; c <= 18; c++) {
              const cell = row.getCell(c);
              cell.font = { name: font, size: 16, color: black };
              cell.alignment = {
                horizontal: c === 2 || c === 18 ? "left" : "center",
                vertical: "middle",
                wrapText: true,
              };
              cell.border = border;
              if ([4, 13].includes(c) && typeof cell.value === "number") cell.numFmt = "#,##0.00";
              if ([5, 6, 7, 8, 11, 12].includes(c) && typeof cell.value === "number") cell.numFmt = "#,##0";
            }
          });

          const signatureTop = h + 2 + chunk.length + 2;
          const positions = [[1, 6], [7, 12], [13, 18]];
          inspectorIds.slice(0, 3).forEach((id, index) => {
            const officer = officerMap.get(id);
            const [first, last] = positions[index];
            const name = officer ? `${officer.firstName} ${officer.lastName}`.trim() : "........................................";
            const role = officer?.position?.trim() || "........................................";
            mergeText(signatureTop, first, last, "ลงชื่อ ........................................", "center");
            mergeText(signatureTop + 1, first, last, `(${name})`, "center");
            mergeText(signatureTop + 2, first, last, role, "center");
          });
          for (let r = signatureTop; r <= signatureTop + 2; r++) sheet.getRow(r).height = 24;
          nextRow = signatureTop + 4;
        }
        sheet.pageSetup.printArea = `A1:R${nextRow - 1}`;
      }
      if (!sheetCount) {
        alert("ไม่มีรายการสำหรับส่งออก Excel");
        return;
      }
      const bytes = await workbook.xlsx.writeBuffer();
      const blob = new Blob([bytes as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inspection-${fiscalYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Inspection Excel export error:", error);
      alert("ไม่สามารถส่งออก Excel ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppButton type="button" variant="success" size="md" onClick={exportExcel} disabled={isExporting}>
      {isExporting ? "กำลังส่งออก Excel..." : "ส่งออก Excel"}
    </AppButton>
  );
}
