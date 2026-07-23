import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const password = await hash("1234", 10);

  await prisma.user.create({
    data: {
      username: "admin",
      password,
      fullname: "ผู้ดูแลระบบ",
      role: "ADMIN",
      active: true,
    },
  });

  console.log("สร้างผู้ใช้งานสำเร็จ");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });