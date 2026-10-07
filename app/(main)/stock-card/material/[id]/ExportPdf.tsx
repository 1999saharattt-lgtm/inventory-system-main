"use client";



import "@/lib/fonts/THSarabunNew-normal";



import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";



import AppButton from "@/components/AppButton";



/\* =========================================================

   TYPES

\========================================================= \*/



type Props = {

  material: any;

  rows: any[];



  fiscalYear: number;

};



/\* =========================================================

   CATEGORY

\========================================================= \*/



const categoryName: Record<

  string,

  string

\> = {

  OFFICE:

    "วัสดุสำนักงาน",



  COMPUTER:

    "วัสดุคอมพิวเตอร์",



  ELECTRIC:

    "วัสดุไฟฟ้าและวิทยุ",



  HOUSEHOLD:

    "วัสดุงานบ้านและงานครัว",



  VEHICLE:

    "วัสดุยานพาหนะ",



  PRINTING:

    "วัสดุสื่อสิ่งพิมพ์",

};



/\* =========================================================

   THAI MONTHS

\========================================================= \*/



const thaiShortMonths = [

  "ม.ค.",

  "ก.พ.",

  "มี.ค.",

  "เม.ย.",

  "พ.ค.",

  "มิ.ย.",

  "ก.ค.",

  "ส.ค.",

  "ก.ย.",

  "ต.ค.",

  "พ.ย.",

  "ธ.ค.",

];



/\* =========================================================

   THAILAND DATE PARTS



   ใช้ Asia/Bangkok เสมอ

   เพื่อไม่ให้วันที่เปลี่ยนบน Vercel / Browser

\========================================================= \*/



function getThailandDateParts(

  value: Date

) {

  const formatter =

    new Intl.DateTimeFormat(

      "en-US",

      {

        timeZone:

          "Asia/Bangkok",



        year:

          "numeric",



        month:

          "2-digit",



        day:

          "2-digit",

      }

    );



  const parts =

    formatter.formatToParts(

      value

    );



  const year =

    Number(

      parts.find(

        (part) =>

          part.type ===

          "year"

      )?.value

    );



  const month =

    Number(

      parts.find(

        (part) =>

          part.type ===

          "month"

      )?.value

    );



  const day =

    Number(

      parts.find(

        (part) =>

          part.type ===

          "day"

      )?.value

    );



  return {

    year,

    month,

    day,

  };

}



/\* =========================================================

   DATE



   ตัวอย่าง:

   2026-10-01

   ->

   01 ต.ค. 69

\========================================================= \*/



