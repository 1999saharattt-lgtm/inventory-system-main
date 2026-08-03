"use client";

import { useState } from "react";


type Department = {
  id: number;
  name: string;
};


type Officer = {
  id: number;
  firstName: string;
  lastName: string;
};


type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
};


type Props = {
  departments: Department[];
  officers: Officer[];
  materials: Material[];
};



export default function IssueForm({
  departments,
  officers,
  materials,
}: Props) {


  const [remark, setRemark] = useState("");



  return (

    <form
      className="
        space-y-6
      "
    >



      {/* หน่วยงาน */}

      <div>

        <label
          className="
            mb-2
            block
            font-bold
            text-white
          "
        >
          หน่วยงาน / กลุ่มงาน
        </label>


        <select
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
          "
        >

          <option>
            เลือกหน่วยงาน
          </option>


          {
            departments.map((department)=>(
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))
          }


        </select>


      </div>





      {/* ผู้ขอเบิก */}

      <div>

        <label
          className="
            mb-2
            block
            font-bold
            text-white
          "
        >
          ผู้ขอเบิก
        </label>


        <select
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
          "
        >

          <option>
            เลือกผู้ขอเบิก
          </option>


          {
            officers.map((officer)=>(
              <option
                key={officer.id}
                value={officer.id}
              >

                {officer.firstName} {officer.lastName}

              </option>
            ))
          }


        </select>


      </div>





      {/* รายการวัสดุ */}

      <div>

        <label
          className="
            mb-2
            block
            font-bold
            text-white
          "
        >
          รายการพัสดุ
        </label>


        <select
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
          "
        >

          <option>
            เลือกพัสดุ
          </option>


          {
            materials.map((material)=>(
              <option
                key={material.id}
                value={material.id}
              >

                {material.code} - {material.name}

              </option>
            ))
          }


        </select>


      </div>






      {/* หมายเหตุ */}

      <div>

        <label
          className="
            mb-2
            block
            font-bold
            text-white
          "
        >
          หมายเหตุ
        </label>


        <textarea

          value={remark}

          onChange={(e)=>setRemark(e.target.value)}

          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
          "

          rows={3}

        />


      </div>





      <button
        type="submit"
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
        "
      >

        บันทึกการเบิก

      </button>




    </form>

  );

}