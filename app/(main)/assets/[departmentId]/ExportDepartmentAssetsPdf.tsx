"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Asset = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
  departmentName: string;
  sectionName: string | null;
  officerName: string | null;
  status: string;
  purchaseDate: string | null;
  price: number | null;
  location: string | null;
  remark: string | null;
};

type Props = {
  departmentName: string;
  assets: Asset[];
};

const categoryName: Record<string, string> = {
  DESK: "โต๊ะ",
  CHAIR: "เก้าอี้",
  AIR_CONDITIONER: "เครื่องปรับอากาศ",
  CABINET: "ตู้และชั้น",
  COMPUTER: "คอมพิวเตอร์",
  PRINTER: "เครื่องพิมพ์",
  TELEPHONE: "เครื่องโทรศัพท์",
  OTHER: "ทั่วไป",
  NO_SYSTEM: "ไม่มีอยู่ในระบบ",
};

const categoryUnit: Record<string, string> = {
  DESK: "ตัว",
  CHAIR: "ตัว",
  AIR_CONDITIONER: "เครื่อง",
  CABINET: "ตัว",
  COMPUTER: "เครื่อง",
  PRINTER: "เครื่อง",
  TELEPHONE: "เครื่อง",
  OTHER: "รายการ",
  NO_SYSTEM: "รายการ",
};

const statusName: Record<string, string> = {
  ACTIVE: "ใช้งานอยู่",
  INACTIVE: "ไม่ใช้งาน",
  DISPOSED: "จำหน่ายแล้ว",
  LOST: "สูญหาย",
};

/* =========================================================
   ปีงบประมาณราชการ
   ========================================================= */

function getFiscalYear(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month >= 10
    ? year + 1 + 543
    : year + 543;
}

/* =========================================================
   รอบไตรมาสปัจจุบัน
   ต.ค. - ธ.ค. = 1
   ม.ค. - มี.ค. = 2
   เม.ย. - มิ.ย. = 3
   ก.ค. - ก.ย. = 4
   ========================================================= */

function getCurrentQuarter(date: Date) {
  const month = date.getMonth() + 1;

  if (month >= 10 && month <= 12) {
    return 1;
  }

  if (month >= 1 && month <= 3) {
    return 2;
  }

  if (month >= 4 && month <= 6) {
    return 3;
  }

  return 4;
}

