"use client";

import { useState } from "react";

export default function VendorForm() {

  const [loading, setLoading] = useState(false);


  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);


    try {

      const formData = new FormData(e.currentTarget);


      const body = Object.fromEntries(
        formData.entries()
      );


      const res = await fetch(
        "/api/vendors",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json",
          },

          body:JSON.stringify(body),
        }
      );



      if(res.ok){

        alert("เพิ่มผู้จำหน่ายสำเร็จ");

        window.location.href="/vendors";

      }else{

        alert("เกิดข้อผิดพลาด");

      }


    }catch(error){

      console.error(error);

      alert("ไม่สามารถบันทึกข้อมูลได้");


    }finally{

      setLoading(false);

    }

  }




  return (

    <form

      onSubmit={handleSubmit}

      className="
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



        {/* ชื่อ */}

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

            required

            placeholder="ระบุชื่อผู้จำหน่าย"

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





        {/* เบอร์โทร */}

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

            placeholder="ระบุเบอร์โทร"

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





        {/* เลขภาษี */}

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

            placeholder="ระบุเลขผู้เสียภาษี"

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






      {/* ที่อยู่ */}

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

          placeholder="ระบุที่อยู่ผู้จำหน่าย"

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







      {/* ปุ่ม */}

      <div

        className="
          flex
          justify-end
          gap-3
          pt-4
        "

      >



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



      </div>




    </form>

  );

}