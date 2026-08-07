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
          border-slate-700
          bg-slate-900
          p-8
          text-xl
          font-bold
          text-white
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
      rounded-3xl
      bg-gradient-to-r
      from-slate-950
      via-slate-800
      to-slate-700
      px-8
      py-7
      text-white
      shadow-xl
    "
  >


    <div>

      <h1
        className="
          text-5xl
          font-extrabold
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
          text-slate-200
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
        px-6
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




  {/* Form */}

  <div
    className="
      w-full
      rounded-3xl
      border
      border-slate-700
      bg-gradient-to-br
      from-slate-950
      via-slate-900
      to-slate-800
      p-8
      shadow-2xl
    "
  >


    <form
      action={updateUser}
      className="w-full space-y-6"
    >


      <input
        type="hidden"
        name="id"
        value={user.id}
      />


      <div
        className="
          grid
          gap-6
          md:grid-cols-2
        "
      >


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
            Username
          </label>


          <input
            name="username"
            defaultValue={user.username}
            required

            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              px-4
              py-3
              text-lg
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-300
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
              text-white
            "
          >
            ชื่อ-นามสกุล
          </label>


          <input
            name="fullname"
            defaultValue={user.fullname}
            required

            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              px-4
              py-3
              text-lg
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-300
            "
          />

        </div>


      </div>
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
            border-slate-600
            bg-slate-800
            px-4
            py-3
            text-lg
            font-bold
            text-white
            placeholder:text-slate-400
            outline-none
            transition
            focus:border-cyan-400
            focus:ring-2
            focus:ring-cyan-300
          "
        />

      </div>





      <div
        className="
          grid
          gap-6
          md:grid-cols-2
        "
      >


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
            สิทธิ์การใช้งาน
          </label>


          <select
            name="role"
            defaultValue={user.role}

            className="
              w-full
              rounded-xl
              border
              border-slate-600
              bg-slate-800
              px-4
              py-3
              text-lg
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-300
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
              text-white
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
              border-slate-600
              bg-slate-800
              px-4
              py-3
              text-lg
              font-bold
              text-white
              outline-none
              transition
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-300
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


      </div>







      <div
        className="
          flex
          gap-4
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
          💾 บันทึกการแก้ไข

        </button>





        <Link

          href="/users"

          className="
            rounded-xl
            bg-gradient-to-r
            from-slate-800
            to-slate-700
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
          ยกเลิก

        </Link>


      </div>



    </form>


  </div>



</div>

  );

}