import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PDFDocument,
  rgb,
} from "pdf-lib";

import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";

import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/* =========================================================
   CATEGORY
========================================================= */

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

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       MATERIALS
    ===================================================== */

    const materials =
      await prisma.material.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
        },
      });

    /* =====================================================
       PDF
    ===================================================== */

    const pdfDoc =
      await PDFDocument.create();

    pdfDoc.registerFontkit(
      fontkit
    );

    /* =====================================================
       FONT
    ===================================================== */

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

    const fontBytes =
      await fs.readFile(
        fontPath
      );

    const font =
      await pdfDoc.embedFont(
        fontBytes
      );

    /* =====================================================
       ORIGIN

       ใช้ Origin ของ Request จริง
       รองรับทั้ง Local / Vercel / Production
    ===================================================== */

    const origin =
      request.nextUrl.origin;

    /* =====================================================
       PAGE CONFIGURATION
       A4 = 595.28 x 841.89 pt
    ===================================================== */

    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const marginX = 28;
    const marginTop = 28;

    const columns = 4;

    const gapX = 8;
    const gapY = 14;

    const usableWidth =
      pageWidth -
      marginX * 2;

    const cardWidth =
      (
        usableWidth -
        gapX *
          (columns - 1)
      ) / columns;

    const cardHeight = 164;

    const itemsPerPage = 16;

    /* =====================================================
       GROUP + SORT
    ===================================================== */

    const groupedMaterials =
      categories
        .map((category) => ({
          ...category,

          materials: materials
            .filter(
              (material) =>
                material.category ===
                category.code
            )
            .sort((a, b) => {
              const aNumberText =
                a.code.replace(
                  /\D/g,
                  ""
                );

              const bNumberText =
                b.code.replace(
                  /\D/g,
                  ""
                );

              const aCode =
                aNumberText
                  ? Number(
                      aNumberText
                    )
                  : Number.NaN;

              const bCode =
                bNumberText
                  ? Number(
                      bNumberText
                    )
                  : Number.NaN;

              if (
                !Number.isNaN(
                  aCode
                ) &&
                !Number.isNaN(
                  bCode
                )
              ) {
                if (
                  aCode !== bCode
                ) {
                  return (
                    aCode -
                    bCode
                  );
                }

                return (
                  a.id -
                  b.id
                );
              }

              const result =
                a.code.localeCompare(
                  b.code,
                  "th",
                  {
                    numeric: true,
                    sensitivity:
                      "base",
                  }
                );

              if (result !== 0) {
                return result;
              }

              return (
                a.id -
                b.id
              );
            }),
        }))
        .filter(
          (group) =>
            group.materials
              .length > 0
        );

    /* =====================================================
       EMPTY
    ===================================================== */

    if (
      groupedMaterials.length ===
      0
    ) {
      const page =
        pdfDoc.addPage([
          pageWidth,
          pageHeight,
        ]);

      const message =
        "ยังไม่มีรายการพัสดุสำหรับสร้าง QR Code";

      const textWidth =
        font.widthOfTextAtSize(
          message,
          20
        );

      page.drawText(
        message,
        {
          x:
            (
              pageWidth -
              textWidth
            ) / 2,

          y:
            pageHeight /
            2,

          size: 20,

          font,

          color: rgb(
            0,
            0,
            0
          ),
        }
      );
    }

    /* =====================================================
       CREATE PDF
    ===================================================== */

    for (
      const group of
      groupedMaterials
    ) {
      let itemIndex = 0;

      while (
        itemIndex <
        group.materials.length
      ) {
        /* =================================================
           PAGE
        ================================================= */

        const page =
          pdfDoc.addPage([
            pageWidth,
            pageHeight,
          ]);

        /* =================================================
           CATEGORY HEADER
        ================================================= */

        const categoryWidth =
          font.widthOfTextAtSize(
            group.name,
            18
          );

        page.drawText(
          group.name,
          {
            x:
              (
                pageWidth -
                categoryWidth
              ) / 2,

            y:
              pageHeight -
              25,

            size: 18,

            font,

            color: rgb(
              0,
              0,
              0
            ),
          }
        );

        /* =================================================
           CURRENT PAGE MATERIALS
        ================================================= */

        const pageMaterials =
          group.materials.slice(
            itemIndex,
            itemIndex +
              itemsPerPage
          );

        /* =================================================
           GENERATE QR PARALLEL
        ================================================= */

        const qrResults =
          await Promise.all(
            pageMaterials.map(
              async (
                material
              ) => {
                /* =========================================
                   QR DESTINATION

                   ต้องเหมือนของเดิม:
                   /stock-card/material/{id}/pdf
                ========================================= */

                const materialUrl =
                  new URL(
                    `/stock-card/material/${material.id}/pdf`,
                    origin
                  ).toString();

                const qrBuffer =
                  await QRCode.toBuffer(
                    materialUrl,
                    {
                      width: 300,
                      margin: 1,
                      errorCorrectionLevel:
                        "H",
                      type: "png",
                    }
                  );

                const qrImage =
                  await pdfDoc.embedPng(
                    qrBuffer
                  );

                return {
                  material,
                  qrImage,
                };
              }
            )
          );

        /* =================================================
           DRAW CARDS
        ================================================= */

        for (
          let position = 0;
          position <
          qrResults.length;
          position++
        ) {
          const {
            material,
            qrImage,
          } =
            qrResults[position];

          const column =
            position %
            columns;

          const row =
            Math.floor(
              position /
                columns
            );

          const x =
            marginX +
            column *
              (
                cardWidth +
                gapX
              );

          const top =
            pageHeight -
            42 -
            row *
              (
                cardHeight +
                gapY
              );

          const y =
            top -
            cardHeight;

          /* ===============================================
             CARD BORDER
          =============================================== */

          page.drawRectangle({
            x,
            y,

            width:
              cardWidth,

            height:
              cardHeight,

            borderColor:
              rgb(
                0,
                0,
                0
              ),

            borderWidth:
              0.8,
          });

          /* ===============================================
             QR
          =============================================== */

          const qrSize =
            100;

          const qrX =
            x +
            (
              cardWidth -
              qrSize
            ) /
              2;

          const qrY =
            y +
            53;

          page.drawImage(
            qrImage,
            {
              x: qrX,
              y: qrY,

              width:
                qrSize,

              height:
                qrSize,
            }
          );

          /* ===============================================
             CODE
          =============================================== */

          const codeText =
            `รหัสพัสดุ : ${
              material.code ||
              "-"
            }`;

          const codeSize =
            11;

          const codeWidth =
            font.widthOfTextAtSize(
              codeText,
              codeSize
            );

          page.drawText(
            codeText,
            {
              x:
                x +
                (
                  cardWidth -
                  codeWidth
                ) /
                  2,

              y:
                y +
                38,

              size:
                codeSize,

              font,

              color:
                rgb(
                  0,
                  0,
                  0
                ),
            }
          );

          /* ===============================================
             MATERIAL NAME
          =============================================== */

          const name =
            material.name ||
            "-";

          const nameSize =
            9;

          const maxNameWidth =
            cardWidth -
            12;

          /* ===============================================
             SIMPLE THAI WRAP
          =============================================== */

          const lines: string[] =
            [];

          let currentLine =
            "";

          for (
            const char of name
          ) {
            const testLine =
              currentLine +
              char;

            if (
              font.widthOfTextAtSize(
                testLine,
                nameSize
              ) <=
              maxNameWidth
            ) {
              currentLine =
                testLine;
            } else {
              if (
                currentLine
              ) {
                lines.push(
                  currentLine
                );
              }

              currentLine =
                char;
            }
          }

          if (currentLine) {
            lines.push(
              currentLine
            );
          }

          const visibleLines =
            lines.slice(
              0,
              2
            );

          visibleLines.forEach(
            (
              line,
              lineIndex
            ) => {
              const lineWidth =
                font.widthOfTextAtSize(
                  line,
                  nameSize
                );

              page.drawText(
                line,
                {
                  x:
                    x +
                    (
                      cardWidth -
                      lineWidth
                    ) /
                      2,

                  y:
                    y +
                    23 -
                    lineIndex *
                      11,

                  size:
                    nameSize,

                  font,

                  color:
                    rgb(
                      0,
                      0,
                      0
                    ),
                }
              );
            }
          );
        }

        itemIndex +=
          itemsPerPage;
      }
    }

    /* =====================================================
       PAGE NUMBER
    ===================================================== */

    const pages =
      pdfDoc.getPages();

    pages.forEach(
      (
        currentPage,
        index
      ) => {
        const pageNumber =
          `หน้า ${
            index + 1
          } / ${
            pages.length
          }`;

        const textWidth =
          font.widthOfTextAtSize(
            pageNumber,
            10
          );

        currentPage.drawText(
          pageNumber,
          {
            x:
              pageWidth -
              marginX -
              textWidth,

            y: 12,

            size: 10,

            font,

            color: rgb(
              0.4,
              0.4,
              0.4
            ),
          }
        );
      }
    );

    /* =====================================================
       SAVE
    ===================================================== */

    const pdfBytes =
      await pdfDoc.save();

    /* =====================================================
       RESPONSE

       inline = Browser เปิด PDF
       ไม่ Download อัตโนมัติ
    ===================================================== */

    return new NextResponse(
      Buffer.from(
        pdfBytes
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'inline; filename="materials-qr.pdf"',

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "QR PDF generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "ไม่สามารถสร้าง QR Code PDF ได้",
      },
      {
        status: 500,
      }
    );
  }
}