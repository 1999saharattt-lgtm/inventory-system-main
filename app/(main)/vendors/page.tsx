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

  const [vendors, setVendors] =
    useState<Vendor[]>([]);

  const [loading, setLoading] =
    useState(true);



  useEffect(() => {
    loadVendors();
  }, []);



  async function loadVendors() {

    try {

      setLoading(true);

      const res =
        await fetch(
          "/api/vendors",
          {
            cache: "no-store",
          }
        );


      if (!res.ok) {
        throw new Error();
      }


      const data =
        await res.json();


      setVendors(data);


    } catch(err) {

      console.error(err);

      alert(
        "ไม่สามารถโหลดข้อมูลผู้จำหน่ายได้"
      );


    } finally {

      setLoading(false);

    }

  }





  async function handleDelete(id:number){

    const ok =
      confirm(
        "ต้องการลบผู้จำหน่ายรายนี้ใช่หรือไม่?"
      );


    if(!ok) return;



    try {


      const res =
        await fetch(
          `/api/vendors/${id}`,
          {
            method:"DELETE",
          }
        );


      if(res.ok){

        alert("ลบสำเร็จ");

        loadVendors();

      }
      else{

        const data =
          await res.json();

        alert(
          data.message ??
          "ลบไม่สำเร็จ"
        );

      }



    } catch(err){

      console.error(err);

      alert(
        "เกิดข้อผิดพลาด"
      );

    }

  }





  return (

    <div className="space-y-6">



      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          text-white
          shadow-xl
        "
      >


        <div>


          <h1
            className="
              !text-white
              text-5xl
              font-extrabold
              leading-tight
            "
          >
            🏢 ผู้จำหน่าย
          </h1>



          <p
            className="
              mt-3
              text-xl
              font-semibold
              text-slate-200
            "
          >
            ทั้งหมด {vendors.length} รายการ
          </p>


        </div>




        <Link
          href="/vendors/new"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
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
          shadow-xl
        "
      >


        <div className="overflow-x-auto">


          <table
            className="
              min-w-full
              border
              border-slate-900
            "
          >


            <thead>


              <tr>


                {
                  [
                    "ชื่อผู้จำหน่าย",
                    "ที่อยู่",
                    "เบอร์ติดต่อ",
                    "เลขประจำตัวผู้เสียภาษี",
                    "จัดการ",
                  ].map((title)=>(


  <th
  key={title}
  className={`
    border
    border-slate-900
    bg-gradient-to-r
    from-slate-800
    to-slate-700
    px-4
    py-4
    text-center
    text-lg
    font-extrabold
    text-white
    whitespace-nowrap
    ${title === "ที่อยู่" ? "min-w-[320px]" : ""}
    ${title === "เลขประจำตัวผู้เสียภาษี" ? "min-w-[160px]" : ""}
  `}
>
  {title}
</th>


                  ))
                }


              </tr>


            </thead>





            <tbody>


              {
                loading ? (


                  <tr>

                    <td
                      colSpan={5}
                      className="
                        py-12
                        text-center
                        text-lg
                        font-bold
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
                        py-12
                        text-center
                        text-lg
                        font-bold
                        text-slate-500
                      "
                    >

                      ยังไม่มีข้อมูลผู้จำหน่าย

                    </td>


                  </tr>


                ) : (



                  vendors.map((vendor)=>(


                    <tr
                      key={vendor.id}
                      className="
                        border
                        border-slate-900
                        text-slate-900
                        hover:bg-blue-50
                      "
                    >


                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          font-extrabold
                        "
                      >

                        {vendor.name}

                      </td>




                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          font-semibold
                          whitespace-normal
                          break-words
                          max-w-[320px]
                        "
                      >

                        {vendor.address ?? "-"}

                      </td>





                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                          text-center
                          font-semibold
                        "
                      >

                        {vendor.phone ?? "-"}

                      </td>





                      <td
                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                          text-center
                          font-semibold
                          whitespace-nowrap
                        "
                      >

                        {vendor.taxId ?? "-"}

                      </td>





                      <td
                        className="
                          border
                          border-slate-900
                          px-4
                          py-3
                        "
                      >


                        <div
                          className="
                            flex
                            justify-center
                            gap-2
                          "
                        >



                          <Link
                            href={`/vendors/${vendor.id}/edit`}
                            className="
                              rounded-xl
                              bg-slate-800
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow
                              transition
                              hover:bg-slate-700
                            "
                          >
                            แก้ไข
                          </Link>





                          <button
                            onClick={() =>
                              handleDelete(vendor.id)
                            }
                            className="
                              rounded-xl
                              bg-red-600
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow
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

                )
              }



            </tbody>


          </table>


        </div>


      </div>



    </div>

  );

}