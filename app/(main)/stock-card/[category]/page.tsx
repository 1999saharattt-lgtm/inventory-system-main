import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchStockCard from "./SearchStockCard";

type Props = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    search?: string;
  }>;
};

const categoryNames: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const { category } = await params;
  const { search = "" } = await searchParams;

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
              {
                vendor: {
                  name: {
                    contains: search,
                  },
                },
              },
            ],
          }
        : {}),
    },

    include: {
      vendor: true,
    },

    orderBy: {
      code: "asc",
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
        text-white
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
          {categoryNames[category]}
        </h1>


        <p
          className="
            mt-3
            text-xl
            font-semibold
            text-slate-200
          "
        >
          รายการบัญชีพัสดุ จำนวน {materials.length} รายการ
        </p>


      </div>



      <Link
        href="/stock-card"
        className="
          rounded-xl
          bg-gradient-to-r
          from-emerald-600
          to-green-500
          px-5
          py-3
          font-extrabold
          text-white
          shadow-lg
          transition
          hover:scale-105
        "
      >
        ← กลับ
      </Link>


    </div>





    {/* Search */}

    <SearchStockCard
      category={category}
      defaultSearch={search}
    />






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


        <table className="min-w-full">


          <thead>

            <tr>


              {[
                "ลำดับ",
                "รหัสพัสดุ",
                "รายการพัสดุ",
                "หน่วย",
                "ผู้จำหน่าย",
                "บัญชีพัสดุ",
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


              ))}


            </tr>


          </thead>




          <tbody>


          {materials.length === 0 ? (

            <tr>

              <td
                colSpan={6}
                className="
                  py-12
                  text-center
                  text-lg
                  font-bold
                  text-slate-500
                "
              >
                ไม่พบข้อมูล
              </td>


            </tr>


          ) : (


            materials.map((material,index)=>(


              <tr
                key={material.id}
                className="
                  border-b
                  hover:bg-blue-50
                "
              >


                <td
                  className="
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
                    px-4
                    py-3
                    text-center
                    font-bold
                    text-slate-700
                  "
                >
                  {material.code}
                </td>




                <td
                  className="
                    px-4
                    py-3
                    font-bold
                    text-slate-800
                  "
                >
                  {material.name}
                </td>




                <td
                  className="
                    px-4
                    py-3
                    text-center
                    font-semibold
                    text-slate-700
                  "
                >
                  {material.unit}
                </td>




                <td
                  className="
                    px-4
                    py-3
                    font-semibold
                    text-slate-700
                  "
                >
                  {material.vendor?.name ?? "-"}
                </td>




                <td
                  className="
                    px-4
                    py-3
                    text-center
                  "
                >

                  <Link
                    href={`/stock-card/material/${material.id}`}
                    className="
                      rounded-xl
                      bg-gradient-to-r
                      from-emerald-600
                      to-green-500
                      px-5
                      py-2
                      font-extrabold
                      text-white
                      shadow-lg
                      transition
                      hover:scale-105
                    "
                  >
                    เปิด
                  </Link>


                </td>


              </tr>


            ))


          )}



          </tbody>


        </table>


      </div>


    </div>


  </div>
);
}