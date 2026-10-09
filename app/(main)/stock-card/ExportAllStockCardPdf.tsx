"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "@/lib/fonts/THSarabunNew-normal";
import AppButton from "@/components/AppButton";

const FONT = "2.3.2 THSarabunNew";
const CATEGORIES: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
};
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const money = (value: number) => Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = (value: number) => Number(value || 0).toLocaleString("th-TH");
function dateThai(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(+date)) return "-";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (name: string) => Number(parts.find((p) => p.type === name)?.value);
  return `${String(part("day")).padStart(2, "0")} ${MONTHS[part("month") - 1]} ${String(part("year") + 543).slice(-2)}`;
}
type StockRow = { date: string; documentNo: string; owner: string; unitPrice: number; receiveQty: number; issueQty: number; balance: number; manufacture: string | null; expiry: string | null; type: string };
type Material = { id: number; code: string; name: string; category: string; unit: string; vendor: string; latestPrice: number; rows: StockRow[] };
type Payload = { fiscalYear: number; materials: Material[] };

export default function ExportAllStockCardPdf({ fiscalYear }: { fiscalYear: number }) {
  const [loading, setLoading] = useState(false);
  async function exportPdf() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/stock-card/export-all?fiscalYear=${encodeURIComponent(fiscalYear)}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "ไม่สามารถดึงข้อมูลได้");
      const data = (await response.json()) as Payload;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const headers = ["วันที่", "เลขที่เอกสาร", "ผู้จำหน่าย / หน่วยงาน", "ราคาล่าสุด", "รับเข้า", "เบิกจ่าย", "คงเหลือ", "วันผลิต", "วันหมดอายุ"];
      let firstPage = true;
      let category = "";
      let sheet = 0;
      for (const material of data.materials) {
        if (!firstPage) doc.addPage();
        firstPage = false;
        if (category !== material.category) { category = material.category; sheet = 0; }
        sheet++;
        const startPage = doc.getNumberOfPages();
        const drawHeader = (sheetNo: number) => {
          doc.setFont(FONT, "normal");
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(22);
          doc.text("บัญชีพัสดุ", pageWidth / 2, 13, { align: "center" });
          doc.setFontSize(15);
          doc.text(`ปีงบประมาณ ${fiscalYear}`, pageWidth / 2, 20, { align: "center" });
          doc.text(`แผ่นที่ ${sheetNo}`, pageWidth - 12, 12, { align: "right" });
          doc.text("ส่วนราชการ กระทรวงสาธารณสุข กรมอนามัย", pageWidth - 12, 20, { align: "right" });
          doc.text("หน่วยงาน สำนักอนามัยการเจริญพันธุ์", pageWidth - 12, 27, { align: "right" });
          doc.text(`รหัสพัสดุ : ${material.code || "-"}`, 12, 36);
          doc.text(`รายการพัสดุ : ${material.name || "-"}`, 135, 36);
          doc.text(`หมวดหมู่ : ${CATEGORIES[material.category] ?? material.category}`, 12, 44);
          doc.text(`หน่วย : ${material.unit || "-"}`, 135, 44);
          doc.text(`ผู้จำหน่าย : ${material.vendor || "-"}`, 12, 52);
          doc.text(`ราคาล่าสุด : ${money(material.latestPrice)} บาท`, 135, 52);
        };
        drawHeader(sheet);
        autoTable(doc, {
          startY: 59,
          margin: { left: 9, right: 9, top: 59, bottom: 10 },
          head: [headers],
          body: material.rows.length ? material.rows.map((r) => [dateThai(r.date), r.documentNo || "-", r.owner || "-", money(r.unitPrice), r.receiveQty ? qty(r.receiveQty) : "", r.issueQty ? qty(r.issueQty) : "", qty(r.balance), dateThai(r.manufacture), dateThai(r.expiry)]) : [["", "ไม่มีรายการเคลื่อนไหว", "", "", "", "", "", "", ""]],
          theme: "grid",
          styles: { font: FONT, fontStyle: "normal", fontSize: 13, cellPadding: 1.6, valign: "middle", textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, overflow: "linebreak" },
          headStyles: { font: FONT, fontStyle: "normal", fontSize: 13, fillColor: [240, 240, 240], textColor: [0, 0, 0], halign: "center" },
          columnStyles: { 0: { cellWidth: 24, halign: "center" }, 1: { cellWidth: 34 }, 2: { cellWidth: 70 }, 3: { cellWidth: 29, halign: "right" }, 4: { cellWidth: 21, halign: "center" }, 5: { cellWidth: 21, halign: "center" }, 6: { cellWidth: 22, halign: "center" }, 7: { cellWidth: 27, halign: "center" }, 8: { cellWidth: 27, halign: "center" } },
          didDrawPage: (hook) => {
            if (hook.pageNumber > 1) drawHeader(sheet + hook.pageNumber - 1);
          },
        });
        const usedPages = doc.getNumberOfPages() - startPage + 1;
        sheet += usedPages - 1;
      }
      if (firstPage) {
        doc.setFont(FONT, "normal");
        doc.setFontSize(18);
        doc.text(`ไม่พบรายการพัสดุ ปีงบประมาณ ${fiscalYear}`, pageWidth / 2, pageHeight / 2, { align: "center" });
      }
      doc.save(`บัญชีพัสดุรวม_${fiscalYear}.pdf`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "ไม่สามารถส่งออก PDF ได้");
    } finally {
      setLoading(false);
    }
  }
  return <AppButton onClick={exportPdf} disabled={loading} variant="danger" size="md">{loading ? "กำลังจัดทำ PDF..." : "📄 รวมบัญชีพัสดุ"}</AppButton>;
}
