"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "@/lib/fonts/THSarabunNew-normal";
import AppButton from "@/components/AppButton";

type TransactionRow = {
  date: string;
  documentNo: string;
  owner: string;
  unitPrice: number | null;
  receiveQty: number;
  issueQty: number;
  balance: number;
};
type MaterialRow = {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  vendor: string;
  latestPrice: number;
  openingBalance: number;
  rows: TransactionRow[];
};

type ResponseData = { materials?: MaterialRow[]; error?: string };

const categoryNames: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};
const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const font = "2.3.2 THSarabunNew";
const formatNumber = (n: number | null | undefined) => n == null ? "-" : Number(n).toLocaleString("en-US");
const formatMoney = (n: number | null | undefined) => n == null ? "-" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (name: string) => Number(parts.find((part) => part.type === name)?.value);
  return `${String(get("day")).padStart(2, "0")} ${months[get("month") - 1]} ${String(get("year") + 543).slice(-2)}`;
}

export default function ExportAllStockCardPdf({ fiscalYear }: { fiscalYear: number }) {
  const [loading, setLoading] = useState(false);

  async function exportAll() {
    if (loading) return;
    const preview = window.open("", "_blank");
    if (!preview) {
      window.alert("กรุณาอนุญาตให้เว็บไซต์เปิดหน้าต่างใหม่เพื่อแสดง PDF");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/stock-card/export-all?fiscalYear=${fiscalYear}`, { cache: "no-store" });
      const data = (await response.json()) as ResponseData;
      if (!response.ok || !data.materials) throw new Error(data.error || "ไม่สามารถโหลดข้อมูลบัญชีพัสดุได้");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let firstPage = true;
      const maxRows = 13;
      const headers = ["วันที่", "เลขที่เอกสาร", "ผู้จำหน่าย / หน่วยงาน", "ราคาล่าสุด", "รับเข้า", "เบิกจ่าย", "คงเหลือ", "วันผลิต", "วันหมดอายุ"];
      const widths = [23, 26, 96, 26, 18, 18, 18, 22, 22];

      for (const material of data.materials) {
        const allRows: string[][] = [
          ["-", "ยอดยกมา", "ยอดคงเหลือต้นปีงบประมาณ", "-", "-", "-", formatNumber(material.openingBalance), "-", "-"],
          ...material.rows.map((row) => [
            formatDate(row.date), row.documentNo || "-", row.owner || "-", formatMoney(row.unitPrice),
            row.receiveQty > 0 ? formatNumber(row.receiveQty) : "-",
            row.issueQty > 0 ? formatNumber(row.issueQty) : "-",
            formatNumber(row.balance), "-", "-",
          ]),
        ];
        const chunks: string[][][] = [];
        for (let i = 0; i < allRows.length; i += maxRows) chunks.push(allRows.slice(i, i + maxRows));

        for (const chunk of chunks) {
          if (!firstPage) doc.addPage("a4", "landscape");
          firstPage = false;
          doc.setFont(font, "normal");
          doc.setTextColor(0);
          doc.setFontSize(22);
          doc.text("บัญชีพัสดุ", pageWidth / 2, 14, { align: "center" });
          doc.setFontSize(16);
          doc.text(`ปีงบประมาณ ${fiscalYear}`, pageWidth / 2, 21, { align: "center" });
          doc.text("ส่วนราชการ  กระทรวงสาธารณสุข  กรมอนามัย", 218, 18, { align: "center" });
          doc.text("หน่วยงาน  สำนักอนามัยการเจริญพันธุ์", 218, 24, { align: "center" });
          doc.text(`รหัสพัสดุ : ${material.code}`, 14, 38);
          const name = doc.splitTextToSize(`รายการพัสดุ : ${material.name}`, 128);
          doc.text(name.slice(0, 2), 150, 38);
          doc.text(`หมวดหมู่ : ${categoryNames[material.category] || material.category}`, 14, 46);
          doc.text(`หน่วย : ${material.unit}`, 150, 46);
          doc.text(`ผู้จำหน่าย : ${material.vendor || "-"}`, 14, 54);
          doc.text(`ราคาล่าสุด : ${formatMoney(material.latestPrice)} บาท`, 150, 54);

          const body = chunk.map((row) => [...row]);
          while (body.length < maxRows) body.push(Array(9).fill(""));
          autoTable(doc, {
            startY: 60, head: [headers], body, theme: "grid",
            margin: { left: 14, right: 14 }, tableWidth: pageWidth - 28,
            styles: { font, fontStyle: "normal", fontSize: 13, cellPadding: 1.1, valign: "middle", halign: "center", textColor: 0, lineColor: [0, 0, 0], lineWidth: 0.25, minCellHeight: 8, overflow: "linebreak" },
            headStyles: { font, fontStyle: "normal", fontSize: 13, fillColor: [255, 255, 255], textColor: 0, halign: "center" },
            columnStyles: Object.fromEntries(widths.map((width, index) => [index, { cellWidth: width, halign: index === 2 ? "left" : "center" }])),
            rowPageBreak: "avoid",
          });
        }
      }
      if (firstPage) {
        doc.setFont(font, "normal");
        doc.text("ไม่พบรายการบัญชีพัสดุในปีงบประมาณนี้", 20, 25);
      }
      for (let page = 1; page <= doc.getNumberOfPages(); page++) {
        doc.setPage(page);
        doc.setFont(font, "normal");
        doc.setFontSize(14);
        doc.text(`แผ่นที่ ${page}`, pageWidth - 14, 11, { align: "right" });
      }
      const url = URL.createObjectURL(doc.output("blob"));
      preview.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 300000);
    } catch (error) {
      preview.close();
      window.alert(error instanceof Error ? error.message : "ไม่สามารถสร้าง PDF ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppButton type="button" variant="danger" size="md" onClick={exportAll} disabled={loading}>
      {loading ? "กำลังสร้าง PDF..." : "📄 รวมบัญชีพัสดุ"}
    </AppButton>
  );
}
