"use client";

import { useState } from "react";
import { createIssue } from "./action";


type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  latestPrice: number;
};


type Department = {
  id: number;
  name: string;
};


type Officer = {
  id: number;
  firstName: string;
  lastName: string;
};



type Props = {
  materials: Material[];
  departments: Department[];
  officers: Officer[];
};



type ItemRow = {
  category: string;
  materialId: string;
  qty: string;
};



export default function IssueForm({
  materials,
  departments,
  officers,
}: Props) {


  const [rows, setRows] = useState<ItemRow[]>(
    Array.from(
      {
        length: 15,
      },
      () => ({
        category:"",
        materialId:"",
        qty:"",
      })
    )
  );



  function updateRow(
    index:number,
    key:keyof ItemRow,
    value:string
  ){

    const copy=[...rows];

    copy[index]={
      ...copy[index],
      [key]:value,
    };

    if(key==="category"){

      copy[index].materialId="";

    }


    setRows(copy);

  }





  return (


    <form
      action={createIssue}
      className="space-y-8"
    >



      {/* Header Form */}


      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-5
        "
      >


        <div>

          <label
            className="
              text-white
              font-bold
            "
          >
            เลขที่เอกสาร
          </label>


          <input
            name="documentNo"
            required
            className="
              mt-2
              w-full
              rounded-xl
              bg-white
              px-4
              py-3
              text-slate-900
            "
          />

        </div>





        <div>

          <label
            className="
              text-white
              font-bold
            "
          >
            วันที่เบิก
          </label>


          <input
            type="date"
            name="issueDate"
            required
            className="
              mt-2
              w-full
              rounded-xl
              bg-white
              px-4
              py-3
              text-slate-900
            "
          />

        </div>





        <div>

          <label
            className="
              text-white
              font-bold
            "
          >
            หน่วยงาน
          </label>


          <select
            name="departmentId"
            required
            className="
              mt-2
              w-full
              rounded-xl
              bg-white
              px-4
              py-3
              text-slate-900
            "
          >

            <option value="">
              เลือกหน่วยงาน
            </option>


            {
              departments.map((d)=>(
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.name}
                </option>
              ))
            }


          </select>


        </div>







        <div>

          <label
            className="
              text-white
              font-bold
            "
          >
            ผู้ขอเบิก
          </label>


          <select
            name="officerId"
            className="
              mt-2
              w-full
              rounded-xl
              bg-white
              px-4
              py-3
              text-slate-900
            "
          >

            <option value="0">
              เลือกผู้ขอเบิก
            </option>


            {
              officers.map((o)=>(
                <option
                  key={o.id}
                  value={o.id}
                >
                  {o.firstName} {o.lastName}
                </option>
              ))
            }


          </select>


        </div>





      </div>






      {/* Table */}


      <div
        className="
          overflow-x-auto
          rounded-xl
          border
          border-slate-600
        "
      >


        <table
          className="
            min-w-full
            text-white
          "
        >


          <thead>


            <tr
              className="
                bg-gradient-to-r
                from-slate-800
                to-slate-700
              "
            >

              {
                [
                  "ลำดับ",
                  "หมวด",
                  "รายการพัสดุ",
                  "หน่วย",
                  "ราคา",
                  "จำนวน",
                ].map((x)=>(
                  <th
                    key={x}
                    className="
                      px-4
                      py-3
                      text-center
                      font-extrabold
                    "
                  >
                    {x}
                  </th>
                ))
              }


            </tr>


          </thead>






          <tbody>


          {
            rows.map((row,index)=>{


              const list =
                materials.filter(
                  (m)=>
                    m.category===row.category
                );


              const selected =
                materials.find(
                  (m)=>
                    String(m.id)===row.materialId
                );



              return (

                <tr
                  key={index}
                  className="
                    border-b
                    border-slate-700
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
                        rounded-lg
                        bg-white
                        px-3
                        py-2
                        text-slate-900
                      "
                    >

                      <option value="">
                        เลือกหมวด
                      </option>


                      {
                        [
                          ...new Set(
                            materials.map(
                              m=>m.category
                            )
                          )
                        ]
                        .map((c)=>(
                          <option
                            key={c}
                            value={c}
                          >
                            {c}
                          </option>
                        ))
                      }


                    </select>



                  </td>






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
                        bg-white
                        px-3
                        py-2
                        text-slate-900
                      "

                    >

                      <option value="">
                        เลือกรายการ
                      </option>


                      {
                        list.map((m)=>(
                          <option
                            key={m.id}
                            value={m.id}
                          >
                            {m.name}
                          </option>
                        ))
                      }


                    </select>


                  </td>






                  <td
                    className="
                      px-3
                      py-3
                      text-center
                    "
                  >
                    {selected?.unit ?? "-"}
                  </td>






                  <td
                    className="
                      px-3
                      py-3
                      text-center
                    "
                  >
                    {selected?.latestPrice ?? 0}
                  </td>






                  <td className="px-3 py-3">


                    <input

                      name={`items[${index}].qty`}

                      type="number"

                      min="0"

                      value={row.qty}

                      onChange={(e)=>
                        updateRow(
                          index,
                          "qty",
                          e.target.value
                        )
                      }


                      className="
                        w-24
                        rounded-lg
                        bg-white
                        px-3
                        py-2
                        text-center
                        text-slate-900
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







      <div>


        <label
          className="
            font-bold
            text-white
          "
        >
          หมายเหตุ
        </label>


        <textarea

          name="remark"

          className="
            mt-2
            w-full
            rounded-xl
            bg-white
            px-4
            py-3
            text-slate-900
          "

        />


      </div>







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

          💾 บันทึกการเบิก

        </button>


      </div>





    </form>


  );

}