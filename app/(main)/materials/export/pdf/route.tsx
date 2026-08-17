import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const categories = [
  {
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
  },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
  },
];

export async function GET() {
  try {
    // =====================================================
    // ดึงข้อมูลพัสดุ
    // =====================================================

    const materials = await prisma.material.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          code: "asc",
        },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unit: true,
      },
    });

    // =====================================================
    // สร้าง PDF
    // =====================================================

    const pdfDoc = await PDFDocument.create();

    pdfDoc.registerFontkit(fontkit);

    // =====================================================
    // โหลดฟอนต์ภาษาไทย
    // =====================================================

    const fontPath = path.join(
      process.cwd(),
      "app",
      "(main)",
      "materials",
      "export",
      "pdf",
      "fonts",
      "2.3.2 THSarabunNew"
    );

    const fontBytes = await fs.readFile(fontPath);

    const font = await pdfDoc.embedFont(fontBytes);

    // =====================================================
    // ขนาด A4
    // =====================================================

    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const marginLeft = 40;
    const marginRight = 40;
    const marginTop = 45;
    const marginBottom = 45;

    const contentWidth = pageWidth - marginLeft - marginRight;

    // =====================================================
    // ตั้งค่าตัวอักษร
    // =====================================================

    const titleSize = 22;
    const subtitleSize = 17;
    const categorySize = 18;
    const tableHeaderSize = 15;
    const tableTextSize = 14;

    // =====================================================
    // สร้างหน้าแรก
    // =====================================================

    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    let y = pageHeight - marginTop;

    // =====================================================
    // ฟังก์ชันสร้างหน้าใหม่
    // =====================================================

    const addNewPage = () => {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
    };

    // =====================================================
    // ฟังก์ชันตรวจพื้นที่
    // =====================================================

    const checkSpace = (height: number) => {
      if (y - height < marginBottom) {
        addNewPage();
      }
    };

    // =====================================================
    // ห่อข้อความภาษาไทย
    // =====================================================

    const wrapText = (
      text: string,
      maxWidth: number,
      fontSize: number
    ): string[] => {
      const words = text.split("");

      const lines: string[] = [];
      let currentLine = "";

      for (const char of words) {
        const testLine = currentLine + char;

        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }

          currentLine = char;
        }
      }

      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      return lines;
    };

    // =====================================================
    // Header เอกสาร
    // =====================================================

    page.drawText("รายการพัสดุ", {
      x: marginLeft,
      y,
      size: titleSize,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 28;

    page.drawText("สำนักอนามัยการเจริญพันธุ์ กรมอนามัย", {
      x: marginLeft,
      y,
      size: subtitleSize,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 35;

    // =====================================================
    // เส้นคั่น
    // =====================================================

    page.drawLine({
      start: {
        x: marginLeft,
        y,
      },
      end: {
        x: pageWidth - marginRight,
        y,
      },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 25;

    // =====================================================
    // วนตามหมวด
    // =====================================================

    for (const category of categories) {
      const categoryMaterials = materials.filter(
        (material) => material.category === category.code
      );

      if (categoryMaterials.length === 0) {
        continue;
      }

      // ---------------------------------------------------
      // ตรวจพื้นที่สำหรับหัวหมวด
      // ---------------------------------------------------

      checkSpace(45);

      page.drawText(category.name, {
        x: marginLeft,
        y,
        size: categorySize,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 28;

      // ---------------------------------------------------
      // กำหนดความกว้างตาราง
      // ---------------------------------------------------

      const colNo = 45;
      const colCode = 100;
      const colName = contentWidth - colNo - colCode - 90;
      const colUnit = 90;

      const xNo = marginLeft;
      const xCode = xNo + colNo;
      const xName = xCode + colCode;
      const xUnit = xName + colName;

      // ---------------------------------------------------
      // Header ตาราง
      // ---------------------------------------------------

      const headerHeight = 28;

      checkSpace(headerHeight);

      page.drawRectangle({
        x: marginLeft,
        y: y - headerHeight,
        width: contentWidth,
        height: headerHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 1,
      });

      page.drawText("ลำดับ", {
        x: xNo + 8,
        y: y - 19,
        size: tableHeaderSize,
        font,
      });

      page.drawText("รหัสพัสดุ", {
        x: xCode + 8,
        y: y - 19,
        size: tableHeaderSize,
        font,
      });

      page.drawText("รายการพัสดุ", {
        x: xName + 8,
        y: y - 19,
        size: tableHeaderSize,
        font,
      });

      page.drawText("หน่วย", {
        x: xUnit + 8,
        y: y - 19,
        size: tableHeaderSize,
        font,
      });

      y -= headerHeight;

      // ---------------------------------------------------
      // รายการพัสดุ
      // ---------------------------------------------------

      for (let index = 0; index < categoryMaterials.length; index++) {
        const material = categoryMaterials[index];

        const nameLines = wrapText(
          material.name,
          colName - 16,
          tableTextSize
        );

        const lineHeight = 17;
        const rowHeight = Math.max(
          28,
          nameLines.length * lineHeight + 10
        );

        // ถ้าพื้นที่ไม่พอ ให้สร้างหน้าใหม่
        if (y - rowHeight < marginBottom) {
          addNewPage();

          // Header ตารางต่อหน้า
          page.drawRectangle({
            x: marginLeft,
            y: y - headerHeight,
            width: contentWidth,
            height: headerHeight,
            color: rgb(0.9, 0.9, 0.9),
            borderColor: rgb(0.6, 0.6, 0.6),
            borderWidth: 1,
          });

          page.drawText("ลำดับ", {
            x: xNo + 8,
            y: y - 19,
            size: tableHeaderSize,
            font,
          });

          page.drawText("รหัสพัสดุ", {
            x: xCode + 8,
            y: y - 19,
            size: tableHeaderSize,
            font,
          });

          page.drawText("รายการพัสดุ", {
            x: xName + 8,
            y: y - 19,
            size: tableHeaderSize,
            font,
          });

          page.drawText("หน่วย", {
            x: xUnit + 8,
            y: y - 19,
            size: tableHeaderSize,
            font,
          });

          y -= headerHeight;
        }

        // -------------------------------------------------
        // กรอบแถว
        // -------------------------------------------------

        page.drawRectangle({
          x: marginLeft,
          y: y - rowHeight,
          width: contentWidth,
          height: rowHeight,
          borderColor: rgb(0.75, 0.75, 0.75),
          borderWidth: 0.7,
        });

        // -------------------------------------------------
        // เส้นแบ่ง Column
        // -------------------------------------------------

        page.drawLine({
          start: {
            x: xCode,
            y,
          },
          end: {
            x: xCode,
            y: y - rowHeight,
          },
          thickness: 0.7,
          color: rgb(0.75, 0.75, 0.75),
        });

        page.drawLine({
          start: {
            x: xName,
            y,
          },
          end: {
            x: xName,
            y: y - rowHeight,
          },
          thickness: 0.7,
          color: rgb(0.75, 0.75, 0.75),
        });

        page.drawLine({
          start: {
            x: xUnit,
            y,
          },
          end: {
            x: xUnit,
            y: y - rowHeight,
          },
          thickness: 0.7,
          color: rgb(0.75, 0.75, 0.75),
        });

        // -------------------------------------------------
        // ลำดับ
        // -------------------------------------------------

        page.drawText(String(index + 1), {
          x: xNo + 15,
          y: y - 19,
          size: tableTextSize,
          font,
        });

        // -------------------------------------------------
        // รหัส
        // -------------------------------------------------

        page.drawText(material.code, {
          x: xCode + 8,
          y: y - 19,
          size: tableTextSize,
          font,
        });

        // -------------------------------------------------
        // รายการพัสดุ
        // -------------------------------------------------

        nameLines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: xName + 8,
            y: y - 19 - lineIndex * lineHeight,
            size: tableTextSize,
            font,
          });
        });

        // -------------------------------------------------
        // หน่วย
        // -------------------------------------------------

        page.drawText(material.unit ?? "", {
          x: xUnit + 8,
          y: y - 19,
          size: tableTextSize,
          font,
        });

        y -= rowHeight;
      }

      // ---------------------------------------------------
      // เว้นระยะก่อนหมวดถัดไป
      // ---------------------------------------------------

      y -= 25;
    }

    // =====================================================
    // ถ้าไม่มีข้อมูล
    // =====================================================

    if (materials.length === 0) {
      page.drawText("ไม่พบรายการพัสดุ", {
        x: marginLeft,
        y,
        size: 18,
        font,
      });
    }

    // =====================================================
    // เลขหน้า
    // =====================================================

    const pages = pdfDoc.getPages();

    pages.forEach((pdfPage, index) => {
      const pageNumber = `หน้า ${index + 1} / ${pages.length}`;

      const textWidth = font.widthOfTextAtSize(pageNumber, 12);

      pdfPage.drawText(pageNumber, {
        x: pageWidth - marginRight - textWidth,
        y: 20,
        size: 12,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
    });

    // =====================================================
    // สร้าง PDF bytes
    // =====================================================

    const pdfBytes = await pdfDoc.save();

    // =====================================================
    // ส่ง PDF กลับ Browser
    // =====================================================

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="materials.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    return NextResponse.json(
      {
        error: "ไม่สามารถสร้าง PDF ได้",
      },
      {
        status: 500,
      }
    );
  }
}