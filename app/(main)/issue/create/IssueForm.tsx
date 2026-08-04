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

  departmentId: number | null;

};



type Props = {

  materials: Material[];

  departments: Department[];

  officers: Officer[];

  documentNo: string;

};



type ItemRow = {

  category: string;

  materialId: string;

  qty: string;

  manufacture: string;

  expiry: string;

};



const categoryLabel: Record<string,string> = {

  OFFICE: "วัสดุสำนักงาน",

  COMPUTER: "วัสดุคอมพิวเตอร์",

  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",

  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",

  VEHICLE: "วัสดุยานพาหนะ",

  PRINTING: "วัสดุสื่อสิ่งพิมพ์",

};





export default function IssueForm({

  materials,

  departments,

  officers,

  documentNo,

}: Props) {



  const [departmentId,setDepartmentId] = useState("");

  const [officerId,setOfficerId] = useState("");



  const categories = Array.from(

    new Set(

      materials.map(

        (m)=>m.category

      )

    )

  );



  const emptyRow = ():ItemRow => ({

    category:"",

    materialId:"",

    qty:"",

    manufacture:"",

    expiry:"",

  });



  const [rows,setRows] = useState<ItemRow[]>(

    Array.from(

      {

        length:15,

      },

      emptyRow

    )

  );



  const filteredOfficers =

    officers.filter(

      (o)=>

        String(o.departmentId) === departmentId

    );



  function updateRow(

    index:number,

    key:keyof ItemRow,

    value:string

  ){


    const copy = [...rows];


    copy[index] = {

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
      className="
        space-y-8
      "
    >


      {/* ข้อมูลเอกสาร */}

      <div
        className="
          rounded-2xl
          border
          border-slate-700
          bg-slate-900/60
          p-5
          shadow-xl
        "
      >


        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >



          {/* เลขที่เอกสาร */}

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

              value={documentNo}

              readOnly

              className="
                w-full
                rounded-xl
                border
                border-cyan-400
                bg-slate-100
                p-3
                text-lg
                font-extrabold
                text-cyan-700
                outline-none
              "

            />


          </div>






          {/* วันที่เบิก */}

          <div>


            <label
              className="
                mb-2
                block
                text-lg
                font-extrabด
                text-white
              "
            >
              วันที่เบิก
            </label>



            <input

              type="date"

              name="issueDate"

              required

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-slate-900
                outline-none
              "

            />


          </div>







          {/* หน่วยงาน */}

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
              หน่วยงาน / กลุ่มงาน
            </label>



            <select

              name="departmentId"

              required

              value={departmentId}


              onChange={(e)=>{


                setDepartmentId(
                  e.target.value
                );


                setOfficerId("");

              }}



              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-slate-900
                outline-none
              "

            >


              <option value="">

                -- เลือกหน่วยงาน --

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







          {/* ผู้ขอเบิก */}

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
              ผู้ขอเบิก
            </label>



            <select


              name="officerId"


              value={officerId}



              onChange={(e)=>{

                setOfficerId(
                  e.target.value
                );

              }}



              disabled={!departmentId}



              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                text-slate-900
                outline-none
                disabled:bg-slate-200
              "

            >



              <option value="">

                -- เลือกผู้ขอเบิก --

              </option>



              {

                filteredOfficers.map((o)=>(


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


      </div>
            {/* ตารางรายการเบิก */}


      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-slate-900
          shadow-xl
        "
      >


        <div className="overflow-x-auto">


          <table
            className="
              min-w-full
            "
          >


            <thead>


              <tr>


                {
                  [
                    "ลำดับ",
                    "หมวดหมู่",
                    "รายการพัสดุ",
                    "หน่วย",
                    "ราคา",
                    "จำนวน",
                    "วันผลิต",
                    "วันหมดอายุ",
                  ].map((title)=>(


                    <th

                      key={title}

                      className="
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-4
                        py-4
                        text-center
                        text-lg
                        font-extrabold
                        text-white
                        whitespace-nowrap
                      "

                    >

                      {title}

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

                        m.category === row.category

                    );




                  const selected =

                    materials.find(

                      (m)=>

                        String(m.id) === row.materialId

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
                          px-3
                          py-3
                          text-center
                          font-bold
                          text-white
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


                          value={row.category}



                          onChange={(e)=>

                            updateRow(

                              index,

                              "category",

                              e.target.value

                            )

                          }



                          className="
                            min-w-[170px]
                            rounded-xl
                            border
                            border-slate-600
                            bg-slate-800
                            p-2
                            text-white
                            outline-none
                          "


                        >



                          <option value="">

                            เลือกหมวด

                          </option>




                          {

                            categories.map((c)=>(


                              <option

                                key={c}

                                value={c}

                              >

                                {categoryLabel[c] ?? c}

                              </option>


                            ))

                          }



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
                            min-w-[260px]
                            rounded-xl
                            border
                            border-slate-600
                            bg-slate-800
                            p-2
                            text-white
                            outline-none
                          "


                        >



                          <option value="">

                            เลือกรายการพัสดุ

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







                      {/* หน่วย */}

                      <td

                        className="
                          px-3
                          py-3
                          text-center
                        "

                      >

                        <div

                          className="
                            rounded-xl
                            bg-slate-700
                            px-4
                            py-2
                            font-bold
                            text-white
                          "

                        >

                          {selected?.unit ?? "-"}

                        </div>


                      </td>







                      {/* ราคา */}

                      <td

                        className="
                          px-3
                          py-3
                          text-center
                        "

                      >

                        <div

                          className="
                            rounded-xl
                            bg-slate-700
                            px-4
                            py-2
                            font-bold
                            text-emerald-300
                          "

                        >

                          {selected?.latestPrice ?? 0}

                        </div>


                      </td>







                      {/* จำนวน */}

                      <td

                        className="
                          px-3
                          py-3
                        "

                      >

                        <input


                          name={`items[${index}].qty`}



                          type="number"



                          min="1"



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
                            rounded-xl
                            border
                            border-slate-600
                            bg-slate-800
                            p-2
                            text-center
                            text-white
                            outline-none
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
                            w-36
                            rounded-xl
                            border
                            border-slate-600
                            bg-slate-800
                            p-2
                            text-white
                            outline-none
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
                            w-36
                            rounded-xl
                            border
                            border-slate-600
                            bg-slate-800
                            p-2
                            text-white
                            outline-none
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

          rows={4}

          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            p-3
            text-slate-900
            outline-none
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

          💾 บันทึกการเบิก


        </button>



      </div>



    </form>


  );


}