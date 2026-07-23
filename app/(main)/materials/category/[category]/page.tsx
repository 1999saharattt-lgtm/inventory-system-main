import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";


const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "สื่อสิ่งพิมพ์",
};



type Props = {
  params: Promise<{
    category: string;
  }>;

  searchParams: Promise<{
    search?: string;
  }>;
};



export default async function CategoryPage({
  params,
  searchParams,
}: Props) {


  const { category } = await params;

  const { search } = await searchParams;



  const materials = await prisma.material.findMany({

    where: {

      category: category as any,

      ...(search
        ? {
            OR: [
              {
                code: {
                  contains: search,
                },
              },
              {
                name: {
                  contains: search,
                },
              },
            ],
          }
        : {}),

    },


    include: {

      receiveItems: {

        orderBy: {
          id: "desc",
        },

        take: 1,

      },

    },


    orderBy: {
      code: "asc",
    },


  });



  return (

    <div className="space-y-8">


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


          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-800
            "
          >
            {categoryName[category]}
          </h1>


          <p className="mt-2 text-slate-600">
            รายการพัสดุในหมวดนี้
          </p>


        </div>




        <div className="flex gap-3">


          <Link
            href="/materials/new"
            className="
              rounded-lg
              bg-blue-700
              px-5
              py-3
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-blue-800
            "
          >
            + เพิ่มรายการ
          </Link>



          <Link
            href="/materials"
            className="
              rounded-lg
              bg-slate-200
              px-5
              py-3
              font-semibold
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-300
            "
          >
            ← กลับ
          </Link>



        </div>


      </div>


      {/* Search */}

      <div
        className="
          rounded-xl
          border
          border-slate-300
          bg-white
          p-5
          shadow-sm
        "
      >

        <form className="flex gap-3">

          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="ค้นหารหัสพัสดุ / รายการพัสดุ"
            className="
              flex-1
              rounded-lg
              border
              px-4
              py-3
              text-black
            "
          />


          <button
            type="submit"
            className="
              rounded-lg
              bg-blue-700
              px-5
              py-3
              text-white
              hover:bg-blue-800
            "
          >
            ค้นหา
          </button>


        </form>


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


          <table className="min-w-full border-collapse">


            <thead className="bg-slate-200">


              <tr className="text-sm font-semibold text-slate-800">


                <th className="border border-slate-300 px-4 py-3 text-center">
                  รหัสพัสดุ
                </th>


                <th className="border border-slate-300 px-4 py-3">
                  รายการพัสดุ
                </th>
                                <th className="border border-slate-300 px-4 py-3 text-center">
                  จำนวน
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center">
                  หน่วย
                </th>


                <th className="border border-slate-300 px-4 py-3 text-right">
                  ราคาล่าสุด
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center">
                  วันผลิต
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center">
                  วันหมดอายุ
                </th>


                <th className="border border-slate-300 px-4 py-3 text-center">
                  จัดการ
                </th>


              </tr>


            </thead>



            <tbody>


              {materials.length > 0 ? (

                materials.map((material)=>(

                  <tr

                    key={material.id}

                    className="
                      odd:bg-white
                      even:bg-slate-50
                      hover:bg-blue-50
                      transition-colors
                    "

                  >


                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-center
                      font-medium
                      text-slate-700
                    ">
                      {material.code}
                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-slate-700
                    ">
                      {material.name}
                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-center
                    ">
                      {material.balance}
                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-center
                    ">
                      {material.unit}
                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-right
                    ">
                      {material.latestPrice.toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits:2,
                          maximumFractionDigits:2,
                        }
                      )}
                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-center
                    ">

                      {
                        material.receiveItems[0]?.manufacture
                        ?
                        new Date(
                          material.receiveItems[0].manufacture
                        ).toLocaleDateString("th-TH")
                        :
                        "-"
                      }

                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-center
                    ">

                      {
                        material.receiveItems[0]?.expiry
                        ?
                        new Date(
                          material.receiveItems[0].expiry
                        ).toLocaleDateString("th-TH")
                        :
                        "-"
                      }

                    </td>




                    <td className="
                      border
                      border-slate-300
                      px-4
                      py-3
                    ">


                      <div className="
                        flex
                        justify-center
                        gap-2
                      ">


                        <Link
  href={`/materials/${material.id}/edit`}
  className="
    inline-flex
    items-center
    justify-center
    rounded-lg
    bg-amber-500
    px-4
    py-2
    text-base
    font-bold
    text-white
    shadow-sm
    transition
    hover:bg-amber-600
  "
>
  แก้ไข
</Link>



                        <DeleteButton id={material.id}/>



                      </div>


                    </td>


                  </tr>


                ))


              ) : (


                <tr>

                  <td
                    colSpan={8}
                    className="
                      py-12
                      text-center
                      text-slate-500
                    "
                  >
                    ยังไม่มีพัสดุในหมวดนี้
                  </td>

                </tr>


              )}



            </tbody>


          </table>


        </div>


      </div>


    </div>

  );

}