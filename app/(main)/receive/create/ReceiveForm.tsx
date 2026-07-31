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
      { length: 5 },
      emptyRow
    )
  );



  function updateRow(
    index:number,
    key:keyof ReceiveRow,
    value:string
  ){

    const copy = [...items];

    copy[index][key] = value;


    if(key === "category"){
      copy[index].materialId = "";
    }


    setItems(copy);

  }



  return (

    <div
      className="
        rounded-3xl
        border
        border-slate-700
        bg-gradient-to-br
        from-slate-950
        via-slate-800
        to-slate-700
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

            <label className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            ">
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
                p-3
                text-black
              "
            />

          </div>
                    <div>

            <label className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            ">
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
                p-3
                text-black
              "
            />

          </div>





          <div>

            <label className="
              mb-2
              block
              text-lg
              font-extrabold
              text-white
            ">
              ผู้จำหน่าย
            </label>


            <select
              name="vendorId"
              required
              className="
                w-full
                rounded-xl
                border
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
            border-slate-600
          "
        >


          <div className="overflow-x-auto">


            <table className="min-w-full">


              <thead
                className="
                  bg-slate-950
                  text-white
                "
              >

                <tr
                  className="
                    text-lg
                    font-extrabold
                  "
                >

                  <th className="px-3 py-4">
                    ลำดับ
                  </th>


                  <th className="px-3 py-4">
                    หมวดหมู่
                  </th>


                  <th className="px-3 py-4">
                    รายการพัสดุ
                  </th>


                  <th className="px-3 py-4">
                    หน่วย
                  </th>


                  <th className="px-3 py-4">
                    จำนวน
                  </th>


                  <th className="px-3 py-4">
                    ราคา
                  </th>


                  <th className="px-3 py-4">
                    วันผลิต
                  </th>


                  <th className="px-3 py-4">
                    วันหมดอายุ
                  </th>


                </tr>


              </thead>




              <tbody
                className="
                  bg-slate-800
                  text-white
                "
              >


                {items.map((row,index)=>{


                  const filteredMaterials =
                    materials.filter(
                      (m)=>
                        m.category === row.category
                    );



                  const selectedMaterial =
                    materials.find(
                      (m)=>
                        m.id === Number(row.materialId)
                    );



                  return (

                    <tr
                      key={index}
                      className="
                        border-t
                        border-slate-700
                        hover:bg-slate-700
                      "
                    >


                      <td
                        className="
                          px-3
                          py-3
                          text-center
                          font-bold
                        "
                      >
                        {index+1}
                      </td>
                                            <td className="px-3 py-3">

                        <select
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
                            p-2
                            text-black
                          "
                        >

                          <option value="">
                            เลือกหมวด
                          </option>


                          {categories.map((c)=>(
                            <option
                              key={c.value}
                              value={c.value}
                            >
                              {c.label}
                            </option>
                          ))}


                        </select>

                      </td>





                      <td className="px-3 py-3">

                        <select
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





                      <td className="px-3 py-3">

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
                            bg-slate-200
                            p-2
                            text-black
                          "
                        />

                      </td>





                      <td className="px-3 py-3">

                        <input
                          type="number"
                          min={1}
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
                            p-2
                            text-black
                          "
                        />


                        <input
                          type="hidden"
                          name={`items[${index}].qty`}
                          value={row.qty}
                        />

                      </td>





                      <td className="px-3 py-3">

                        <input
                          type="number"
                          step="0.01"
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
                            p-2
                            text-black
                          "
                        />


                        <input
                          type="hidden"
                          name={`items[${index}].unitPrice`}
                          value={row.unitPrice}
                        />

                      </td>





                      <td className="px-3 py-3">

                        <input
                          type="date"
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
                            p-2
                            text-black
                          "
                        />


                        <input
                          type="hidden"
                          name={`items[${index}].manufacture`}
                          value={row.manufacture}
                        />

                      </td>





                      <td className="px-3 py-3">

                        <input
                          type="date"
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
                            p-2
                            text-black
                          "
                        />


                        <input
                          type="hidden"
                          name={`items[${index}].expiry`}
                          value={row.expiry}
                        />


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
                              <td
                        className="
                          px-3
                          py-3
                        "
                      >

                        <input
                          type="date"
                          value={row.manufacture}
                          onChange={(e) =>
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
                            p-2
                            text-black
                          "
                        />


                        <input
                          type="hidden"
                          name={`items[${index}].manufacture`}
                          value={row.manufacture}
                        />


                      </td>




                      <td
                        className="
                          px-3
                          py-3
                        "
                      >

                        <input
                          type="date"
                          value={row.expiry}
                          onChange={(e) =>
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
                            p-2
                            text-black
                          "
                        />


                        <input
                          type="hidden"
                          name={`items[${index}].expiry`}
                          value={row.expiry}
                        />


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





        {/* Remark */}


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
              p-3
              text-black
            "

          />


        </div>





        {/* Submit */}


        <div
          className="
            flex
            justify-end
            gap-3
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