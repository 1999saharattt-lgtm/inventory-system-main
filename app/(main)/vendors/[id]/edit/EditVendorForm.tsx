"use client";

import { useState } from "react";

type Vendor = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
};

export default function EditVendorForm({
  vendor,
}: {
  vendor: Vendor;
}) {

  const [loading, setLoading] = useState(false);


  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);


    try {

      const formData =
        new FormData(
          e.currentTarget as HTMLFormElement
        );


      const body = {

        name: formData.get("name"),

        address: formData.get("address"),

        phone: formData.get("phone"),

        taxId: formData.get("taxId"),

      };



      const res = await fetch(
        `/api/vendors/${vendor.id}`,
        {
          method:"PUT",

          headers:{
            "Content-Type":"application/json",
          },

          body:JSON.stringify(body),
        }
      );



      if(res.ok){

        alert("บันทึกสำเร็จ");

        location.href="/vendors";

      }else{

        alert("บันทึกไม่สำเร็จ");

      }


    }catch(error){

      console.error(error);

      alert("เกิดข้อผิดพลาด");


    }finally{

      setLoading(false);

    }

  }



  return (

    <form

      onSubmit={handleSubmit}

      className="
        w-full
        space-y-6
      "
    >



      <div
        className="
          grid
          gap-6
          md:grid-cols-2
        "
      >



        <div>

          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-slate-900
            "
          >
            ชื่อผู้จำหน่าย
          </label>


          <input

            name="name"

            defaultValue={vendor.name}

            required

            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-bold
              text-black
              outline-none
              transition
              focus:border-emerald-500
              focus:ring-2
              focus:ring-emerald-200
            "

          />

        </div>





        <div>

          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-slate-900
            "
          >
            เบอร์โทร
          </label>


          <input

            name="phone"

            defaultValue={vendor.phone ?? ""}

            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-bold
              text-black
              outline-none
              transition
              focus:border-emerald-500
              focus:ring-2
              focus:ring-emerald-200
            "

          />

        </div>





        <div>

          <label
            className="
              mb-2
              block
              text-lg
              font-extrabold
              text-slate-900
            "
          >
            เลขประจำตัวผู้เสียภาษี
          </label>


          <input

            name="taxId"

            defaultValue={vendor.taxId ?? ""}

            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-bold
              text-black
              outline-none
              transition
              focus:border-emerald-500
              focus:ring-2
              focus:ring-emerald-200
            "

          />

        </div>


      </div>





      <div>

        <label
          className="
            mb-2
            block
            text-lg
            font-extrabold
            text-slate-900
          "
        >
          ที่อยู่
        </label>


        <textarea

          name="address"

          rows={4}

          defaultValue={vendor.address ?? ""}

          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-bold
            text-black
            outline-none
            transition
            focus:border-emerald-500
            focus:ring-2
            focus:ring-emerald-200
          "

        />

      </div>







      <div
        className="
          flex
          gap-4
          pt-4
        "
      >



        <button

          type="submit"

          disabled={loading}

          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-8
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            disabled:opacity-50
          "

        >

          {
            loading
            ? "กำลังบันทึก..."
            : "💾 บันทึก"
          }

        </button>





        <a

          href="/vendors"

          className="
            rounded-xl
            border
            border-slate-300
            bg-white
            px-8
            py-3
            font-extrabold
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-100
          "

        >

          ยกเลิก

        </a>


      </div>



    </form>

  );

}