function formatThaiDate(

  date: any

) {

  if (!date) {

    return "-";

  }



  const d =

    date instanceof Date

      ? date

      : new Date(

          date

        );



  if (

    Number.isNaN(

      d.getTime()

    )

  ) {

    return "-";

  }



  const parts =

    getThailandDateParts(

      d

    );



  const day =

    String(

      parts.day

    ).padStart(

      2,

      "0"

    );



  const month =

    thaiShortMonths[

      parts.month -

        1

    ];



  const buddhistYear =

    parts.year +

    543;



  const shortYear =

    String(

      buddhistYear

    ).slice(

      -2

    );



  return \`${day} ${month} ${shortYear}\`;

}



/\* =========================================================

   MONEY

\========================================================= \*/



function formatMoney(

  value:

    | number

    | null

    | undefined

) {

  if (

    value === null ||

    value === undefined

  ) {

    return "-";

  }



  const numberValue =

    Number(

      value

    );



  if (

    Number.isNaN(

      numberValue

    )

  ) {

    return "-";

  }



  return numberValue.toLocaleString(

    "en-US",

    {

      minimumFractionDigits:

        2,



      maximumFractionDigits:

        2,

    }

  );

}



/\* =========================================================

   NUMBER

\========================================================= \*/



function formatNumber(

  value: any

) {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return "-";

  }



  const numberValue =

    Number(

      value

    );



  if (

    Number.isNaN(

      numberValue

    )

  ) {

    return "-";

  }



  return numberValue.toLocaleString(

    "th-TH"

  );

}



/\* =========================================================

   TABLE ROW



   ยอดยกเข้าระบบ:



   receiveQty

   =

   ยอดคงเหลือต้นปี



   issueQty

   =

   0



   balance

   =

   ยอดคงเหลือต้นปี

\========================================================= \*/



function createTableRow(

  row: any

) {

  return [

    formatThaiDate(

      row\.date

    ),



    row\.documentNo ||

      "-",



    row\.owner ||

      "-",



    formatMoney(

      row\.unitPrice

    ),



    Number(

      row\.receiveQty ??

        0

    ) >

    0

      ? formatNumber(

          row\.receiveQty

        )

      : "-",



    Number(

      row\.issueQty ??

        0

    ) >

    0

      ? formatNumber(

          row\.issueQty

        )

      : "-",



    row\.balance ===

        null ||

    row\.balance ===

        undefined ||

    row\.balance ===

        ""

      ? "-"

      : formatNumber(

          row\.balance

        ),



    formatThaiDate(

      row\.manufacture

    ),



    formatThaiDate(

      row\.expiry

    ),

  ];

}



/\* =========================================================

   COMPONENT

\========================================================= \*/



export default function ExportPdf({

  material,

  rows,

  fiscalYear,

}: Props) {

  /\* =======================================================

     EXPORT PDF

  ======================================================= \*/



  async function exportPdf() {

    /\* =====================================================

       OPEN PREVIEW FIRST

    ===================================================== \*/



    const previewWindow =

      window\.open(

        "",

        "\_blank"

      );



    if (

      !previewWindow

    ) {

      alert(

        "ไม่สามารถเปิดหน้าต่าง PDF ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้"

      );



      return;

    }



    try {

      /\* ===================================================

         PDF

      =================================================== \*/



      const doc =

        new jsPDF({

          orientation:

            "landscape",



          unit:

            "mm",



          format:

            "a4",

        });



      doc.setFont(

        "2.3.2 THSarabunNew",

        "normal"

      );



      const pageWidth =

        doc.internal.pageSize.getWidth();



      const center =

        pageWidth /

        2;



      /\* ===================================================

         HEADER POSITION

      =================================================== \*/



      const leftX =

        14;



      const rightX =

        150;



      /\* ===================================================

         TABLE AREA

      =================================================== \*/



      const tableLeftX =

        14;



      const tableRightMargin =

        14;



      const maximumTableWidth =

        pageWidth -

        tableLeftX -

        tableRightMargin;



      /\* ===================================================

         ROWS PER PAGE

      =================================================== \*/



      const pageSize =

        13;



      /\* ===================================================

         TABLE HEADER

      =================================================== \*/



      const tableHeaders = [

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



      /\* ===================================================

         ALL TABLE ROWS



         stockRows ที่รับมาจาก page.tsx

         มีเฉพาะ FY ที่เลือกอยู่แล้ว

      =================================================== \*/



      const allTableRows =

        rows.map(

          createTableRow

        );



      /\* ===================================================

         MINIMUM COLUMN WIDTH

      =================================================== \*/



      const minimumColumnWidths = [

        20,

        24,

        35,

        22,

        14,

        14,

        14,

        20,

        20,

      ];



      /\* ===================================================

         PADDING

      =================================================== \*/



      const tableCellPadding =

        1.1;



      /\* ===================================================

         CALCULATE COLUMN WIDTH

      =================================================== \*/



      function calculateColumnWidths(

        fontSize: number

      ) {

        doc.setFont(

          "2.3.2 THSarabunNew",

          "normal"

        );



        doc.setFontSize(

          fontSize

        );



        return tableHeaders.map(

          (

            header,

            columnIndex

          ) => {

            let longestTextWidth =

              doc.getTextWidth(

                header

              );



            for (

              const row of

                allTableRows

            ) {

              const value =

                String(

                  row[

                    columnIndex

                  ] ?? ""

                );



              const width =

                doc.getTextWidth(

                  value

                );



              if (

                width >

                longestTextWidth

              ) {

                longestTextWidth =

                  width;

              }

            }



            const requiredWidth =

              longestTextWidth +

              tableCellPadding \*

                2 +

              1;



            return Math.max(

              minimumColumnWidths[

                columnIndex

              ],



              requiredWidth

            );

          }

        );

      }



      /\* ===================================================

         FONT SIZE

      =================================================== \*/



      let tableFontSize =

        16;



      let columnWidths =

        calculateColumnWidths(

          tableFontSize

        );



      let calculatedTableWidth =

        columnWidths.reduce(

          (

            sum,

            width

          ) =>

            sum +

            width,

          0

        );



      /\* ===================================================

         REDUCE FONT IF TOO WIDE

      =================================================== \*/



      while (

        calculatedTableWidth >

          maximumTableWidth &&

        tableFontSize >

          5

      ) {

        tableFontSize -=

          0.5;



        columnWidths =

          calculateColumnWidths(

            tableFontSize

          );



        calculatedTableWidth =

          columnWidths.reduce(

            (

              sum,

              width

            ) =>

              sum +

              width,

            0

          );

      }



      /\* ===================================================

         FINE REDUCTION

      =================================================== \*/



      while (

        calculatedTableWidth >

          maximumTableWidth &&

        tableFontSize >

          4

      ) {

        tableFontSize -=

          0.25;



        columnWidths =

          calculateColumnWidths(

            tableFontSize

          );



        calculatedTableWidth =

          columnWidths.reduce(

            (

              sum,

              width

            ) =>

              sum +

              width,

            0

          );

      }



      /\* ===================================================

         EXPAND TABLE

      =================================================== \*/



      if (

        calculatedTableWidth <

          maximumTableWidth &&

        calculatedTableWidth >

          0

      ) {

        const expandScale =

          maximumTableWidth /

          calculatedTableWidth;



        columnWidths =

          columnWidths.map(

            (

              width

            ) =>

              width \*

              expandScale

          );



        calculatedTableWidth =

          maximumTableWidth;

      }



      /\* ===================================================

         FINAL SHRINK

      =================================================== \*/



      if (

        calculatedTableWidth >

        maximumTableWidth

      ) {

        const shrinkScale =

          maximumTableWidth /

          calculatedTableWidth;



        columnWidths =

          columnWidths.map(

            (

              width

            ) =>

              width \*

              shrinkScale

          );



        calculatedTableWidth =

          maximumTableWidth;

      }



      /\* ===================================================

         PAGES

      =================================================== \*/



      const pages:

        any[][] =

        [];



      for (

        let i = 0;

        i <

        rows.length;

        i +=

        pageSize

      ) {

        pages.push(

          rows.slice(

            i,

            i +

              pageSize

          )

        );

      }



      if (

        pages.length ===

        0

      ) {

        pages.push(

          []

        );

      }



      /\* ===================================================

         PAGE HEADER

      =================================================== \*/



      function drawPageHeader() {

        doc.setFont(

          "2.3.2 THSarabunNew",

          "normal"

        );



        /\* ===============================================

           DOCUMENT TITLE

        =============================================== \*/



        doc.setFontSize(

          26

        );



        doc.text(

          "บัญชีพัสดุ",

          center,

          14,

          {

            align:

              "center",

          }

        );



        /\* ===============================================

           FISCAL YEAR

        =============================================== \*/



        doc.setFontSize(

          17

        );



        doc.text(

          \`ปีงบประมาณ ${fiscalYear}\`,

          center,

          21,

          {

            align:

              "center",

          }

        );



        /\* ===============================================

           GOVERNMENT

        =============================================== \*/



        doc.setFontSize(

          16

        );



        doc.text(

          "ส่วนราชการ  กระทรวงสาธารณสุข  กรมอนามัย",

          232,

          18,

          {

            align:

              "center",

          }

        );



        doc.text(

          "หน่วยงาน  สำนักอนามัยการเจริญพันธุ์",

          232,

          24,

          {

            align:

              "center",

          }

        );



        /\* ===============================================

           MATERIAL INFORMATION

        =============================================== \*/



        doc.text(

          \`รหัสพัสดุ : ${

            material.code ||

            "-"

          }\`,

          leftX,

          38

        );



        doc.text(

          \`รายการพัสดุ : ${

            material.name ||

            "-"

          }\`,

          rightX,

          38

        );



        doc.text(

          \`หมวดหมู่ : ${

            categoryName[

              material.category

            ] ??

            material.category ??

            "-"

          }\`,

          leftX,

          46

        );



        doc.text(

          \`หน่วย : ${

            material.unit ||

            "-"

          }\`,

          rightX,

          46

        );



        doc.text(

          \`ผู้จำหน่าย : ${

            material.vendor

              ?.name ??

            "-"

          }\`,

          leftX,

          54

        );



        doc.text(

          \`ราคาล่าสุด : ${formatMoney(

            material.latestPrice

          )} บาท\`,

          rightX,

          54

        );

      }



      /\* ===================================================

         COLUMN STYLE

      =================================================== \*/



      const columnStyles:

        Record<

          number,

          any

        > = {

        0: {

          cellWidth:

            columnWidths[0],



          halign:

            "center",

        },



        1: {

          cellWidth:

            columnWidths[1],



          halign:

            "center",

        },



        2: {

          cellWidth:

            columnWidths[2],



          halign:

            "left",

        },



        3: {

          cellWidth:

            columnWidths[3],



          halign:

            "right",

        },



        4: {

          cellWidth:

            columnWidths[4],



          halign:

            "center",

        },



        5: {

          cellWidth:

            columnWidths[5],



          halign:

            "center",

        },



        6: {

          cellWidth:

            columnWidths[6],



          halign:

            "center",

        },



        7: {

          cellWidth:

            columnWidths[7],



          halign:

            "center",

        },



        8: {

          cellWidth:

            columnWidths[8],



          halign:

            "center",

        },

      };



      /\* ===================================================

         CREATE PAGES

      =================================================== \*/



      pages.forEach(

        (

          pageRows,

          pageIndex

        ) => {

          /\* ===============================================

             NEW PAGE

          =============================================== \*/



          if (

            pageIndex >

            0

          ) {

            doc.addPage(

              "a4",

              "landscape"

            );

          }



          /\* ===============================================

             HEADER

          =============================================== \*/



          drawPageHeader();



          /\* ===============================================

             BODY

          =============================================== \*/



          const body =

            pageRows.map(

              createTableRow

            );



          /\* ===============================================

             COMPLETE 13 ROWS

          =============================================== \*/



          while (

            body.length <

            pageSize

          ) {

            body.push([

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

          }



          /\* ===============================================

             TABLE

          =============================================== \*/



          autoTable(

            doc,

            {

              startY:

                60,



              tableWidth:

                maximumTableWidth,



              margin: {

                left:

                  tableLeftX,



                right:

                  tableRightMargin,

              },



              head: [

                tableHeaders,

              ],



              body,



              theme:

                "grid",



              /\* ===========================================

                 BODY STYLE

              =========================================== \*/



              styles: {

                font:

                  "2.3.2 THSarabunNew",



                fontStyle:

                  "normal",



                fontSize:

                  tableFontSize,



                cellPadding:

                  tableCellPadding,



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



              /\* ===========================================

                 HEADER STYLE

              =========================================== \*/



              headStyles: {

                font:

                  "2.3.2 THSarabunNew",



                fontStyle:

                  "normal",



                fontSize:

                  tableFontSize,



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



                cellPadding:

                  tableCellPadding,



                overflow:

                  "visible",

              },



              columnStyles,



              rowPageBreak:

                "avoid",



              /\* ===========================================

                 OPENING BALANCE STYLE



                 แถว "ยอดยกเข้าระบบ"

                 ให้เห็นชัดว่าเป็นยอดต้นปี

              =========================================== \*/



              didParseCell: (

                data: any

              ) => {

                if (

                  data.section !==

                  "body"

                ) {

                  return;

                }



                const sourceRow =

                  pageRows[

                    data.row\.index

                  ];



                if (

                  !sourceRow

                ) {

                  return;

                }



                const isOpening =

                  sourceRow\.type ===

                    "OPENING_BALANCE" ||

                  sourceRow\.documentNo ===

                    "ยอดยกเข้าระบบ";



                if (

                  !isOpening

                ) {

                  return;

                }



                data.cell.styles.fontStyle =

                  "bold";

              },

            }

          );

        }

      );



      /\* ===================================================

         PDF PREVIEW

      =================================================== \*/



      const pdfBlob =

        doc.output(

          "blob"

        );



      const pdfUrl =

        URL.createObjectURL(

          pdfBlob

        );



      previewWindow\.location.replace(

        pdfUrl

      );



      /\* ===================================================

         RELEASE BLOB

      =================================================== \*/



      window\.setTimeout(

        () => {

          URL.revokeObjectURL(

            pdfUrl

          );

        },

        5 \*

          60 \*

          1000

      );

    } catch (

      error

    ) {

      console.error(

        "ไม่สามารถสร้าง PDF ได้:",

        error

      );



      if (

        previewWindow &&

        !previewWindow\.closed

      ) {

        previewWindow\.close();

      }



      alert(

        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"

      );

    }

  }



  /\* =======================================================

     UI

  ======================================================= \*/



  return (

    \<AppButton

      type="button"

      variant="danger"

      size="md"

      onClick={

        exportPdf

      }

      icon={

        \<span

          aria-hidden="true"

        >

          📄

        \</span>

      }

    >

      ส่งออก PDF

    \</AppButton>

  );

}