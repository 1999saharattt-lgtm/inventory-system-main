"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Vendor = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);

      const res = await fetch("/api/vendors", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }

      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดข้อมูลผู้จำหน่ายได้");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const ok = confirm("ต้องการลบผู้จำหน่ายรายนี้ใช่หรือไม่?");

    if (!ok) return;

    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("ลบสำเร็จ");
        loadVendors();
      } else {
        const data = await res.json();
        alert(data.message ?? "ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-md
        "
      >
        <div>

          <h1 className="text-3xl font-extrabold text-slate-800">
            ผู้จำหน่าย
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            ทั้งหมด {vendors.length} รายการ
          </p>

        </div>

        <Link
          href="/vendors/new"
          className="
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            to-blue-700
            px-6
            py-3
            font-bold
            text-white
            shadow-md
            transition
            hover:scale-105
            hover:shadow-xl
          "
        >
          + เพิ่มผู้จำหน่าย
        </Link>

      </div>

      {/* Table */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-md
        "
      >

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>

              <tr>

                <th>ชื่อผู้จำหน่าย</th>

                <th>ที่อยู่</th>

                <th>เบอร์ติดต่อ</th>

                <th>เลขประจำตัวผู้เสียภาษี</th>

                <th>จัดการ</th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    กำลังโหลด...
                  </td>

                </tr>

              ) : vendors.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    ยังไม่มีข้อมูลผู้จำหน่าย
                  </td>

                </tr>

              ) : (

                vendors.map((vendor) => (

                  <tr
                    key={vendor.id}
                    className="transition"
                  >

                    <td className="font-semibold">
                      {vendor.name}
                    </td>

                    <td>
                      {vendor.address || "-"}
                    </td>

                    <td className="text-center">
                      {vendor.phone || "-"}
                    </td>

                    <td className="text-center">
                      {vendor.taxId || "-"}
                    </td>

                    <td>

                      <div className="flex justify-center gap-2">

                        <Link
                          href={`/vendors/${vendor.id}/edit`}
                          className="
                            rounded-xl
                            bg-amber-500
                            px-4
                            py-2
                            font-bold
                            text-white
                            transition
                            hover:bg-amber-600
                          "
                        >
                          แก้ไข
                        </Link>

                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="
                            rounded-xl
                            bg-red-600
                            px-4
                            py-2
                            font-bold
                            text-white
                            transition
                            hover:bg-red-700
                          "
                        >
                          ลบ
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}