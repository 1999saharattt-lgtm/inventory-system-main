"use client";

import { useState } from "react";

export default function VendorForm() {
  const [loading, setLoading] = useState(false);


  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);


    const formData = new FormData(e.currentTarget);

    const body = Object.fromEntries(
      formData.entries()
    );


    const res = await fetch("/api/vendors", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),

    });


    setLoading(false);


    if (res.ok) {

      alert("เพิ่มผู้จำหน่ายสำเร็จ");

      window.location.href = "/vendors";

    } else {

      alert("เกิดข้อผิดพลาด");

    }

  }



  return (

    <form
      onSubmit={handleSubmit}
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

          required

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
          เบอร์โทร
        </label>


        <input

          name="phone"

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






      <div className="flex gap-3 pt-4">


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




        <a

          href="/vendors"

          className="
            rounded-xl
            bg-slate-700
            px-6
            py-3
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:bg-slate-800
          "

        >

          ยกเลิก

        </a>


      </div>


    </form>

  );
}