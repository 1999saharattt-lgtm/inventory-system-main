import "dotenv/config";

import {
  PrismaClient,
  OfficerType,
  Role,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});


const prisma = new PrismaClient({
  adapter,
});


async function main() {


  // =========================
  // สร้างกลุ่มงาน
  // =========================

  const departments = [

    "กลุ่มอำนวยการ",
    "กลุ่มบริหารยุทธศาสตร์",
    "กลุ่มพัฒนาเทคโนโลยีอนามัยการเจริญพันธุ์",
    "กลุ่มพัฒนาประชากร",
    "กลุ่มพัฒนาเครือข่ายอนามัยการเจริญพันธุ์",
    "ผู้บริหารสำนักอนามัยการเจริญพันธุ์",

  ];


  const departmentMap: any = {};


  for (const name of departments) {


    const department =
      await prisma.department.upsert({

        where: {
          name,
        },

        update: {},

        create: {
          name,
        },

      });


    departmentMap[name] = department.id;


  }





  // =========================
  // งานภายในกลุ่มอำนวยการ
  // =========================

  const adminDepartmentId =
    departmentMap["กลุ่มอำนวยการ"];



  const sections = [

    "งานการเงิน",
    "งานสารบรรณ",
    "งานพัสดุ",

  ];



  const sectionMap: any = {};



  for (const name of sections) {


    let section =
      await prisma.section.findFirst({

        where: {

          name,

          departmentId: adminDepartmentId,

        },

      });



    if (!section) {


      section =
        await prisma.section.create({

          data: {

            name,

            departmentId: adminDepartmentId,

          },

        });


    }



    sectionMap[name] = section.id;


  }






  // =========================
  // เจ้าหน้าที่
  // =========================


  const officers = [


    {

      firstName: "สมชาย",

      lastName: "ใจดี",

      position: "เจ้าหน้าที่การเงิน",

      type: OfficerType.CIVIL_SERVANT,

      sectionId: sectionMap["งานการเงิน"],

    },


    {

      firstName: "สายใจ",

      lastName: "ดีมาก",

      position: "นักวิชาการเงินและบัญชี",

      type: OfficerType.CIVIL_SERVANT,

      sectionId: sectionMap["งานการเงิน"],

    },


    {

      firstName: "เอกสาร",

      lastName: "รักงาน",

      position: "เจ้าหน้าที่สารบรรณ",

      type: OfficerType.GOVERNMENT_EMPLOYEE,

      sectionId: sectionMap["งานสารบรรณ"],

    },


    {

      firstName: "พัสดุ",

      lastName: "ดูแล",

      position: "เจ้าหน้าที่พัสดุ",

      type: OfficerType.PERMANENT_EMPLOYEE,

      sectionId: sectionMap["งานพัสดุ"],

    },


  ];




  for (const officer of officers) {


    const exists =
      await prisma.officer.findFirst({

        where: {

          firstName: officer.firstName,

          lastName: officer.lastName,

          sectionId: officer.sectionId,

        },

      });



    if (!exists) {


      await prisma.officer.create({

        data: officer,

      });


    }


  }






  // =========================
  // สร้างผู้ใช้งานระบบ
  // =========================


  const passwordHash =
    await bcrypt.hash(
      "admin123",
      10
    );



  await prisma.user.upsert({

    where: {

      username: "admin",

    },


    update: {},


    create: {

      username: "admin",

      password: passwordHash,

      fullname: "ผู้ดูแลระบบ",

      role: Role.ADMIN,

      active: true,

    },


  });






  // =========================
  // สร้างผู้ขายเริ่มต้น
  // =========================


  await prisma.vendor.createMany({

    data: [

      {

        name: "บริษัทตัวอย่าง",

        address: "กรุงเทพมหานคร",

        phone: "-",

      },

    ],

    skipDuplicates: true,

  });





  console.log(
    "สร้างข้อมูลหน่วยงาน เจ้าหน้าที่ ผู้ใช้งาน และผู้ขายเรียบร้อย"
  );


}





main()

  .then(async () => {

    await prisma.$disconnect();

  })


  .catch(async (e) => {

    console.error(e);

    await prisma.$disconnect();

    process.exit(1);

  });