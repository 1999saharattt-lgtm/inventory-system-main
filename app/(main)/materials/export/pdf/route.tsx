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
      "2.3.2 THSarabunNew.ttf"
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
    // ฟังก์ชันจัดข้อความกึ่งกลาง
    // =====================================================

    const drawCenteredText = (
      text: string,
      y: number,
      size: number
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);

      page.drawText(text, {
        x: (pageWidth - textWidth) / 2,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // =====================================================
    // ฟังก์ชันสร้างหน้าใหม่
    // =====================================================

    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    let y = pageHeight - marginTop;

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
    // ห่อข้อความ
    // พยายามตัดตามช่องว่างก่อน
    // หากข้อความภาษาไทยติดกันยาวเกินช่อง
    // จะตัดตามตัวอักษรเฉพาะส่วนที่จำเป็น
    // =====================================================

    const wrapText = (
      text: string,
      maxWidth: number,
      fontSize: number
    ): string[] => {
      const normalizedText = text.trim().replace(/\s+/g, " ");

      if (!normalizedText) {
        return [""];
      }

      // ถ้าทั้งข้อความอยู่ในบรรทัดเดียว ให้ใช้บรรทัดเดียวทันที
      if (
        font.widthOfTextAtSize(normalizedText, fontSize) <=
        maxWidth
      ) {
        return [normalizedText];
      }

      const words = normalizedText.split(" ");

      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine
          ? `${currentLine} ${word}`
          : word;

        if (
          font.widthOfTextAtSize(testLine, fontSize) <=
          maxWidth
        ) {
          currentLine = testLine;
          continue;
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        // คำเดียวเกินความกว้างจริง ๆ
        if (
          font.widthOfTextAtSize(word, fontSize) >
          maxWidth
        ) {
          let currentPart = "";

          for (const char of word) {
            const testPart = currentPart + char;

            if (
              font.widthOfTextAtSize(testPart, fontSize) <=
              maxWidth
            ) {
              currentPart = testPart;
            } else {
              if (currentPart) {
                lines.push(currentPart);
              }

              currentPart = char;
            }
          }

          currentLine = currentPart;
        } else {
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    // =====================================================
    // ฟังก์ชันสร้างหัวตาราง
    // =====================================================

    const drawTableHeader = (
      xNo: number,
      xCode: number,
      xName: number,
      xUnit: number,
      colNo: number,
      colCode: number,
      colName: number,
      colUnit: number,
      headerHeight: number
    ) => {
      page.drawRectangle({
        x: marginLeft,
        y: y - headerHeight,
        width: contentWidth,
        height: headerHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 1,
      });

      // เส้นแบ่งหัวตาราง
      page.drawLine({
        start: {
          x: xCode,
          y,
        },
        end: {
          x: xCode,
          y: y - headerHeight,
        },
        thickness: 0.7,
        color: rgb(0.6, 0.6, 0.6),
      });

      page.drawLine({
        start: {
          x: xName,
          y,
        },
        end: {
          x: xName,
          y: y - headerHeight,
        },
        thickness: 0.7,
        color: rgb(0.6, 0.6, 0.6),
      });

      page.drawLine({
        start: {
          x: xUnit,
          y,
        },
        end: {
          x: xUnit,
          y: y - headerHeight,
        },
        thickness: 0.7,
        color: rgb(0.6, 0.6, 0.6),
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
    };

    // =====================================================
    // ถ้าไม่มีข้อมูล
    // =====================================================

    if (materials.length === 0) {
      drawCenteredText("บัญชีพัสดุ", y, titleSize);

      y -= 28;

      drawCenteredText(
        "สำนักอนามัยการเจริญพันธุ์ กรมอนามัย",
        y,
        subtitleSize
      );

      page.drawText("ไม่พบรายการพัสดุ", {
        x: marginLeft,
        y: y - 40,
        size: 18,
        font,
      });
    }

    // =====================================================
    // วนตามหมวด
    // แต่ละหมวดเริ่มหน้าใหม่เสมอ
    // =====================================================

    for (const category of categories) {
      const categoryMaterials = materials.filter(
        (material) => material.category === category.code
      );

      if (categoryMaterials.length === 0) {
        continue;
      }

      // ===================================================
      // หมวดใหม่ = หน้าใหม่เสมอ
      // ===================================================

      addNewPage();

      // ===================================================
      // Header เอกสาร
      // ===================================================

      y = pageHeight - marginTop;

      drawCenteredText("บัญชีพัสดุ", y, titleSize);

      y -= 28;

      drawCenteredText(
        "สำนักอนามัยการเจริญพันธุ์ กรมอนามัย",
        y,
        subtitleSize
      );

      y -= 32;

      // ===================================================
      // เส้นคั่น
      // ===================================================

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

      y -= 28;

      // ===================================================
      // หัวหมวด
      // ===================================================

      checkSpace(45);

      page.drawText(category.name, {
        x: marginLeft,
        y,
        size: categorySize,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 28;

      // ===================================================
      // กำหนดความกว้างตาราง
      // เพิ่มพื้นที่รายการพัสดุ
      // ===================================================

      const colNo = 45;
      const colCode = 85;
      const colUnit = 80;
      const colName =
        contentWidth - colNo - colCode - colUnit;

      const xNo = marginLeft;
      const xCode = xNo + colNo;
      const xName = xCode + colCode;
      const xUnit = xName + colName;

      // ===================================================
      // Header ตาราง
      // ===================================================

      const headerHeight = 28;

      checkSpace(headerHeight);

      drawTableHeader(
        xNo,
        xCode,
        xName,
        xUnit,
        colNo,
        colCode,
        colName,
        colUnit,
        headerHeight
      );

      // ===================================================
      // รายการพัสดุ
      // ===================================================

      for (
        let index = 0;
        index < categoryMaterials.length;
        index++
      ) {
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

        // =================================================
        // ถ้าพื้นที่ไม่พอ สร้างหน้าใหม่
        // แต่ยังอยู่ในหมวดเดิม
        // =================================================

        if (y - rowHeight < marginBottom) {
          addNewPage();

          y = pageHeight - marginTop;

          // หัวเอกสารในหน้าต่อของหมวดเดิม
          drawCenteredText("บัญชีพัสดุ", y, titleSize);

          y -= 28;

          drawCenteredText(
            "สำนักอนามัยการเจริญพันธุ์ กรมอนามัย",
            y,
            subtitleSize
          );

          y -= 32;

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

          y -= 28;

          page.drawText(category.name, {
            x: marginLeft,
            y,
            size: categorySize,
            font,
            color: rgb(0, 0, 0),
          });

          y -= 28;

          drawTableHeader(
            xNo,
            xCode,
            xName,
            xUnit,
            colNo,
            colCode,
            colName,
            colUnit,
            headerHeight
          );
        }

        // =================================================
        // กรอบแถว
        // =================================================

        page.drawRectangle({
          x: marginLeft,
          y: y - rowHeight,
          width: contentWidth,
          height: rowHeight,
          borderColor: rgb(0.75, 0.75, 0.75),
          borderWidth: 0.7,
        });

        // =================================================
        // เส้นแบ่ง Column
        // =================================================

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

        // =================================================
        // ลำดับ
        // =================================================

        page.drawText(String(index + 1), {
          x: xNo + 15,
          y: y - 19,
          size: tableTextSize,
          font,
        });

        // =================================================
        // รหัสพัสดุ
        // =================================================

        page.drawText(material.code, {
          x: xCode + 8,
          y: y - 19,
          size: tableTextSize,
          font,
        });

        // =================================================
        // รายการพัสดุ
        // =================================================

        nameLines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: xName + 8,
            y:
              y -
              19 -
              lineIndex * lineHeight,
            size: tableTextSize,
            font,
          });
        });

        // =================================================
        // หน่วย
        // =================================================

        page.drawText(material.unit ?? "", {
          x: xUnit + 8,
          y: y - 19,
          size: tableTextSize,
          font,
        });

        y -= rowHeight;
      }
    }

    // =====================================================
    // เลขหน้า
    // =====================================================

    const pages = pdfDoc.getPages();

    pages.forEach((pdfPage, index) => {
      const pageNumber =
        `หน้า ${index + 1} / ${pages.length}`;

      const textWidth = font.widthOfTextAtSize(
        pageNumber,
        12
      );

      pdfPage.drawText(pageNumber, {
        x:
          pageWidth -
          marginRight -
          textWidth,
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

    return new NextResponse(
      Buffer.from(pdfBytes),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'inline; filename="materials.pdf"',
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PDF generation error:",
      error
    );

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