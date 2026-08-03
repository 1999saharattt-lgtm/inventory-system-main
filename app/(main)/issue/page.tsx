import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";


type Issue = {
  id: number;
  issueDate: Date;
  documentNo: string;
  remark: string | null;

  department:{
    name:string;
  };

  officer:{
    firstName:string;
    lastName:string;
  } | null;

  items:{
    id:number;
    qty:number;

    material:{
      id:number;
      name:string;
      unit:string;
    };

  }[];

};



export default async function IssuePage(){


  const issues =
    await prisma.issue.findMany({

      orderBy:{
        issueDate:"desc",
      },

      include:{

        department:true,

        officer:true,

        items:{
          include:{
            material:true,
          },
        },

      },

    });



  return (

    <div className="space-y-6">


      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-6
          shadow-xl
        "
      >

        <div>

          <h1
            className="
              !text-white
              text-5xl
              font-extrabold
              leading-tight
            "
          >
  📤 รายการเบิกจ่ายพัสดุ
</h1>


          <p
  className="
    mt-3
    text-xl
    font-semibold
    !text-slate-200
  "
>
  แสดงรายการเอกสารเบิกจ่ายพัสดุทั้งหมด
</p>


        </div>



        <Link

          href="/issue/create"

          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-6
            py-3
            text-lg
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "

        >

          + เพิ่มรายการเบิก

        </Link>


      </div>
            {/* Table */}

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


          <table
            className="
              min-w-full
              text-sm
            "
          >


            <thead>

              <tr>

                {
                  [
                    "ลำดับ",
                    "วันที่เบิกจ่าย",
                    "เลขที่เอกสาร",
                    "หน่วยงาน / กลุ่มงาน",
                    "ผู้ขอเบิก",
                    "รายละเอียด",
                    "หมายเหตุ",
                    "จัดการ",
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
                issues.length > 0 ?


                (

                  issues.map(
                    (
                      issue:Issue,
                      index:number
                    )=>(


                    <tr

                      key={issue.id}

                      className="
                        border-b
                        border-slate-200
                        text-slate-900
                        transition
                        hover:bg-emerald-50
                      "

                    >



                      <td
                        className="
                          border
                          px-4
                          py-3
                          text-center
                          font-bold
                          text-slate-700
                        "
                      >

                        {index+1}

                      </td>





                      <td
                        className="
                          border
                          px-4
                          py-3
                          text-center
                          font-semibold
                          text-slate-700
                        "
                      >

                        {
                          new Date(issue.issueDate)
                          .toLocaleDateString("th-TH")
                        }

                      </td>





                      <td
                        className="
                          border
                          px-4
                          py-3
                          text-center
                        "
                      >

                        <span
                          className="
                            rounded-full
                            bg-slate-100
                            px-3
                            py-1
                            font-bold
                            text-slate-700
                          "
                        >

                          {issue.documentNo}

                        </span>


                      </td>





                      <td
                        className="
                          border
                          px-4
                          py-3
                          font-bold
                          text-slate-700
                        "
                      >

                        {issue.department.name}

                      </td>
                                            <td
                        className="
                          border
                          px-4
                          py-3
                          font-bold
                          text-slate-700
                        "
                      >

                        {
                          issue.officer
                          ?
                          `${issue.officer.firstName} ${issue.officer.lastName}`
                          :
                          "-"
                        }


                      </td>





                      <td
                        className="
                          border
                          px-4
                          py-3
                          text-center
                        "
                      >


                        <Link

                          href={`/issue/${issue.id}`}

                          className="
                            rounded-xl
                            bg-gradient-to-r
                            from-emerald-600
                            to-green-500
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow-lg
                            transition
                            hover:scale-105
                          "

                        >

                          แสดงรายการพัสดุ

                        </Link>


                      </td>






                      <td
                        className="
                          border
                          px-4
                          py-3
                          text-slate-700
                        "
                      >

                        {
                          issue.remark
                          ||
                          (
                            <span
                              className="
                                italic
                                text-slate-400
                              "
                            >

                              -

                            </span>
                          )
                        }


                      </td>






                      <td
                        className="
                          border
                          px-4
                          py-3
                        "
                      >


                        <div
                          className="
                            flex
                            justify-center
                            gap-2
                          "
                        >



                          <Link

                            href={`/issue/${issue.id}/edit`}

                            className="
                              rounded-xl
                              bg-gradient-to-r
                              from-amber-500
                              to-orange-500
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow-lg
                              transition
                              hover:scale-105
                            "

                          >

                            แก้ไข

                          </Link>





                          <DeleteButton

                            id={issue.id}

                          />



                        </div>


                      </td>




                    </tr>


                  ))

                )
                                :

                (

                  <tr>

                    <td

                      colSpan={8}

                      className="
                        py-12
                        text-center
                        font-semibold
                        text-slate-500
                      "

                    >

                      ยังไม่มีรายการเบิกจ่ายพัสดุ

                    </td>


                  </tr>


                )


              }



            </tbody>



          </table>



        </div>



      </div>



    </div>

  );

}