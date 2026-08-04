import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";


async function updateUser(formData: FormData) {
  "use server";

  await requireRole("ADMIN");


  const id = Number(formData.get("id"));

  const username = formData.get("username") as string;
  const fullname = formData.get("fullname") as string;
  const role = formData.get("role") as "ADMIN" | "STAFF" | "VIEWER";
  const active = formData.get("active") === "true";

  const password = formData.get("password") as string;



  const existingUser = await prisma.user.findFirst({
    where:{
      username,
      NOT:{
        id,
      },
    },
  });


  if(existingUser){
    throw new Error("Username นี้ถูกใช้งานแล้ว");
  }



  const data:{
    username:string;
    fullname:string;
    role:"ADMIN"|"STAFF"|"VIEWER";
    active:boolean;
    password?:string;
  }={
    username,
    fullname,
    role,
    active,
  };



  if(password.trim() !== ""){
    data.password = await bcrypt.hash(password,10);
  }



  await prisma.user.update({
    where:{
      id,
    },
    data,
  });


  redirect("/users");
}







export default async function EditUserPage({
  params,
}:{
  params:Promise<{id:string}>;
}) {


  await requireRole("ADMIN");


  const {id}=await params;



  const user = await prisma.user.findUnique({
    where:{
      id:Number(id),
    },
  });



  if(!user){

    return(
      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-8
          text-xl
          font-bold
          text-slate-600
          shadow-xl
        "
      >
        ไม่พบผู้ใช้งาน
      </div>
    );

  }






  return(

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
          min-h-[140px]
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
            👤 แก้ไขผู้ใช้งานระบบ
          </h1>


          <p
            className="
              mt-2
              text-xl
              font-semibold
              !text-slate-200
            "
          >
            แก้ไขข้อมูลบัญชี สิทธิ์ และสถานะการใช้งาน
          </p>


        </div>



        <Link
          href="/users"
          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            text-lg
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







      {/* Form */}

      <div
        className="
          max-w-2xl
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-xl
        "
      >


        <form
          action={updateUser}
          className="space-y-6"
        >


          <input
            type="hidden"
            name="id"
            value={user.id}
          />





          {[
            {
              label:"Username",
              name:"username",
              value:user.username,
              type:"text",
            },
            {
              label:"ชื่อ-นามสกุล",
              name:"fullname",
              value:user.fullname,
              type:"text",
            },

          ].map((field)=>(

            <div key={field.name}>

              <label
                className="
                  mb-2
                  block
                  text-lg
                  font-extrabold
                  text-slate-800
                "
              >
                {field.label}
              </label>


              <input
                name={field.name}
                defaultValue={field.value}
                required
                type={field.type}

                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-lg
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

            </div>


          ))}





          <div>

            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-800
              "
            >
              Password ใหม่
            </label>


            <input
              type="password"
              name="password"
              placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยนรหัสผ่าน"

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
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
                text-slate-800
              "
            >
              สิทธิ์การใช้งาน
            </label>


            <select
              name="role"
              defaultValue={user.role}

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            >

              <option value="ADMIN">
                ADMIN
              </option>

              <option value="STAFF">
                STAFF
              </option>

              <option value="VIEWER">
                VIEWER
              </option>

            </select>

          </div>






          <div>

            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-800
              "
            >
              สถานะ
            </label>


            <select
              name="active"
              defaultValue={String(user.active)}

              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            >

              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>

            </select>


          </div>







          <div
  className="
    flex
    pt-4
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
      text-lg
      font-extrabold
      text-white
      shadow-lg
      transition
      hover:scale-105
    "
  >
    บันทึกการแก้ไข
  </button>


</div>





        </form>


      </div>



    </div>

  );

}