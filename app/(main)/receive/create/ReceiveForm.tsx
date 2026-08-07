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



  const [documentValue,setDocumentValue] =
    useState(documentNo);




  function updateRow(

    index:number,

    key:keyof ReceiveRow,

    value:string

  ){


    const copy = [...items];


    copy[index] = {

      ...copy[index],

      [key]:value,

    };



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
        border-slate-200
        bg-white
        p-6
        shadow-xl
      "
    >


      <form
        action={createReceive}
        className="space-y-6"
      >



        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >


          <div>


            <label
              className="
                mb-2
                block
                text-base
                font-bold
                text-slate-900
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
                font-semibold
                text-slate-900
              "

            />


          </div>



          <div>


            <label
              className="
                mb-2
                block
                text-base
                font-bold
                text-slate-900
              "
            >

              เลขที่เอกสาร

            </label>



            <input

              type="text"

              name="documentNo"

              value={documentValue}

              readOnly={!isOpeningBalance}

              onChange={(e)=>
                setDocumentValue(e.target.value)
              }


              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                font-semibold
                text-slate-900
              "

            />


            <label

              className="
                mt-2
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-slate-900
              "

            >

              <input

                type="checkbox"

                checked={isOpeningBalance}

                onChange={(e)=>{

                  const checked=e.target.checked;

                  setIsOpeningBalance(checked);


                  setDocumentValue(

                    checked

                    ? "ยอดยกเข้าระบบ"

                    : documentNo

                  );

                }}

              />


              ยอดยกเข้าระบบ


            </label>


          </div>


        </div>
                <div>


          <label
            className="
              mb-2
              block
              text-base
              font-bold
              text-slate-900
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
              font-semibold
              text-slate-900
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





        <div
          className="
            overflow-x-auto
            rounded-2xl
            border
            border-slate-300
            bg-white
            shadow-lg
          "
        >


          <table
            className="
              w-full
              border-collapse
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
                    "จำนวน",
                    "หน่วย",
                    "ราคา",
                    "วันผลิต",
                    "วันหมดอายุ",
                  ].map((title)=>(


                    <th

                      key={title}

                      className="
                        border
                        border-slate-700
                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700
                        px-3
                        py-4
                        text-center
                        text-base
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
                        hover:bg-emerald-50
                      "

                    >



                      <td

                        className="
                          border
                          border-slate-200
                          px-3
                          py-3
                          text-center
                          font-bold
                          text-slate-900
                        "

                      >

                        {index + 1}


                      </td>





                      <td

                        className="
                          border
                          border-slate-200
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
                            min-w-[170px]
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            font-semibold
                            text-slate-900
                          "

                        >


                          <option value="">

                            -- เลือกหมวดหมู่ --

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
                                            <td

                        className="
                          border
                          border-slate-200
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
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            font-semibold
                            text-slate-900
                          "

                        >


                          <option value="">

                            -- เลือกรายการพัสดุ --

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





                      <td

                        className="
                          border
                          border-slate-200
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
                            w-24
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            text-center
                            font-semibold
                            text-slate-900
                          "

                        />


                      </td>





                      <td

                        className="
                          border
                          border-slate-200
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
                            w-24
                            rounded-lg
                            border
                            border-slate-300
                            bg-slate-100
                            px-3
                            py-2
                            text-center
                            font-semibold
                            text-slate-900
                          "

                        />


                      </td>





                      <td

                        className="
                          border
                          border-slate-200
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
                            w-28
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            text-center
                            font-semibold
                            text-slate-900
                          "

                        />


                      </td>





                      <td

                        className="
                          border
                          border-slate-200
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
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            font-semibold
                            text-slate-900
                          "

                        />


                      </td>





                      <td

                        className="
                          border
                          border-slate-200
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
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            font-semibold
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
              mb-2
              block
              text-base
              font-bold
              text-slate-900
            "

          >

            หมายเหตุ


          </label>



          <textarea

            name="remark"

            rows={3}

            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-900
              outline-none
              focus:border-cyan-500
              focus:ring-4
              focus:ring-cyan-100
            "

          />


        </div>





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

            💾 บันทึกรับเข้า


          </button>



        </div>



      </form>


    </div>


  );


}