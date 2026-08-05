"use client";

import { useState } from "react";
import { createReceive } from "./actions";


type Vendor = {
  id: number;
  name: string;
};


type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
};


type ReceiveRow = {
  category: string;
  materialId: string;
  qty: string;
  unitPrice: string;
  manufacture: string;
  expiry: string;
};


type Props = {
  vendors: Vendor[];
  materials: Material[];
  documentNo: string;
};



const categories = [
  {
    value: "OFFICE",
    label: "วัสดุสำนักงาน",
  },
  {
    value: "COMPUTER",
    label: "วัสดุคอมพิวเตอร์",
  },
  {
    value: "ELECTRIC",
    label: "วัสดุไฟฟ้าและวิทยุ",
  },
  {
    value: "HOUSEHOLD",
    label: "วัสดุงานบ้านและงานครัว",
  },
  {
    value: "VEHICLE",
    label: "วัสดุยานพาหนะ",
  },
  {
    value: "PRINTING",
    label: "วัสดุสื่อสิ่งพิมพ์",
  },
];




export default function ReceiveForm({
  vendors,
  materials,
  documentNo,
}: Props) {



  const emptyRow = (): ReceiveRow => ({
    category: "",
    materialId: "",
    qty: "",
    unitPrice: "",
    manufacture: "",
    expiry: "",
  });



  const [items,setItems] = useState<ReceiveRow[]>(
    Array.from(
      {
        length:15,
      },
      emptyRow
    )
  );

  const [isOpeningBalance,setIsOpeningBalance] = useState(false);

const [documentValue,setDocumentValue] = useState(documentNo);




  function updateRow(
    index:number,
    key:keyof ReceiveRow,
    value:string
  ){

    const copy=[...items];

    copy[index][key]=value;


    if(key==="category"){
      copy[index].materialId="";
    }


    setItems(copy);

  }




  return (

    <div
      className="
        rounded-2xl
        border
        border-slate-700
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-800
        p-6
        shadow-xl
      "
    >



      <form
        action={createReceive}
        className="space-y-8"
      >




        {/* ข้อมูลเอกสาร */}

        <div
          className="
            grid
            gap-5
            md:grid-cols-[1fr_1fr_1.2fr]
          "
        >




          {/* วันที่รับเข้า */}

          <div>

            <label
              className="
                mb-2
                block
                text-base
                font-bold
                text-white
              "
            >
              วันที่รับเข้า
            </label>


            <input
              type="date"
              name="receiveDate"
              defaultValue={
                new Date()
                .toISOString()
                .split("T")[0]
              }
              required
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-base
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-100
              "
            />

          </div>
{/* เลขที่เอกสาร */}

<div>

  <label
    className="
      mb-2
      block
      text-base
      font-bold
      text-white
    "
  >
    เลขที่เอกสาร
  </label>


  <div
    className="
      rounded-xl
      border
      border-cyan-400
      bg-slate-100
      p-3
    "
  >

    <input
      type="text"
      name="documentNo"
      value={documentValue}
      onChange={(e)=>{
        setDocumentValue(e.target.value);
      }}
      readOnly={!isOpeningBalance}
      className="
        w-full
        bg-transparent
        px-2
        py-2
        text-lg
        font-extrabold
        text-cyan-700
        outline-none
      "
    />

  </div>


  <label
  className="
    mt-3
    flex
    w-max
    items-center
    gap-2
    cursor-pointer
    whitespace-nowrap
    text-sm
    font-semibold
    text-white
  "
>

    <input
      type="checkbox"
      checked={isOpeningBalance}
      onChange={(e)=>{

        const checked = e.target.checked;

        setIsOpeningBalance(checked);

        if(checked){

          setDocumentValue("ยอดยกเข้าระบบ");

        }else{

          setDocumentValue(documentNo);

        }

      }}
      className="
        h-4
        w-4
        shrink-0
        cursor-pointer
      "
    />
<span
  className="
    whitespace-nowrap
  "
>
  ยอดยกเข้าระบบ
</span>
  </label>


</div>

          {/* ผู้จำหน่าย */}

          <div>

            <label
              className="
                mb-2
                block
                text-base
                font-bold
                text-white
              "
            >
              ผู้จำหน่าย
            </label>


            <select
              name="vendorId"
              required
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-base
                font-semibold
                text-slate-900
                outline-none
                focus:border-cyan-500
              "
            >

              <option value="">
                -- เลือกผู้จำหน่าย --
              </option>


              {
                vendors.map((vendor)=>(

                  <option
                    key={vendor.id}
                    value={vendor.id}
                  >
                    {vendor.name}
                  </option>

                ))
              }


            </select>


          </div>



        </div>






        {/* ตารางรายการพัสดุ */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-700
            bg-slate-950
            shadow-xl
          "
        >


          <div className="overflow-x-auto">


            <table className="min-w-full">


              <thead>

                <tr>

                  {
                    [
                      "ลำดับ",
                      "หมวดหมู่",
                      "รายการพัสดุ",
                      "หน่วย",
                      "จำนวน",
                      "ราคา",
                      "วันผลิต",
                      "วันหมดอายุ",
                    ].map((title)=>(


                      <th
                        key={title}
                        className="
                          whitespace-nowrap
                          bg-gradient-to-r
                          from-slate-800
                          to-slate-700
                          px-4
                          py-3
                          text-center
                          text-base
                          font-bold
                          text-white
                        "
                      >
                        {title}
                      </th>


                    ))
                  }


                </tr>


              </thead>




              <tbody>
                              {items.map((row,index)=>{


                  const filteredMaterials =
                    materials.filter(
                      (material)=>
                        material.category === row.category
                    );


                  const selectedMaterial =
                    materials.find(
                      (material)=>
                        material.id === Number(row.materialId)
                    );



                  return (

                    <tr
                      key={index}
                      className="
                        border-b
                        border-slate-700
                        transition
                        hover:bg-slate-800
                      "
                    >



                      {/* ลำดับ */}

                      <td
                        className="
                          px-4
                          py-3
                          text-center
                          font-bold
                          text-white
                        "
                      >
                        {index + 1}
                      </td>





                      {/* หมวดหมู่ */}

                      <td className="px-3 py-3">

                        <select
                          name={`items[${index}].category`}
                          value={row.category}
                          onChange={(e)=>
                            updateRow(
                              index,
                              "category",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            text-white
                            outline-none
                          "
                        >

                          <option value="">
                            เลือกหมวด
                          </option>


                          {categories.map((category)=>(

                            <option
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </option>

                          ))}


                        </select>


                      </td>







                      {/* รายการพัสดุ */}

                      <td className="px-3 py-3">


                        <select
                          name={`items[${index}].materialId`}
                          value={row.materialId}
                          onChange={(e)=>
                            updateRow(
                              index,
                              "materialId",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            text-white
                          "
                        >

                          <option value="">
                            เลือกรายการพัสดุ
                          </option>



                          {
                            filteredMaterials.map((material)=>(

                              <option
                                key={material.id}
                                value={material.id}
                              >

                                {material.code}
                                {" - "}
                                {material.name}

                              </option>

                            ))
                          }


                        </select>


                      </td>

                      {/* จำนวน */}

                      <td className="px-3 py-3">


                        <input
                          type="number"
                          min={1}
                          name={`items[${index}].qty`}
                          value={row.qty}
                          onChange={(e)=>
                            updateRow(
                              index,
                              "qty",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            text-white
                          "
                        />


                      </td>

{/* หน่วย */}

                      <td className="px-3 py-3">
                        <input
                          type="text"
                          readOnly
                          value={
                            selectedMaterial?.unit ?? ""
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            outline-none
                          "
                        />


                      </td>

                      {/* ราคา */}

                      <td className="px-3 py-3">


                        <input
                          type="number"
                          step="0.01"
                          name={`items[${index}].unitPrice`}
                          value={row.unitPrice}
                          onChange={(e)=>
                            updateRow(
                              index,
                              "unitPrice",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            text-white
                          "
                        />


                      </td>







                      {/* วันผลิต */}

                      <td className="px-3 py-3">


                        <input
                          type="date"
                          name={`items[${index}].manufacture`}
                          value={row.manufacture}
                          onChange={(e)=>
                            updateRow(
                              index,
                              "manufacture",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            text-white
                          "
                        />


                      </td>







                      {/* วันหมดอายุ */}

                      <td className="px-3 py-3">


                        <input
                          type="date"
                          name={`items[${index}].expiry`}
                          value={row.expiry}
                          onChange={(e)=>
                            updateRow(
                              index,
                              "expiry",
                              e.target.value
                            )
                          }
                          className="
                            w-full
                            rounded-lg
                            border
                            border-slate-600
                            bg-slate-800
                            px-3
                            py-2
                            text-sm
                            text-white
                          "
                        />

                      </td>



                    </tr>

                  );


                })}


              </tbody>


            </table>


          </div>


        </div>







        {/* หมายเหตุ */}

        <div>


          <label
            className="
              mb-2
              block
              text-base
              font-bold
              text-white
            "
          >
            หมายเหตุ
          </label>


          <textarea
            name="remark"
            rows={4}
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-slate-900
              outline-none
              focus:border-cyan-500
            "
          />


        </div>







        {/* ปุ่มบันทึก */}

        <div className="flex justify-end">


          <button
            type="submit"
            className="
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-8
              py-3
              text-base
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
              hover:shadow-xl
              active:scale-95
            "
          >

            💾 บันทึกข้อมูล

          </button>


        </div>



      </form>


    </div>

  );

}