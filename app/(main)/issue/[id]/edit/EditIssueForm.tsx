"use client";

import { useState } from "react";
import { updateIssue } from "./action";


type Department = {
  id: number;
  name: string;
};


type Material = {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  latestPrice: number;
  balance: number;
};


type ReceiveItem = {
  id: number;
  materialId: number;
  qty: number;
  manufacture: Date | null;
  expiry: Date | null;
};


type Props = {
  issue: any;
  departments: Department[];
  materials: Material[];
  receiveItems: ReceiveItem[];
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



type IssueRow = {
  category: string;
  materialId: string;
  qty: string;
  manufacture: string;
  expiry: string;
  receiveItemId: string;
};



export default function EditIssueForm({
  issue,
  departments,
  materials,
  receiveItems,
}: Props) {



  const [items, setItems] = useState<IssueRow[]>(() => {


    const rows = issue.items.map((item: any) => {


      const lot =
        receiveItems.find(
          (r) =>
            r.materialId === item.materialId
        );



      return {

        category:
          item.material.category,


        materialId:
          String(item.materialId),


        qty:
          String(item.qty),


        receiveItemId:
          lot
            ? String(lot.id)
            : "",


        manufacture:
          lot?.manufacture
            ? new Date(lot.manufacture)
                .toISOString()
                .split("T")[0]
            : "",


        expiry:
          lot?.expiry
            ? new Date(lot.expiry)
                .toISOString()
                .split("T")[0]
            : "",

      };


    });



    while (rows.length < 15) {


      rows.push({

        category: "",
        materialId: "",
        qty: "",
        manufacture: "",
        expiry: "",
        receiveItemId: "",

      });


    }



    return rows;


  });





  function updateRow(
    index: number,
    key: keyof IssueRow,
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
        bg-slate-800
        p-6
        shadow-xl
      "

    >


      <form

        action={updateIssue}

        className="space-y-6"

      >



        <input

          type="hidden"

          name="issueId"

          value={issue.id}

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
                text-slate-900
              "

            >

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



              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-bold
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
                text-slate-900
              "

            >

              เลขที่ใบเบิก

            </label>



            <input


              type="text"


              name="documentNo"


              defaultValue={
                issue.documentNo
              }



              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-bold
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
                text-slate-900
              "

            >

              หน่วยงาน

            </label>



            <select


              name="departmentId"


              defaultValue={
                issue.departmentId
              }



              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                font-bold
                text-black
              "


            >


              {
                departments.map(

                  (department) => (

                    <option

                      key={department.id}

                      value={department.id}

                    >

                      {department.name}

                    </option>

                  )

                )

              }


            </select>


          </div>


        </div>
        



{/* ตารางรายการ */}


<div
  className="
    overflow-x-auto
  "
>


  <table

    className="
      w-full
      border-collapse
      border
      border-slate-900
      text-sm
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

                  "จำนวน",

                  "ราคาต่อหน่วย",

                  "วันผลิต",

                  "วันหมดอายุ",

                ].map(


                  (header) => (



                    <th


                      key={header}



                      className="
                        border
                        border-slate-900
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-3
                        py-4
                        text-center
                        text-lg
                        font-extrabold
                        !text-white
                      "



                    >


                      {header}



                    </th>



                  )


                )


              }




            </tr>



          </thead>





          <tbody>




            {


              items.map(


                (


                  row: IssueRow,


                  index: number



                ) => {



                  const filteredMaterials =



                    materials.filter(


                      (material) =>


                        material.category === row.category


                    );





                  const selectedMaterial =



                    materials.find(


                      (material) =>


                        material.id === Number(row.materialId)


                    );






                  return (




                    <tr



                      key={index}



                      className="
                        border
                        border-slate-900
                        text-slate-900
                        hover:bg-emerald-50
                      "



                    >





                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                          text-center
                          font-extrabold
                        "



                      >



                        {index + 1}




                      </td>







                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                        "



                      >




                        <select



                          value={row.category}



                          onChange={(e) =>

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
                            font-bold
                            text-black
                          "



                        >



                          <option value="">


                            เลือกหมวดหมู่


                          </option>






                          {


                            categories.map(


                              (category) => (



                                <option



                                  key={category.value}



                                  value={category.value}



                                >



                                  {category.label}



                                </option>



                              )



                            )



                          }





                        </select>




                      </td>







                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                        "



                      >





                        <select



                          name={

                            `items[${index}].materialId`

                          }



                          value={row.materialId}



                          onChange={(e) =>

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
                            font-bold
                            text-black
                          "



                        >





                          <option value="">



                            เลือกรายการพัสดุ



                          </option>






                          {


                            filteredMaterials.map(


                              (material) => (



                                <option



                                  key={material.id}



                                  value={material.id}



                                >



                                  {material.code}

                                  {" - "}

                                  {material.name}



                                </option>



                              )



                            )



                          }





                        </select>





                      </td>
                      





                      <td



                        className="
                          border
                          border-slate-900
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
                            bg-white
                            p-2
                            text-center
                            font-bold
                            text-black
                          "



                        />





                      </td>









                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                        "



                      >





                        <input



                          type="number"



                          name={

                            `items[${index}].qty`

                          }



                          value={row.qty}





                          onChange={(e) =>

                            updateRow(

                              index,

                              "qty",

                              e.target.value

                            )

                          }





                          min={1}





                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-center
                            font-bold
                            text-black
                          "



                        />





                      </td>









                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                        "



                      >





                        <input



                          type="text"



                          readOnly





                          value={

                            selectedMaterial

                              ?

                              Number(

                                selectedMaterial.latestPrice

                              ).toFixed(2)

                              :

                              ""

                          }





                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            p-2
                            text-center
                            font-bold
                            text-black
                          "



                        />





                      </td>









                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                        "



                      >





                        <input



                          type="date"



                          value={row.manufacture}





                          readOnly





                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-100
                            p-2
                            text-center
                            font-bold
                            text-black
                          "



                        />





                      </td>









                      <td



                        className="
                          border
                          border-slate-900
                          px-3
                          py-3
                        "



                      >





                        <input



                          type="date"



                          value={row.expiry}





                          readOnly





                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-slate-100
                            p-2
                            text-center
                            font-bold
                            text-black
                          "



                        />





                      </td>





                    </tr>





                  );



                }


              )



            }





          </tbody>





        </table>

        </div>






        {/* หมายเหตุ */}


    <div>

      <label

        className="
          mb-2
          block
          text-lg
          font-extrabold
          text-slate-900
        "

      >

        หมายเหตุ

      </label>



      <textarea

        name="remark"


        rows={4}


        defaultValue={
          issue.remark ?? ""
        }


        className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          p-3
          font-bold
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
          via-green-500
          to-emerald-500
          px-8
          py-3
          text-lg
          font-extrabold
          text-white
          shadow-lg
          transition
          hover:scale-105
        "

      >

        💾 บันทึกการแก้ไข


      </button>


    </div>



  </form>


</div>

);
}