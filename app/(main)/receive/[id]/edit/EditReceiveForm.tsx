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
  {
    value:"PRINTING",
    label:"วัสดุสื่อสิ่งพิมพ์",
  },
];



export default function EditReceiveForm({
  receive,
  vendors,
  materials,
}:Props){



  const [items,setItems] = useState<any[]>(()=>{


    const rows =
      receive.items.map((item:any)=>({

        category:item.material.category,

        materialId:String(item.materialId),

        qty:String(item.qty),

        unitPrice:
          Number(item.unitPrice)
          .toFixed(2),


        manufacture:
          item.manufacture
          ?
          item.manufacture
          .toISOString()
          .split("T")[0]
          :
          "",


        expiry:
          item.expiry
          ?
          item.expiry
          .toISOString()
          .split("T")[0]
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
        action={updateReceive}
        className="space-y-6"
      >


        <input
          type="hidden"
          name="receiveId"
          value={receive.id}
        />



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
              defaultValue={
                receive.receiveDate
                .toISOString()
                .split("T")[0]
              }
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

              defaultValue={receive.documentNo}

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

              defaultValue={receive.vendorId}

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
                {/* ตารางรายการ */}

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

            <table className="w-full text-sm">


              <thead>

                <tr
                  className="
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    text-white
                  "
                >

                  {[
                    "ลำดับ",
                    "หมวด",
                    "รายการพัสดุ",
                    "หน่วย",
                    "จำนวน",
                    "ราคาต่อหน่วย",
                    "วันผลิต",
                    "วันหมดอายุ",
                  ].map((title)=>(

                    <th
                      key={title}
                      className="
                        border
                        px-3
                        py-4
                        text-center
                        text-lg
                        font-extrabold
                      "
                    >

                      {title}

                    </th>

                  ))}


                </tr>


              </thead>




              <tbody>


                {
                  items.map((row,index)=>{


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
                          text-slate-900
                          hover:bg-emerald-50
                        "

                      >



                        <td
                          className="
                            border
                            px-3
                            py-3
                            text-center
                            font-bold
                          "
                        >

                          {index+1}

                        </td>





                        <td className="border px-3 py-3">


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
                              border-slate-300
                              bg-white
                              p-2
                              text-black
                            "

                          >


                            <option value="">

                              เลือกหมวด

                            </option>



                            {
                              categories.map((category)=>(

                                <option

                                  key={category.value}

                                  value={category.value}

                                >

                                  {category.label}

                                </option>

                              ))
                            }


                          </select>


                        </td>






                        <td className="border px-3 py-3">


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







                        <td className="border px-3 py-3">


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
                              text-center
                              text-black
                            "

                          />


                        </td>







                        <td className="border px-3 py-3">


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

                            className="
                              w-full
                              rounded-xl
                              border
                              border-slate-300
                              p-2
                              text-center
                              text-black
                            "

                          />


                        </td>







                        <td className="border px-3 py-3">


                          <input

                            type="number"

                            step="0.01"

                            min="0"

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
                              p-2
                              text-right
                              text-black
                            "

                          />


                        </td>







                        <td className="border px-3 py-3">


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
                              p-2
                              text-black
                            "

                          />


                        </td>







                        <td className="border px-3 py-3">


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
                              p-2
                              text-black
                            "

                          />


                        </td>



                      </tr>


                    );


                  })
                }



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

            defaultValue={receive.remark ?? ""}

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

            บันทึกการแก้ไข

          </button>


        </div>



      </form>


    </div>

  );


}