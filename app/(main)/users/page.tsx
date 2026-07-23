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



export default async function UsersPage() {

  await requireRole("ADMIN");


  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
    },
  });



  return (
    <div className="space-y-8 text-xl font-bold">


      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-slate-300
          bg-slate-100
          p-6
          shadow-sm
        "
      >

        <div>

          <h1 className="text-4xl font-extrabold text-slate-800">
            ผู้ใช้งานระบบ
          </h1>


          <p className="mt-2 text-xl font-bold text-slate-600">
            จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
          </p>

        </div>



        <Link
          href="/users/create"
          className="
            rounded-lg
            bg-blue-700
            px-5
            py-3
            text-xl
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-blue-800
          "
        >
          + เพิ่มผู้ใช้งาน
        </Link>


      </div>





      {/* Table */}
      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-300
          bg-white
          shadow-sm
        "
      >

        <div className="overflow-x-auto">


          <table className="min-w-full border-collapse text-xl font-bold">


            <thead className="bg-slate-200">

              <tr>

                <th className="border px-4 py-3 text-center text-2xl font-extrabold">
                  ลำดับ
                </th>

                <th className="border px-4 py-3 text-center text-2xl font-extrabold">
                  Username
                </th>

                <th className="border px-4 py-3 text-center text-2xl font-extrabold">
                  ชื่อ-นามสกุล
                </th>

                <th className="border px-4 py-3 text-center text-2xl font-extrabold">
                  สิทธิ์
                </th>

                <th className="border px-4 py-3 text-center text-2xl font-extrabold">
                  สถานะ
                </th>

                <th className="border px-4 py-3 text-center text-2xl font-extrabold">
                  จัดการ
                </th>

              </tr>

            </thead>




            <tbody>

              {
                users.length > 0 ? (

                  users.map((user, index) => (

                    <tr
                      key={user.id}
                      className="
                        odd:bg-white
                        even:bg-slate-50
                        hover:bg-blue-50
                      "
                    >


                      <td className="border px-4 py-3 text-center text-xl font-bold">
                        {index + 1}
                      </td>



                      <td className="border px-4 py-3 text-center text-xl font-bold">
                        {user.username}
                      </td>



                      <td className="border px-4 py-3 text-xl font-bold">
                        {user.fullname}
                      </td>



                      <td className="border px-4 py-3 text-center text-xl font-bold">
                        {user.role}
                      </td>




                      <td className="border px-4 py-3 text-center">


                        {
                          user.active ? (

                            <span
                              className="
                                rounded
                                bg-green-100
                                px-3
                                py-1
                                text-xl
                                font-bold
                                text-green-700
                              "
                            >
                              Active
                            </span>

                          ) : (

                            <span
                              className="
                                rounded
                                bg-red-100
                                px-3
                                py-1
                                text-xl
                                font-bold
                                text-red-700
                              "
                            >
                              Inactive
                            </span>

                          )
                        }

                      </td>





                      <td className="border px-4 py-3 text-center">


                        <div className="flex justify-center gap-2">


                          <Link
                            href={`/users/${user.id}/edit`}
                            className="
                              rounded-lg
                              bg-amber-500
                              px-4
                              py-2
                              text-xl
                              font-bold
                              text-white
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
                                text-xl
                                font-bold
                                text-white
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
                        py-10
                        text-center
                        text-xl
                        font-bold
                        text-slate-500
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