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

function getConditionMark(
  status: string,
  condition: string
) {
  if (condition === "normal") {
    return status === "IN_USE" ? "/" : "";
  }

  if (condition === "damaged") {
    return status === "DAMAGED" ? "/" : "";
  }

  if (condition === "deteriorated") {
    return status === "WAITING_DISPOSAL" ? "/" : "";
  }

  if (condition === "notRequired") {
    return status === "DISPOSED" ? "/" : "";
  }

  return "";
}

function getInspectionMark(status: string) {
  return status === "IN_USE" ||
    status === "DAMAGED" ||
    status === "WAITING_DISPOSAL" ||
    status === "DISPOSED"
    ? "/"
    : "";
}

export default function ExportDepartmentAssetsPdf({
  departmentName,
  assets,
}: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const rowsPerPage = 20;

  const totalPages = Math.max(
    1,
    Math.ceil(assets.length / rowsPerPage)
  );

  async function handleExportPdf() {
    if (!pdfRef.current || assets.length === 0) {
      return;
    }

    try {
      setIsExporting(true);

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

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: page.scrollWidth,
          height: page.scrollHeight,
        });

        const imageData = canvas.toDataURL("image/png");

        if (pageIndex > 0) {
          pdf.addPage("a4", "landscape");
        }

        pdf.addImage(
          imageData,
          "PNG",
          10,
          10,
          277,
          190,
          undefined,
          "FAST"
        );
      }

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const newWindow = window.open(
        pdfUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!newWindow) {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
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

  const pages = Array.from(
    { length: totalPages },
    (_, pageIndex) =>
      assets.slice(
        pageIndex * rowsPerPage,
        (pageIndex + 1) * rowsPerPage
      )
  );

  return (
    <div className="w-full min-w-0">
      {/* =====================================================
          Export Button
          ===================================================== */}

      <div className="flex w-full justify-end">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={
            isExporting ||
            assets.length === 0
          }
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-6
            py-3
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
            sm:w-auto
          "
        >
          {isExporting
            ? "⏳ กำลังสร้าง PDF..."
            : "📄 ส่งออก PDF"}
        </button>
      </div>

      {/* =====================================================
          Hidden PDF Document
          ไม่แสดงบนหน้า /assets/1
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
        {pages.map((pageAssets, pageIndex) => (
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
            }}
          >
            {/* =================================================
                Header
                ================================================= */}

            <div className="text-center leading-none">
              <div
                className="
                  text-[13px]
                  font-bold
                "
              >
                กระดาษทำการตรวจสอบพัสดุ ประจำปีงบประมาณ 2568
              </div>

              <div
                className="
                  mt-[1mm]
                  text-[12px]
                  font-bold
                "
              >
                สำนักอนามัยการเจริญพันธุ์
              </div>

              <div
                className="
                  mt-[2mm]
                  text-[11px]
                  font-bold
                "
              >
                เริ่มดำเนินการตรวจสอบวันที่ 1 ตุลาคม 2568
                และตรวจสอบแล้วเสร็จวันที่ 4 พฤศจิกายน 2568
              </div>
            </div>

            {/* =================================================
                Table
                ================================================= */}

            <table
              className="
                mt-[2mm]
                w-full
                table-fixed
                border-collapse
                border
                border-black
                text-[9px]
              "
            >
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "4%" }} />
                <col style={{ width: "4%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>

              <thead>
                <tr className="h-[11mm]">
                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    ลำดับ
                  </th>

                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    รหัส GFMIS
                  </th>

                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    รหัสครุภัณฑ์
                  </th>

                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    ผู้รับผิดชอบ
                  </th>

                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    รายการ
                  </th>

                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    หน่วยนับ
                  </th>

                  <th
                    rowSpan={2}
                    className="border border-black px-1 text-center font-bold"
                  >
                    ยอดคงเหลือ
                    <br />
                    ตามทะเบียน
                    <br />
                    ณ วันที่ 1 ต.ค. 68
                  </th>

                  <th
                    colSpan={2}
                    className="border border-black px-1 text-center font-bold"
                  >
                    รายการรับ - จ่ายระหว่าง
                    <br />
                    ปีงบประมาณ พ.ศ. 2568
                  </th>

                  <th
                    rowSpan={2}
                    className="border border-black px-1 text-center font-bold"
                  >
                    ยอดคงเหลือ
                    <br />
                    ตามทะเบียน
                    <br />
                    ณ วันที่ตรวจนับ
                  </th>

                  <th
                    rowSpan={2}
                    className="border border-black px-1 text-center font-bold"
                  >
                    จำนวนที่
                    <br />
                    ตรวจนับได้
                  </th>

                  <th
                    colSpan={2}
                    className="border border-black px-1 text-center font-bold"
                  >
                    ผลการตรวจนับ
                    <br />
                    ครุภัณฑ์ตามทะเบียน
                  </th>

                  <th
                    colSpan={4}
                    className="border border-black px-1 text-center font-bold"
                  >
                    สภาพครุภัณฑ์ที่ตรวจนับพบ
                  </th>

                  <th
                    rowSpan={3}
                    className="border border-black px-1 text-center font-bold"
                  >
                    หมายเหตุ
                  </th>
                </tr>

                <tr className="h-[7mm]">
                  <th className="border border-black px-1 text-center font-bold">
                    รับ
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    จ่าย
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    ถูกต้อง
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    ไม่ถูกต้อง
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    ใช้งาน
                    <br />
                    ได้
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    ชำรุด
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    เสื่อม
                    <br />
                    สภาพ
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    ไม่จำเป็น
                    <br />
                    ต้องใช้
                  </th>
                </tr>

                <tr className="h-[5mm]">
                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>

                  <th className="border border-black px-1 text-center font-bold">
                    -
                  </th>
                </tr>
              </thead>

              <tbody>
                {pageAssets.map((asset, index) => {
                  const globalIndex =
                    pageIndex * rowsPerPage + index;

                  return (
                    <tr
                      key={asset.id}
                      className="h-[6.2mm]"
                    >
                      <td className="border border-black px-1 text-center">
                        {globalIndex + 1}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.governmentAssetNo || "-"}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.officeAssetNo || "-"}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.officerName || "-"}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.name}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {categoryUnit[asset.category] || "ตัว"}
                      </td>

                      <td className="border border-black px-1 text-center">
                        1
                      </td>

                      <td className="border border-black px-1 text-center">
                        -
                      </td>

                      <td className="border border-black px-1 text-center">
                        -
                      </td>

                      <td className="border border-black px-1 text-center">
                        1
                      </td>

                      <td className="border border-black px-1 text-center">
                        1
                      </td>

                      <td className="border border-black px-1 text-center">
                        {getInspectionMark(asset.status)}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.status === "DAMAGED"
                          ? ""
                          : asset.status === "IN_USE"
                            ? ""
                            : ""}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {getConditionMark(
                          asset.status,
                          "normal"
                        )}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {getConditionMark(
                          asset.status,
                          "damaged"
                        )}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {getConditionMark(
                          asset.status,
                          "deteriorated"
                        )}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {getConditionMark(
                          asset.status,
                          "notRequired"
                        )}
                      </td>

                      <td className="border border-black px-1 text-center">
                        {asset.remark || ""}
                      </td>
                    </tr>
                  );
                })}

                {pageAssets.length < rowsPerPage &&
                  Array.from(
                    {
                      length:
                        rowsPerPage - pageAssets.length,
                    },
                    (_, emptyIndex) => (
                      <tr
                        key={`empty-${emptyIndex}`}
                        className="h-[6.2mm]"
                      >
                        {Array.from(
                          { length: 18 },
                          (_, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border border-black px-1"
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

            {/* =================================================
                Signature area
                แสดงเฉพาะหน้าสุดท้าย
                ================================================= */}

            {pageIndex === totalPages - 1 && (
              <div className="mt-[7mm] grid grid-cols-5 gap-[8mm] text-center text-[10px]">
                <div>
                  <div>ลงชื่อ........................................</div>
                  <div className="mt-[2mm]">
                    (........................................)
                  </div>
                  <div className="mt-[1mm]">
                    ........................................
                  </div>
                </div>

                <div>
                  <div>ลงชื่อ........................................</div>
                  <div className="mt-[2mm]">
                    (........................................)
                  </div>
                  <div className="mt-[1mm]">
                    ........................................
                  </div>
                </div>

                <div>
                  <div>ลงชื่อ........................................</div>
                  <div className="mt-[2mm]">
                    (........................................)
                  </div>
                  <div className="mt-[1mm]">
                    ........................................
                  </div>
                </div>

                <div>
                  <div>ลงชื่อ........................................</div>
                  <div className="mt-[2mm]">
                    (........................................)
                  </div>
                  <div className="mt-[1mm]">
                    ........................................
                  </div>
                </div>

                <div>
                  <div>ลงชื่อ........................................</div>
                  <div className="mt-[2mm]">
                    (........................................)
                  </div>
                  <div className="mt-[1mm]">
                    ........................................
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}