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

    const ok = confirm(
      "ต้องการลบผู้จำหน่ายรายนี้ใช่หรือไม่?"
    );


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
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >


        <div>

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-800
            "
          >
            ผู้จำหน่าย
          </h1>


          <p className="mt-2 text-slate-600">
            ทั้งหมด {vendors.length} รายการ
          </p>


        </div>



        <Link
          href="/vendors/new"
          className="
            rounded-lg
            bg-blue-700
            px-5
            py-3
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-blue-800
          "
        >
          + เพิ่มผู้จำหน่าย
        </Link>


      </div>





      {/* Table */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-300
          bg-white
          shadow-sm
        "
      >


        <div className="overflow-x-auto">


          <table className="min-w-full border-collapse">


            <thead className="bg-slate-200">


              <tr
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >

                <th className="border border-slate-300 px-4 py-3 text-center">
                  ชื่อผู้จำหน่าย
                </th>


                <th className="border border-slate-300 px-4 py-3">
                  ที่อยู่
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center">
                  เบอร์ติดต่อ
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center">
                  เลขประจำตัวผู้เสียภาษี
                </th>


                <th className="w-48 border border-slate-300 px-4 py-3 text-center">
                  จัดการ
                </th>


              </tr>


            </thead>




            <tbody>


              {loading ? (


                <tr>

                  <td
                    colSpan={5}
                    className="
                      border
                      border-slate-300
                      py-12
                      text-center
                      text-slate-500
                    "
                  >
                    กำลังโหลด...
                  </td>


                </tr>



              ) : vendors.length === 0 ? (


                <tr>

                  <td
                    colSpan={5}
                    className="
                      border
                      border-slate-300
                      py-12
                      text-center
                      text-slate-500
                    "
                  >
                    ยังไม่มีข้อมูลผู้จำหน่าย
                  </td>


                </tr>



              ) : (


                vendors.map((vendor) => (


                  <tr
                    key={vendor.id}
                    className="
                      odd:bg-white
                      even:bg-slate-50
                      hover:bg-blue-50
                      transition-colors
                    "
                  >


                    <td className="border border-slate-300 px-4 py-3 text-slate-700">
                      {vendor.name}
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-slate-700">
                      {vendor.address || "-"}
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-center text-slate-700">
                      {vendor.phone || "-"}
                    </td>


                    <td className="border border-slate-300 px-4 py-3 text-center text-slate-700">
                      {vendor.taxId || "-"}
                    </td>




                    <td className="border border-slate-300 px-4 py-3">


                      <div className="flex justify-center gap-2">


                        <Link
                          href={`/vendors/${vendor.id}/edit`}
                          className="
                            rounded-lg
                            bg-amber-500
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            shadow-sm
                            transition
                            hover:bg-amber-600
                          "
                        >
                          แก้ไข
                        </Link>



                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="
                            rounded-lg
                            bg-red-600
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            shadow-sm
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