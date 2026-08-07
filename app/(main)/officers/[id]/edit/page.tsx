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
    formData: FormData
  ) {

    setLoading(true);


    try {

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

  action={handleSubmit}

  className="
    max-w-5xl
    space-y-6
    rounded-3xl
    border
    border-slate-700
    bg-gradient-to-br
    from-slate-950
    via-slate-900
    to-slate-800
    p-8
    text-white
    shadow-2xl
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
          text-white
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
          border-slate-600
          bg-slate-800
          px-4
          py-3
          font-bold
          text-white
          outline-none
          transition
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-300
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
          text-white
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
          border-slate-600
          bg-slate-800
          px-4
          py-3
          font-bold
          text-white
          outline-none
          transition
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-300
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
          text-white
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
          border-slate-600
          bg-slate-800
          px-4
          py-3
          font-bold
          text-white
          outline-none
          transition
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-300
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
        text-white
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
        border-slate-600
        bg-slate-800
        px-4
        py-3
        font-bold
        text-white
        outline-none
        transition
        focus:border-cyan-400
        focus:ring-2
        focus:ring-cyan-300
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
        bg-gradient-to-r
        from-slate-800
        to-slate-700
        px-8
        py-3
        font-extrabold
        text-white
        shadow-lg
        transition
        hover:scale-105
      "

    >

      ยกเลิก

    </a>



  </div>




</form>

);

}