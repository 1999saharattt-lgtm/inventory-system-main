import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";


async function deleteUser(formData: FormData) {
  "use server";

  await requireRole("ADMIN");

  const id = Number(formData.get("id"));

  await prisma.user.delete({
    where: {
      id,
    },
  });

  redirect("/users");
}



const roleName: Record<string,string> = {
  ADMIN:"ผู้ดูแลระบบ",
  STAFF:"เจ้าหน้าที่",
  VIEWER:"ผู้ใช้งานทั่วไป",
};



export default async function UsersPage() {

  await requireRole("ADMIN");


  const users = await prisma.user.findMany({
    orderBy:{
      id:"asc",
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
          px-8
          py-6
          text-white
          shadow-xl
        "
      >

        <div>

          <h1
            className="
              text-5xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            👤 ผู้ใช้งานระบบ
          </h1>


          <p
            className="
              mt-2
              text-xl
              font-semibold
              !text-slate-200
            "
          >
            จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
          </p>

        </div>



        <Link
          href="/users/create"
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
          + เพิ่มผู้ใช้งาน
        </Link>


      </div>





      {/* Table Card */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-900
          via-slate-800
          to-slate-700
          shadow-xl
        "
      >


        <div className="overflow-x-auto">


          <table
            className="
              min-w-full
              border-collapse
              text-xl
              font-bold
            "
          >


            <thead>


              <tr
                className="
                  bg-gradient-to-r
                  from-slate-700
                  to-slate-950
                  text-white
                "
              >

                {[
                  "ลำดับ",
                  "Username",
                  "ชื่อ-นามสกุล",
                  "สิทธิ์",
                  "สถานะ",
                  "จัดการ",
                ].map((title)=>(

                  <th
                    key={title}
                    className="
                      border
                      border-slate-600
                      px-4
                      py-4
                      text-center
                      text-xl
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
                users.length > 0 ? (

                  users.map((user,index)=>(

                    <tr
                      key={user.id}
                      className="
                        border-b
                        border-slate-600
                        bg-slate-800
                        text-white
                        transition
                        hover:bg-slate-700
                      "
                    >


                      <td className="border border-slate-600 px-4 py-3 text-center">
                        {index+1}
                      </td>



                      <td className="border border-slate-600 px-4 py-3 text-center">
                        {user.username}
                      </td>



                      <td className="border border-slate-600 px-4 py-3">
                        {user.fullname}
                      </td>



                      <td className="border border-slate-600 px-4 py-3 text-center">

                        <span
                          className="
                            rounded-full
                            bg-blue-500/20
                            px-4
                            py-1
                            text-blue-300
                          "
                        >
                          {roleName[user.role] ?? user.role}
                        </span>

                      </td>




                      <td className="border border-slate-600 px-4 py-3 text-center">


                        {
                          user.active ? (

                            <span
                              className="
                                rounded-full
                                bg-emerald-500/20
                                px-4
                                py-1
                                text-emerald-300
                              "
                            >
                              Active
                            </span>

                          ) : (

                            <span
                              className="
                                rounded-full
                                bg-red-500/20
                                px-4
                                py-1
                                text-red-300
                              "
                            >
                              Inactive
                            </span>

                          )
                        }


                      </td>





                      <td className="border border-slate-600 px-4 py-3">


                        <div className="flex justify-center gap-2">


                          <Link
                            href={`/users/${user.id}/edit`}
                            className="
                              rounded-lg
                              bg-amber-500
                              px-4
                              py-2
                              text-white
                              shadow
                              transition
                              hover:bg-amber-600
                            "
                          >
                            แก้ไข
                          </Link>



                          <form action={deleteUser}>

                            <input
                              type="hidden"
                              name="id"
                              value={user.id}
                            />


                            <button
                              className="
                                rounded-lg
                                bg-red-600
                                px-4
                                py-2
                                text-white
                                shadow
                                transition
                                hover:bg-red-700
                              "
                            >
                              ลบ
                            </button>


                          </form>


                        </div>


                      </td>



                    </tr>


                  ))


                ) : (


                  <tr>

                    <td
                      colSpan={6}
                      className="
                        py-12
                        text-center
                        text-xl
                        text-slate-300
                      "
                    >
                      ยังไม่มีผู้ใช้งาน
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