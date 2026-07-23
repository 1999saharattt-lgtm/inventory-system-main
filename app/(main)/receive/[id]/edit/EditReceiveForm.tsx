"use client";

import { useState } from "react";
import { updateReceive } from "./actions";


type Vendor = {
  id:number;
  name:string;
};


type Material = {
  id:number;
  code:string;
  name:string;
  unit:string;
  category:string;
};


type Props = {
  receive:any;
  vendors:Vendor[];
  materials:Material[];
};


const categories = [
  {
    value:"OFFICE",
    label:"วัสดุสำนักงาน",
  },
  {
    value:"COMPUTER",
    label:"วัสดุคอมพิวเตอร์",
  },
  {
    value:"ELECTRIC",
    label:"วัสดุไฟฟ้าและวิทยุ",
  },
  {
    value:"HOUSEHOLD",
    label:"วัสดุงานบ้านและงานครัว",
  },
  {
    value:"VEHICLE",
    label:"วัสดุยานพาหนะ",
  },
];



export default function EditReceiveForm({
  receive,
  vendors,
  materials,
}:Props){


  const [items,setItems] = useState<any[]>(()=>{

    const rows = receive.items.map((item:any)=>({

      category:item.material.category,

      materialId:String(item.materialId),

      qty:String(item.qty),

      unitPrice:Number(item.unitPrice).toFixed(2),

      manufacture:item.manufacture
      ?
      item.manufacture.toISOString().split("T")[0]
      :
      "",

      expiry:item.expiry
      ?
      item.expiry.toISOString().split("T")[0]
      :
      "",

    }));


    while(rows.length < 15){

      rows.push({

        category:"",
        materialId:"",
        qty:"",
        unitPrice:"",
        manufacture:"",
        expiry:"",

      });

    }


    return rows;

  });



  function updateRow(
    index:number,
    key:string,
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

    <div className="rounded-xl bg-white p-6 shadow">


      <form
        action={updateReceive}
        className="space-y-6"
      >


        <input
          type="hidden"
          name="receiveId"
          value={receive.id}
        />



        <div>

          <label className="mb-2 block font-medium text-gray-900">
            วันที่รับเข้า
          </label>

          <input
            type="date"
            name="receiveDate"
            defaultValue={
              receive.receiveDate
              .toISOString()
              .split("T")[0]
            }
            className="w-full rounded-lg border p-2 text-gray-900"
          />

        </div>



        <div>

          <label className="mb-2 block font-medium text-gray-900">
            เลขที่เอกสาร
          </label>

          <input
            type="text"
            name="documentNo"
            defaultValue={receive.documentNo}
            className="w-full rounded-lg border p-2 text-gray-900"
          />

        </div>



        <div>

          <label className="mb-2 block font-medium text-gray-900">
            ผู้จำหน่าย
          </label>


          <select
            name="vendorId"
            defaultValue={receive.vendorId}
            className="w-full rounded-lg border p-2 text-gray-900"
          >

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




        <div className="overflow-x-auto">


        <table className="w-full border border-gray-300 text-sm">


          <thead className="bg-gray-100 text-black">


            <tr>


              <th className="border p-2 w-12">
                ลำดับ
              </th>


              <th className="border p-2 w-40">
                หมวด
              </th>


              <th className="border p-2 w-72">
                ชื่อพัสดุ
              </th>


              <th className="border p-2 w-24">
                หน่วย
              </th>


              <th className="border p-2 w-28">
                จำนวน
              </th>


              <th className="border p-2 w-36">
                ราคาต่อหน่วย
              </th>


              <th className="border p-2 w-40">
                วันผลิต
              </th>


              <th className="border p-2 w-40">
                วันหมดอายุ
              </th>


            </tr>


          </thead>



          <tbody className="text-black">
          {
            items.map((row,index)=>{


              const filteredMaterials =
              materials.filter(
                m=>m.category===row.category
              );


              const selectedMaterial =
              materials.find(
                m=>m.id===Number(row.materialId)
              );



              return (

              <tr key={index}>


                <td className="border p-2 text-center">
                  {index+1}
                </td>



                <td className="border p-2">


                  <select

                    value={row.category}

                    onChange={(e)=>
                      updateRow(
                        index,
                        "category",
                        e.target.value
                      )
                    }

                    className="w-full rounded border p-2 text-gray-900"

                  >

                    <option value="">
                      เลือกหมวด
                    </option>


                    {
                      categories.map((c)=>(

                        <option
                          key={c.value}
                          value={c.value}
                        >
                          {c.label}
                        </option>

                      ))
                    }


                  </select>


                </td>





                <td className="border p-2">


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

                    className="w-full rounded border p-2 text-gray-900"

                  >

                    <option value="">
                      เลือกพัสดุ
                    </option>


                    {
                      filteredMaterials.map((material)=>(

                        <option
                          key={material.id}
                          value={material.id}
                        >
                          {material.code} - {material.name}
                        </option>

                      ))
                    }


                  </select>


                </td>





                <td className="border p-2">


                  <input

                    type="text"

                    value={
                      selectedMaterial?.unit ?? ""
                    }

                    readOnly

                    className="w-full rounded border bg-gray-100 p-2 text-center text-gray-900"

                  />


                </td>





                <td className="border p-2">


                  <input

                    type="number"

                    name={`items[${index}].qty`}

                    value={row.qty}

                    onChange={(e)=>
                      updateRow(
                        index,
                        "qty",
                        e.target.value
                      )
                    }

                    className="w-24 rounded border p-2 text-center text-gray-900"

                  />


                </td>





                <td className="border p-2">


                  <input

  type="number"

  name={`items[${index}].unitPrice`}

  value={row.unitPrice}

  onChange={(e)=>
    updateRow(
      index,
      "unitPrice",
      e.target.value
    )
  }

  className="w-32 rounded border p-2 text-right text-gray-900"

  step="0.01"

  min="0"

/>


                </td>
                                <td className="border p-2">


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

                    className="w-36 rounded border p-2 text-gray-900"

                  />


                </td>





                <td className="border p-2">


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

                    className="w-36 rounded border p-2 text-gray-900"

                  />


                </td>


              </tr>


              );


            })
          }


          </tbody>


        </table>


        </div>





        <div>


          <label className="mb-2 block font-medium text-gray-900">
            หมายเหตุ
          </label>


          <textarea

            name="remark"

            defaultValue={receive.remark ?? ""}

            rows={4}

            className="w-full rounded-lg border p-2 text-gray-900"

          />


        </div>





        <div className="flex justify-end">


          <button

            type="submit"

            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"

          >

            บันทึกการแก้ไข

          </button>


        </div>



      </form>


    </div>

  );


}