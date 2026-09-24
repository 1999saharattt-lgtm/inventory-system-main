"use client";

import {
  useEffect,
  useState,
} from "react";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

/* =========================================================
   TYPES
========================================================= */

type Vendor = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function VendorsPage() {
  const [
    vendors,
    setVendors,
  ] = useState<Vendor[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* =======================================================
     LOAD VENDORS
  ======================================================= */

  useEffect(() => {
    void loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);

      const res =
        await fetch(
          "/api/vendors",
          {
            cache:
              "no-store",
          }
        );

      if (!res.ok) {
        throw new Error(
          "ไม่สามารถโหลดข้อมูลผู้จำหน่ายได้"
        );
      }

      const data =
        await res.json();

      setVendors(
        Array.isArray(
          data
        )
          ? data
          : []
      );
    } catch (
      error
    ) {
      console.error(
        "Load vendors error:",
        error
      );

      alert(
        "ไม่สามารถโหลดข้อมูลผู้จำหน่ายได้"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =======================================================
     DELETE VENDOR
  ======================================================= */

  async function handleDelete(
    id: number
  ) {
    const ok =
      window.confirm(
        "ต้องการลบผู้จำหน่ายรายนี้ใช่หรือไม่?"
      );

    if (!ok) {
      return;
    }

    try {
      const res =
        await fetch(
          `/api/vendors/${id}`,
          {
            method:
              "DELETE",
          }
        );

      if (res.ok) {
        alert(
          "ลบข้อมูลผู้จำหน่ายสำเร็จ"
        );

        await loadVendors();

        return;
      }

      let message =
        "ลบข้อมูลผู้จำหน่ายไม่สำเร็จ";

      try {
        const data =
          await res.json();

        if (
          data &&
          typeof data.message ===
            "string" &&
          data.message.trim()
        ) {
          message =
            data.message;
        }
      } catch {
        // ใช้ข้อความ default
      }

      alert(
        message
      );
    } catch (
      error
    ) {
      console.error(
        "Delete vendor error:",
        error
      );

      alert(
        "เกิดข้อผิดพลาดในการลบข้อมูลผู้จำหน่าย"
      );
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title="ผู้จำหน่าย"
        subtitle={`ข้อมูลผู้จำหน่ายทั้งหมด ${vendors.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        actions={
          <AppButton
            href="/vendors/new"
            variant="primary"
            size="md"
            icon={
              <span
                aria-hidden="true"
              >
                ＋
              </span>
            }
          >
            เพิ่มผู้จำหน่าย
          </AppButton>
        }
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการผู้จำหน่าย"
        subtitle="ข้อมูลผู้จำหน่ายสำหรับใช้ในระบบทะเบียนครุภัณฑ์"
        badge={
          loading
            ? "กำลังโหลด..."
            : `${vendors.length.toLocaleString(
                "th-TH"
              )} รายการ`
        }
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            w-full
            min-w-0

            overflow-x-auto
            overscroll-x-contain

            [-webkit-overflow-scrolling:touch]
          "
        >
          <table
            className="
              w-full
              min-w-[1000px]

              table-fixed
              border-collapse

              bg-white

              text-base
            "
          >
            {/* =================================================
                COLUMN WIDTH
            ================================================= */}

            <colgroup>
              <col className="w-[22%]" />

              <col className="w-[30%]" />

              <col className="w-[15%]" />

              <col className="w-[13%]" />

              <col className="w-[20%]" />
            </colgroup>

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ชื่อผู้จำหน่าย",
                  "ที่อยู่",
                  "เบอร์ติดต่อ",
                  "เลขประจำตัวผู้เสียภาษี",
                  "จัดการ",
                ].map(
                  (
                    title
                  ) => (
                    <th
                      key={
                        title
                      }
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-2
                        py-4

                        text-center
                        text-base
                        font-extrabold

                        !text-white

                        sm:text-lg
                      "
                    >
                      {
                        title
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <tr>
                  <td
                    colSpan={
                      5
                    }
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto

                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-16
                          w-16

                          place-items-center

                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        ⏳
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight

                          !text-slate-900
                        "
                      >
                        กำลังโหลดข้อมูล
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed

                          !text-slate-500
                        "
                      >
                        กรุณารอสักครู่
                      </p>
                    </div>
                  </td>
                </tr>
              ) : vendors.length ===
                0 ? (
                /* ===========================================
                    EMPTY STATE
                =========================================== */

                <tr>
                  <td
                    colSpan={
                      5
                    }
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto

                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-16
                          w-16

                          place-items-center

                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        🏢
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight

                          !text-slate-900
                        "
                      >
                        ยังไม่มีข้อมูลผู้จำหน่าย
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed

                          !text-slate-500
                        "
                      >
                        เมื่อมีการเพิ่มผู้จำหน่าย
                        ข้อมูลจะแสดงในตารางนี้
                      </p>

                      <div
                        className="
                          mt-5
                        "
                      >
                        <AppButton
                          href="/vendors/new"
                          variant="primary"
                          size="md"
                          icon={
                            <span
                              aria-hidden="true"
                            >
                              ＋
                            </span>
                          }
                        >
                          เพิ่มผู้จำหน่าย
                        </AppButton>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ===========================================
                    VENDOR ROWS
                =========================================== */

                vendors.map(
                  (
                    vendor,
                    index
                  ) => (
                    <tr
                      key={
                        vendor.id
                      }
                      className={`
                        ${
                          index %
                            2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =====================================
                          NAME
                      ===================================== */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3.5

                          text-base
                          font-extrabold

                          !text-slate-900
                        "
                      >
                        <div
                          className="
                            break-words

                            font-extrabold

                            !text-slate-900
                          "
                        >
                          {
                            vendor.name
                          }
                        </div>
                      </td>

                      {/* =====================================
                          ADDRESS
                      ===================================== */}

                      <td
                        className="
                          border
                          border-black

                          px-3
                          py-3.5

                          text-base
                          font-bold
                          leading-relaxed

                          !text-slate-900
                        "
                      >
                        <div
                          className="
                            whitespace-normal
                            break-words
                          "
                        >
                          {vendor.address ??
                            "-"}
                        </div>
                      </td>

                      {/* =====================================
                          PHONE
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-2
                          py-3.5

                          text-center
                          text-base
                          font-bold

                          !text-slate-900
                        "
                      >
                        {vendor.phone ??
                          "-"}
                      </td>

                      {/* =====================================
                          TAX ID
                      ===================================== */}

                      <td
                        className="
                          overflow-hidden
                          whitespace-nowrap

                          border
                          border-black

                          px-2
                          py-3.5

                          text-center
                          text-base
                          font-bold
                          tabular-nums

                          !text-slate-900
                        "
                        title={
                          vendor.taxId ??
                          "-"
                        }
                      >
                        <span
                          className="
                            block

                            overflow-hidden
                            text-ellipsis
                            whitespace-nowrap
                          "
                        >
                          {vendor.taxId ??
                            "-"}
                        </span>
                      </td>

                      {/* =====================================
                          ACTIONS
                      ===================================== */}

                      <td
                        className="
                          whitespace-nowrap

                          border
                          border-black

                          px-2
                          py-3

                          text-center
                        "
                      >
                        <div
                          className="
                            flex
                            w-full

                            items-center
                            justify-center

                            gap-2
                          "
                        >
                          {/* =================================
                              EDIT

                              ใช้ success จาก AppButton
                              = สีเขียว
                          ================================= */}

                          <AppButton
                            href={`/vendors/${vendor.id}/edit`}
                            variant="success"
                            size="sm"
                            icon={
                              <span
                                aria-hidden="true"
                              >
                                ✏️
                              </span>
                            }
                          >
                            แก้ไข
                          </AppButton>

                          {/* =================================
                              DELETE
                          ================================= */}

                          <AppButton
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={
                              <span
                                aria-hidden="true"
                              >
                                🗑️
                              </span>
                            }
                            onClick={() =>
                              handleDelete(
                                vendor.id
                              )
                            }
                          >
                            ลบ
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}