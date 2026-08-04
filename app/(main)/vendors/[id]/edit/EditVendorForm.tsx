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



  async function handleSubmit(formData: FormData) {

    setLoading(true);


    const body = {

      name: formData.get("name"),

      address: formData.get("address"),

      phone: formData.get("phone"),

      taxId: formData.get("taxId"),

    };



    const res = await fetch(
      `/api/vendors/${vendor.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      }
    );



    if (res.ok) {

      alert("บันทึกสำเร็จ");

      location.href = "/vendors";

    } else {

      alert("บันทึกไม่สำเร็จ");

    }



    setLoading(false);

  }



  return (

    <form
      action={handleSubmit}
      className="
        max-w-3xl
        space-y-6
      "
    >



      <div>

        <label
          className="
            mb-2
            block
            text-lg
            font-extrabold
            text-slate-800
          "
        >
          ชื่อผู้จำหน่าย
        </label>


        <input

          name="name"

          defaultValue={vendor.name}

          className="
            w-full
            rounded-xl
            border
            border-slate-300
            px-4
            py-3
            text-slate-800
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
            text-slate-800
          "
        >
          ที่อยู่
        </label>


        <textarea

          name="address"

          rows={3}

          defaultValue={vendor.address ?? ""}

          className="
            w-full
            rounded-xl
            border
            border-slate-300
            px-4
            py-3
            text-slate-800
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
            font-extrabอด
            text-slate-800
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
            px-4
            py-3
            text-slate-800
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
            text-slate-800
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
            px-4
            py-3
            text-slate-800
            outline-none
            transition
            focus:border-emerald-500
            focus:ring-2
            focus:ring-emerald-200
          "

        />

      </div>






      <div className="pt-4">

        <button

          disabled={loading}

          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            disabled:opacity-50
          "

        >

          {loading
            ? "กำลังบันทึก..."
            : "บันทึก"
          }

        </button>


      </div>



    </form>

  );

}