/* =========================================================
   Component
   ========================================================= */

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);

  /*
   * A4 แนวนอน
   * ขอบ 10 mm
   */

  const pdfWidth = 277;
  const pdfHeight = 190;

  /*
   * ย่อเนื้อหาให้พอดีกับ A4
   */

  const pdfScale = 0.85;

  /*
   * จำนวนรายการต่อหน้า
   */

  const rowsPerPage = 18;

  const totalPages = Math.max(
    1,
    Math.ceil(
      assets.length / rowsPerPage
    )
  );

  /* =========================================================
     Export PDF
     ========================================================= */

  async function handleExportPdf() {
    if (
      !pdfRef.current ||
      assets.length === 0
    ) {
      return;
    }

    try {
      setIsExporting(true);

      /*
       * คำนวณรอบไตรมาสและปีงบประมาณ
       * ใหม่ทุกครั้งที่กด Export
       */

      const currentDate = new Date();

      const currentQuarter =
        getCurrentQuarter(currentDate);

      const fiscalYear =
        getFiscalYear(currentDate);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pages =
        pdfRef.current.querySelectorAll<HTMLElement>(
          "[data-pdf-page]"
        );

      for (
        let pageIndex = 0;
        pageIndex < pages.length;
        pageIndex++
      ) {
        const page = pages[pageIndex];

        const canvas =
          await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            width: page.scrollWidth,
            height: page.scrollHeight,
          });

        const imageData =
          canvas.toDataURL("image/png");

        if (pageIndex > 0) {
          pdf.addPage(
            "a4",
            "landscape"
          );
        }

        const imageWidth =
          pdfWidth * pdfScale;

        const imageHeight =
          pdfHeight * pdfScale;

        const imageX =
          10 +
          (pdfWidth - imageWidth) / 2;

        const imageY =
          10 +
          (pdfHeight - imageHeight) / 2;

        pdf.addImage(
          imageData,
          "PNG",
          imageX,
          imageY,
          imageWidth,
          imageHeight,
          undefined,
          "FAST"
        );
      }

      const pdfBlob =
        pdf.output("blob");

      const pdfUrl =
        URL.createObjectURL(pdfBlob);

      const newWindow =
        window.open(
          pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

      if (!newWindow) {
        const link =
          document.createElement("a");

        link.href = pdfUrl;
        link.target = "_blank";
        link.rel =
          "noopener noreferrer";

        link.click();
      }

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      console.error(
        "ไม่สามารถสร้าง PDF ได้:",
        error
      );

      alert(
        "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsExporting(false);
    }
  }

  /* =========================================================
     แบ่งข้อมูลเป็นหน้า
     ========================================================= */

  const pages = Array.from(
    {
      length: totalPages,
    },
    (_, pageIndex) =>
      assets.slice(
        pageIndex * rowsPerPage,
        (pageIndex + 1) * rowsPerPage
      )
  );

  /*
   * แสดงค่าปัจจุบันในตัว Preview ที่ซ่อนอยู่
   * เพื่อให้ตรงกับค่าที่ใช้ตอน Export
   */

  const currentDate = new Date();

  const currentQuarter =
    getCurrentQuarter(currentDate);

  const fiscalYear =
    getFiscalYear(currentDate);

  return (
    <div className="shrink-0">
      {/* =====================================================
          Export Button
          ===================================================== */}

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={
          isExporting ||
          assets.length === 0
        }
        className="
          rounded-xl
          bg-gradient-to-r
          from-emerald-600
          to-green-500
          px-4
          py-3
          text-sm
          font-extrabold
          !text-white
          shadow-lg
          transition
          hover:scale-[1.02]
          hover:from-emerald-700
          hover:to-green-600
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:opacity-50
          sm:px-6
        "
      >
        {isExporting
          ? "⏳ กำลังสร้าง PDF..."
          : "📄 ส่งออก PDF"}
      </button>

      {/* =====================================================
          Hidden PDF Document
          ===================================================== */}

      <div
        ref={pdfRef}
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-[-10000px]
          top-0
          z-[-1]
        "
      >
        {pages.map(
          (
            pageAssets,
            pageIndex
          ) => (
            <div
              key={pageIndex}
              data-pdf-page
              className="
                box-border
                h-[190mm]
                w-[277mm]
                overflow-hidden
                bg-white
                px-[2mm]
                py-[1mm]
                text-black
              "
              style={{
                fontFamily:
                  "'TH Sarabun New', 'Tahoma', sans-serif",
                fontSize: "14pt",
                lineHeight: "1",
              }}
            >
              {/* ===============================================
                  Header
                  =============================================== */}

              <div
                className="
                  text-center
                  leading-none
                "
              >
                <div
                  className="
                    text-[16pt]
                    font-bold
                  "
                >
                  ทะเบียนคุมครุภัณฑ์
                </div>

                <div
                  className="
                    mt-[1.5mm]
                    text-[14pt]
                    font-bold
                  "
                >
                  กลุ่มอำนวยการ
                  {" "}
                  สำนักอนามัยการเจริญพันธุ์
                </div>

                <div
                  className="
                    mt-[1.5mm]
                    text-[14pt]
                    font-bold
                  "
                >
                  รอบไตรมาสที่{" "}
                  {currentQuarter}{" "}
                  ปีงบประมาณ พ.ศ.{" "}
                  {fiscalYear}
                </div>
              </div>

              {/* ===============================================
                  Table
                  =============================================== */}

              <table
                className="
                  mt-[4mm]
                  w-full
                  table-fixed
                  border-collapse
                  border
                  border-black
                  text-[14pt]
                  leading-none
                "
              >
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>

                <thead>
                  <tr className="h-[11mm]">
                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ลำดับ
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ประเภท
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รหัส GFMIS
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รหัสครุภัณฑ์
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      รายการครุภัณฑ์
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      หน่วย
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      ผู้รับผิดชอบ
                    </th>

                    <th
                      className="
                        border
                        border-black
                        bg-white
                        px-1
                        text-center
                        font-bold
                        text-black
                      "
                    >
                      สถานะ
                    </th>
                  </tr>
                </thead>

                {/* ===============================================
                    Body
                    =============================================== */}

                <tbody>
                  {pageAssets.map(
                    (asset, index) => {
                      const globalIndex =
                        pageIndex *
                          rowsPerPage +
                        index;

                      return (
                        <tr
                          key={asset.id}
                          className="h-[7.5mm]"
                        >
                          {/* ลำดับ */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {globalIndex + 1}
                          </td>

                          {/* ประเภท */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {categoryName[
                              asset.category
                            ] ??
                              asset.category}
                          </td>

                          {/* รหัส GFMIS */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {asset.governmentAssetNo ??
                              "-"}
                          </td>

                          {/* รหัสครุภัณฑ์ */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {asset.officeAssetNo ??
                              "-"}
                          </td>

                          {/* รายการครุภัณฑ์ */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {asset.name}
                          </td>

                          {/* หน่วย */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {categoryUnit[
                              asset.category
                            ] ??
                              "รายการ"}
                          </td>

                          {/* ผู้รับผิดชอบ */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {asset.officerName ??
                              asset.sectionName ??
                              asset.departmentName ??
                              "-"}
                          </td>

                          {/* สถานะ */}

                          <td
                            className="
                              border
                              border-black
                              px-1
                              text-center
                            "
                          >
                            {statusName[
                              asset.status
                            ] ??
                              asset.status}
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {/* ===============================================
                      เติมแถวว่าง
                      =============================================== */}

                  {pageAssets.length <
                    rowsPerPage &&
                    Array.from(
                      {
                        length:
                          rowsPerPage -
                          pageAssets.length,
                      },
                      (_, emptyIndex) => (
                        <tr
                          key={`empty-${emptyIndex}`}
                          className="h-[7.5mm]"
                        >
                          {Array.from(
                            {
                              length: 8,
                            },
                            (_, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="
                                  border
                                  border-black
                                  bg-white
                                  px-1
                                "
                              >
                                &nbsp;
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}