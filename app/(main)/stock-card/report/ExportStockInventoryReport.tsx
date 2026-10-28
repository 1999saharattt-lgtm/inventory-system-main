"use client";

import "@/lib/fonts/THSarabunNew-normal";
import { useState } from "react";
import AppButton from "@/components/AppButton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Material = {
  materialId: number; code: string; name: string; unit: string; category: string;
  latestPrice: number | null; openingBalance: number; receiveQty: number;
  issueQty: number; closingBalance: number;
};
type Accuracy = "CORRECT" | "INCORRECT";
type Status = "IN_USE" | "DAMAGED" | "DETERIORATED" | "UNNECESSARY";
type Props = {
  fiscalYear: number; startShortYear: string; endShortYear: string;
  materials: Material[];
  accuracy: Record<number, Accuracy>;
  statuses: Record<number, Status>;
};
const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน", COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ", HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ", PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const columns = [
  "ลำดับ", "ชื่อหรือชนิดวัสดุหรือครุภัณฑ์", "หน่วยนับ", "ราคาต่อหน่วย",
  "คงเหลือยอดยกมา", "รับ", "จ่าย", "คงเหลือปัจจุบัน",
  "ถูกต้อง", "ไม่ถูกต้อง", "ขาด", "เกิน", "จำนวนที่ขาดเกินคิดเป็นเงิน (บาท)",
  "ใช้การได้", "ชำรุด", "เสื่อมสภาพ", "สูญไปหรือไม่จำเป็นต้องใช้ในหน่วยงาน", "หมายเหตุ",
];
export default function ExportStockInventoryReport({ fiscalYear, startShortYear, endShortYear, materials, accuracy, statuses }: Props) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const makeRows = () => {
    const counters: Record<string, number> = {};
    return materials.map(material => {
      counters[material.category] = (counters[material.category] ?? 0) + 1;
      const correct = accuracy[material.materialId];
      const status = statuses[material.materialId];
      return [
        counters[material.category], material.name, material.unit,
        material.latestPrice ?? "", material.openingBalance, material.receiveQty,
        material.issueQty, material.closingBalance,
        correct === "CORRECT" ? "✓" : "", correct === "INCORRECT" ? "✓" : "",
        "", "", "", status === "IN_USE" ? "✓" : "",
        status === "DAMAGED" ? "✓" : "", status === "DETERIORATED" ? "✓" : "",
        status === "UNNECESSARY" ? "✓" : "", "",
      ];
    });
  };
  const exportExcel = () => {
    setBusy("excel");
    try {
      const rows = makeRows();
      const sheet = XLSX.utils.aoa_to_sheet([
        [`รายงานบัญชีพัสดุคงคลัง ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`],
        [`ระหว่างวันที่ 01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`],
        columns, ...rows,
      ]);
      sheet["!cols"] = [
        { wch: 8 }, { wch: 54 }, { wch: 14 }, { wch: 18 },
        { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
        { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
        { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 42 }, { wch: 24 },
      ];
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "รายงานบัญชีพัสดุคงคลัง");
      XLSX.writeFile(book, `stock-inventory-report-${fiscalYear}.xlsx`);
    } finally { setBusy(null); }
  };
  const exportPdf = () => {
    setBusy("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      doc.setFont("2.3.2 THSarabunNew", "normal");
      doc.setFontSize(18);
      doc.text(`รายงานบัญชีพัสดุคงคลัง ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`, 210, 13, { align: "center" });
      doc.setFontSize(14);
      doc.text(`01 ต.ค. ${startShortYear} - 30 ก.ย. ${endShortYear}`, 210, 21, { align: "center" });
      const rows = makeRows();
      autoTable(doc, {
        startY: 27,
        head: [columns],
        body: rows.map((row, i) => row.map((value, col) => col === 0 ? String(value) : col === 3 && typeof value === "number" ? value.toFixed(2) : String(value))),
        theme: "grid",
        styles: { font: "2.3.2 THSarabunNew", fontStyle: "normal", fontSize: 10, cellPadding: 1.2, lineColor: [0,0,0], lineWidth: 0.12, valign: "middle" },
        headStyles: { fillColor: [51,65,85], textColor: [255,255,255], fontStyle: "normal" },
        columnStyles: { 1: { cellWidth: 49 }, 16: { cellWidth: 34 } },
        margin: { left: 7, right: 7, top: 14, bottom: 12 },
        showHead: "everyPage",
      });
      doc.save(`stock-inventory-report-${fiscalYear}.pdf`);
    } finally { setBusy(null); }
  };
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AppButton type="button" variant="danger" size="md" onClick={exportPdf} disabled={busy !== null}>ส่งออก PDF</AppButton>
      <AppButton type="button" variant="success" size="md" onClick={exportExcel} disabled={busy !== null}>ส่งออก Excel</AppButton>
    </div>
  );
}
