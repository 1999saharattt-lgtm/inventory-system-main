"use client";

import { useMemo, useState } from "react";
import { MATERIALS } from "@/lib/materials";
import { UNITS } from "@/lib/units";


type Vendor = {
  id: number;
  name: string;
};


type MaterialMaster = {
  id: number;
  category: string;
  name: string;
  unit: string;
};


type Props = {
  vendors: Vendor[];
  materialMasters: MaterialMaster[];
};


const categoryMap: Record<string, string> = {
  "วัสดุสำนักงาน": "OFFICE",
  "วัสดุคอมพิวเตอร์": "COMPUTER",
  "วัสดุไฟฟ้าและวิทยุ": "ELECTRIC",
  "วัสดุงานบ้านและงานครัว": "HOUSEHOLD",
  "วัสดุยานพาหนะ": "VEHICLE",
  "วัสดุสื่อสิ่งพิมพ์": "PRINTING",
};



export default function MaterialForm({
  vendors,
  materialMasters,
}: Props) {


  const categories = Object.keys(categoryMap);


  const [category, setCategory] = useState("");
  const [name, setName] = useState("");

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");



  const names = useMemo(() => {


    if (!category) return [];



    const oldNames =
      MATERIALS[
        category as keyof typeof MATERIALS
      ] ?? [];



    const newNames =
      materialMasters
        .filter(
          (item) =>
            item.category === categoryMap[category]
        )
        .map(
          (item) => item.name
        );



    return Array.from(
      new Set([
        ...oldNames,
        ...newNames,
      ])
    );


  }, [
    category,
    materialMasters
  ]);




  const unit =
    name === "__NEW__"
      ? newUnit.trim()
      :
        UNITS[name]
        ??
        materialMasters.find(
          (item) =>
            item.name === name
        )?.unit
        ??
        "";





  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {


    e.preventDefault();



    const formData =
      new FormData(e.currentTarget);




    const materialName =
      name === "__NEW__"
        ? newName.trim()
        : name;



    if (!materialName) {
      alert("กรุณาระบุชื่อรายการพัสดุ");
      return;
    }



    if (!unit) {
      alert("กรุณาระบุหน่วย");
      return;
    }



    if (!categoryMap[category]) {
      alert("กรุณาเลือกหมวดหมู่");
      return;
    }



    const body = {


      code:
        formData.get("code"),



      vendorId:
        formData.get("vendorId")
          ? Number(formData.get("vendorId"))
          : null,



      category:
        categoryMap[category],



      name:
        materialName,



      unit,



      balance:
        Number(
          formData.get("balance")
        ),



      latestPrice:
        Number(
          Number(
            formData.get("latestPrice")
          ).toFixed(2)
        ),


    };



    const res =
      await fetch(
        "/api/materials",
        {
          method: "POST",

          headers:{
            "Content-Type":"application/json",
          },

          body:
            JSON.stringify(body),
        }
      );



    if(res.ok){


      window.location.href =
        `/materials/category/${categoryMap[category]}`;


    } else {


      const data =
        await res.json();


      alert(
        data.message ??
        "บันทึกไม่สำเร็จ"
      );


    }


  }
    return (

    <form
      onSubmit={handleSubmit}
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


      {/* รหัสพัสดุ */}

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
          รหัสพัสดุ
        </label>


        <input
          name="code"
          required
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            placeholder:text-slate-400
            focus:border-cyan-400
            focus:outline-none
          "
        />

      </div>





      {/* ผู้จำหน่าย */}

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
          ผู้จำหน่าย
        </label>



        <select
          name="vendorId"
          defaultValue=""
          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "
        >


          <option value="">
            เลือกผู้จำหน่าย
          </option>



          {
            vendors.map(
              (vendor: Vendor) => (

                <option
                  key={vendor.id}
                  value={vendor.id}
                >
                  {vendor.name}
                </option>

              )
            )
          }


        </select>


      </div>





      {/* หมวดหมู่ */}

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
          หมวดหมู่
        </label>



        <select

          value={category}

          onChange={(e)=>{

            setCategory(e.target.value);
            setName("");
            setNewName("");
            setNewUnit("");

          }}

          required

          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "

        >


          <option value="">
            เลือกหมวดหมู่
          </option>



          {
            categories.map(
              (c:string)=> (

                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>

              )
            )
          }


        </select>


      </div>





      {/* รายการพัสดุ */}

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
          รายการพัสดุ
        </label>



        <select

          value={name}

          onChange={(e)=>
            setName(e.target.value)
          }

          required

          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-white
            focus:border-cyan-400
            focus:outline-none
          "

        >


          <option value="">
            เลือกรายการพัสดุ
          </option>



          {
            names.map(
              (item:string)=> (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )
          }



          <option value="__NEW__">
            + เพิ่มรายการใหม่...
          </option>


        </select>
                {
          name === "__NEW__" && (

            <div
              className="
                mt-4
                space-y-3
              "
            >


              <input

                value={newName}

                onChange={(e)=>
                  setNewName(e.target.value)
                }

                placeholder="ชื่อรายการใหม่"

                required

                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-600
                  bg-slate-800
                  p-3
                  text-white
                  placeholder:text-slate-400
                  focus:border-cyan-400
                  focus:outline-none
                "

              />



              <input

                value={newUnit}

                onChange={(e)=>
                  setNewUnit(e.target.value)
                }

                placeholder="หน่วย เช่น ชิ้น, กล่อง, อัน"

                required

                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-600
                  bg-slate-800
                  p-3
                  text-white
                  placeholder:text-slate-400
                  focus:border-cyan-400
                  focus:outline-none
                "

              />


            </div>

          )
        }


      </div>






      {/* จำนวน + หน่วย */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
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
            จำนวน
          </label>



          <input

            type="number"

            name="balance"

            defaultValue={0}

            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              p-3
              text-white
              focus:border-cyan-400
              focus:outline-none
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
            หน่วย
          </label>



          <input

            value={unit}

            readOnly

            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-700
              p-3
              text-white
            "

          />


        </div>


      </div>







      {/* ราคาล่าสุด */}

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
          ราคาล่าสุด
        </label>



        <input

          type="number"

          name="latestPrice"

          defaultValue="0.00"

          step="0.01"

          min="0"

          className="
            w-full
            rounded-xl
            border
            border-slate-600
            bg-slate-800
            p-3
            text-right
            text-white
            focus:border-cyan-400
            focus:outline-none
          "

        />


      </div>
            {/* Action Buttons */}

      <div
        className="
          flex
          gap-4
          pt-4
        "
      >


        <button

          type="submit"

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
"

        >

          บันทึก

        </button>





        <a

          href="/materials"

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