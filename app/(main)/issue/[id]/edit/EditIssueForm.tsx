"use client";

import { useState } from "react";
import { updateIssue } from "./action";


type Department = {
  id:number;
  name:string;
};


type Material = {
  id:number;
  code:string;
  name:string;
  unit:string;
  category:string;
  latestPrice:number;
};



type Props = {

  issue:any;

  departments:Department[];

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




type IssueRow = {

  category:string;

  materialId:string;

  qty:string;

};





export default function EditIssueForm({

  issue,

  departments,

  materials,

}:Props){



  const [items,setItems] = useState<IssueRow[]>(()=>{


    const rows = issue.items.map(
      (item:any)=>({

        category:
          item.material.category,

        materialId:
          String(item.materialId),

        qty:
          String(item.qty),

      })
    );



    while(rows.length < 15){

      rows.push({

        category:"",
        materialId:"",
        qty:"",

      });

    }



    return rows;

  });






  function updateRow(

    index:number,

    key:keyof IssueRow,

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

        action={updateIssue}

        className="space-y-6"

      >



        <input

          type="hidden"

          name="issueId"

          value={issue.id}

        />




        <div>

          <label className="mb-2 block font-medium text-gray-900">

            วันที่เบิกจ่าย

          </label>


          <input

            type="date"

            name="issueDate"

            defaultValue={
              issue.issueDate
              .toISOString()
              .split("T")[0]
            }

            className="w-full rounded-lg border p-2 text-gray-900"

          />

        </div>





        <div>

          <label className="mb-2 block font-medium text-gray-900">

            เลขที่ใบเบิก

          </label>


          <input

            type="text"

            name="documentNo"

            defaultValue={
              issue.documentNo
            }

            className="w-full rounded-lg border p-2 text-gray-900"

          />

        </div>
                <div>

          <label className="mb-2 block font-medium text-gray-900">

            หน่วยงาน

          </label>


          <select

            name="departmentId"

            defaultValue={issue.departmentId}

            className="w-full rounded-lg border p-2 text-gray-900"

          >


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





        <div className="overflow-x-auto">


          <table className="w-full border border-gray-300 text-sm">


            <thead className="bg-gray-100 text-black">


              <tr>


                <th className="border p-2 w-12 text-center">

                  ลำดับ

                </th>



                <th className="border p-2 w-40">

                  หมวด

                </th>



                <th className="border p-2 w-72">

                  ชื่อพัสดุ

                </th>



                <th className="border p-2 w-24 text-center">

                  หน่วย

                </th>



                <th className="border p-2 w-28 text-center">

                  จำนวน

                </th>



                <th className="border p-2 w-36 text-right">

                  ราคาต่อหน่วย

                </th>


              </tr>


            </thead>





            <tbody className="text-black">


              {
                items.map((row,index)=>{


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

                    <tr key={index}>


                      <td className="border p-2 text-center">

                        {index + 1}

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

                          min={1}

                        />


                      </td>







                      <td className="border p-2">


                        <input

                          type="text"

                          value={

                            selectedMaterial

                            ?

                            Number(
                              selectedMaterial.latestPrice
                            ).toFixed(2)

                            :

                            ""

                          }

                          readOnly

                          className="w-32 rounded border bg-gray-100 p-2 text-right text-gray-900"

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

            rows={4}

            defaultValue={
              issue.remark ?? ""
            }

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