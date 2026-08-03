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
}: Props) {


  const emptyRow = (): ReceiveRow => ({
    category: "",
    materialId: "",
    qty: "",
    unitPrice: "",
    manufacture: "",
    expiry: "",
  });



  const [items, setItems] = useState<ReceiveRow[]>(
    Array.from(
      {
        length: 5,
      },
      emptyRow
    )
  );



  function updateRow(
    index: number,
    key: keyof ReceiveRow,
    value: string
  ) {

    const copy = [...items];

    copy[index][key] = value;


    if (key === "category") {
      copy[index].materialId = "";
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
        to-slate-800
        p-6
        shadow-xl
      "
    >


      <form
        action={createReceive}
        className="space-y-6"
      >



        {/* ข้อมูลเอกสาร */}

        <div
          className="
            grid
            gap-5
            md:grid-cols-3
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
              วันที่รับเข้า
            </label>


            <input
              type="date"
              name="receiveDate"
              required
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-black
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
              เลขที่เอกสาร
            </label>


            <input
              type="text"
              name="documentNo"
              required
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-black
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
                p-3
                text-black
              "
            >

              <option value="">
                -- เลือกผู้จำหน่าย --
              </option>


              {vendors.map((vendor)=>(
                <option
                  key={vendor.id}
                  value={vendor.id}
                >
                  {vendor.name}
                </option>
              ))}


            </select>


          </div>


        </div>
                {/* ตารางรายการพัสดุ */}

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


            <table className="min-w-full">


              <thead>

                <tr>

                  {[
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
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-3
                        py-4
                        text-center
                        text-lg
                        font-extrabold
                        text-white
                      "
                    >
                      {title}
                    </th>

                  ))}


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
                        border-slate-200
                        hover:bg-blue-50
                      "
                    >



                      {/* ลำดับ */}

                      <td
                        className="
                          px-3
                          py-3
                          text-center
                          font-bold
                          text-slate-700
                        "
                      >

                        {index + 1}

                      </td>




                      {/* หมวดหมู่ */}

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

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
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-black
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

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >


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
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-black
                          "

                        >


                          <option value="">

                            เลือกพัสดุ

                          </option>




                          {filteredMaterials.map((material)=>(


                            <option

                              key={material.id}

                              value={material.id}

                            >

                              {material.code}
                              {" - "}
                              {material.name}


                            </option>


                          ))}



                        </select>


                      </td>





                      {/* หน่วย */}

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

                        <input

                          type="text"

                          readOnly

                          value={
                            selectedMaterial?.unit ?? ""
                          }

                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-100
                            p-2
                            text-black
                          "

                        />


                      </td>
                                            {/* จำนวน */}

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

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
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-black
                          "

                        />

                      </td>





                      {/* ราคา */}

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

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
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-black
                          "

                        />

                      </td>





                      {/* วันผลิต */}

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

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
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-black
                          "

                        />

                      </td>





                      {/* วันหมดอายุ */}

                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

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
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-black
                          "

                        />



                        {/* ส่ง materialId เข้า Server Action */}

                        <input

                          type="hidden"

                          name={`items[${index}].materialId`}

                          value={row.materialId}

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
              text-lg
              font-extrabold
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
              p-3
              text-black
            "

          />


        </div>





        {/* ปุ่มบันทึก */}

        <div
          className="
            flex
            justify-end
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

            บันทึกข้อมูล

          </button>


        </div>



      </form>


    </div>

  );

}