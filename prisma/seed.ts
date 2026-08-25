import "dotenv/config";

import {
  PrismaClient,
  OfficerType,
  Role,
  Category,
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
  // สร้างหน่วยงาน
  // =========================

  const departments = [
    "กลุ่มอำนวยการ",
    "กลุ่มบริหารยุทธศาสตร์",
    "กลุ่มพัฒนาเทคโนโลยีอนามัยการเจริญพันธุ์",
    "กลุ่มพัฒนาประชากร",
    "กลุ่มพัฒนาเครือข่ายอนามัยการเจริพันธุ์",
    "ผู้บริหารสำนักอนามัยการเจริญพันธุ์",
  ];

  const departmentMap: Record<string, number> = {};

  for (const name of departments) {
    const department = await prisma.department.upsert({
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
  // สร้างกลุ่มงาน
  // =========================

  const adminDepartmentId =
    departmentMap["กลุ่มอำนวยการ"];

  const sections = [
    "งานการเงิน",
    "งานสารบรรณ",
    "งานพัสดุ",
  ];

  const sectionMap: Record<string, number> = {};

  for (const name of sections) {
    let section = await prisma.section.findFirst({
      where: {
        name,
        departmentId: adminDepartmentId,
      },
    });

    if (!section) {
      section = await prisma.section.create({
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
    const exists = await prisma.officer.findFirst({
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
  // ผู้ใช้งาน
  // =========================

  const passwordHash = await bcrypt.hash(
    "admin123",
    10
  );

  // =========================
  // Admin
  // =========================

  await prisma.user.upsert({
    where: {
      username: "admin",
    },

    update: {
      role: Role.ADMIN,
      active: true,
      departmentId: null,
      sectionId: null,
    },

    create: {
      username: "admin",
      password: passwordHash,
      fullname: "ผู้ดูแลระบบ",
      role: Role.ADMIN,
      active: true,
      departmentId: null,
      sectionId: null,
    },
  });

  // =========================
  // STAFF - งานการเงิน
  // =========================

  await prisma.user.upsert({
    where: {
      username: "finance",
    },

    update: {
      role: Role.STAFF,
      active: true,
      departmentId: adminDepartmentId,
      sectionId: sectionMap["งานการเงิน"],
    },

    create: {
      username: "finance",
      password: passwordHash,
      fullname: "เจ้าหน้าที่งานการเงิน",
      role: Role.STAFF,
      active: true,
      departmentId: adminDepartmentId,
      sectionId: sectionMap["งานการเงิน"],
    },
  });

  // =========================
  // STAFF - งานสารบรรณ
  // =========================

  await prisma.user.upsert({
    where: {
      username: "document",
    },

    update: {
      role: Role.STAFF,
      active: true,
      departmentId: adminDepartmentId,
      sectionId: sectionMap["งานสารบรรณ"],
    },

    create: {
      username: "document",
      password: passwordHash,
      fullname: "เจ้าหน้าที่งานสารบรรณ",
      role: Role.STAFF,
      active: true,
      departmentId: adminDepartmentId,
      sectionId: sectionMap["งานสารบรรณ"],
    },
  });

  // =========================
  // STAFF - งานพัสดุ
  // =========================

  await prisma.user.upsert({
    where: {
      username: "supplies",
    },

    update: {
      role: Role.STAFF,
      active: true,
      departmentId: adminDepartmentId,
      sectionId: sectionMap["งานพัสดุ"],
    },

    create: {
      username: "supplies",
      password: passwordHash,
      fullname: "เจ้าหน้าที่งานพัสดุ",
      role: Role.STAFF,
      active: true,
      departmentId: adminDepartmentId,
      sectionId: sectionMap["งานพัสดุ"],
    },
  });

  // =========================
  // ผู้ขาย
  // =========================

  const vendor = await prisma.vendor.upsert({
    where: {
      id: 1,
    },

    update: {},

    create: {
      name: "บริษัทตัวอย่าง",
      address: "กรุงเทพมหานคร",
      phone: "-",
    },
  });

  // =========================
  // วัสดุเริ่มต้น
  // =========================

  await prisma.material.createMany({
    data: [
      {
        code: "OFF-001",
        name: "กระดาษ A4",
        category: Category.OFFICE,
        unit: "รีม",
        balance: 100,
        minimumStock: 10,
        latestPrice: 120,
        vendorId: vendor.id,
      },

      {
        code: "COM-001",
        name: "เมาส์ USB",
        category: Category.COMPUTER,
        unit: "ชิ้น",
        balance: 50,
        minimumStock: 5,
        latestPrice: 250,
        vendorId: vendor.id,
      },

      {
        code: "ELE-001",
        name: "ปลั๊กไฟ",
        category: Category.ELECTRIC,
        unit: "อัน",
        balance: 30,
        minimumStock: 5,
        latestPrice: 180,
        vendorId: vendor.id,
      },

      {
        code: "HOU-001",
        name: "น้ำยาทำความสะอาด",
        category: Category.HOUSEHOLD,
        unit: "ขวด",
        balance: 40,
        minimumStock: 5,
        latestPrice: 90,
        vendorId: vendor.id,
      },

      {
        code: "VEH-001",
        name: "น้ำมันเครื่อง",
        category: Category.VEHICLE,
        unit: "ขวด",
        balance: 20,
        minimumStock: 5,
        latestPrice: 350,
        vendorId: vendor.id,
      },

      {
        code: "PRI-001",
        name: "หมึกพิมพ์",
        category: Category.PRINTING,
        unit: "กล่อง",
        balance: 25,
        minimumStock: 5,
        latestPrice: 1500,
        vendorId: vendor.id,
      },
    ],

    skipDuplicates: true,
  });

  console.log(
    "Seed สำเร็จ : หน่วยงาน กลุ่มงาน เจ้าหน้าที่ ผู้ใช้ ผู้ขาย และวัสดุครบ 6 หมวด"
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