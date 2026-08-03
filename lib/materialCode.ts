import { prisma } from "@/lib/prisma";

const PREFIX = {
  OFFICE: "OFF",
  COMPUTER: "COM",
  ELECTRIC: "ELE",
  HOUSEHOLD: "HOU",
  VEHICLE: "VEC",
  PRINTING: "PRI",
} as const;


export async function generateMaterialCode(
  category: keyof typeof PREFIX
) {

  const prefix = PREFIX[category];


  const last = await prisma.material.findFirst({

    where: {
      category,
    },

    orderBy: {
      code: "desc",
    },

  });



  if (!last) {

    return `${prefix}-0001`;

  }



  const lastNumber =
    Number(
      last.code.split("-")[1]
    );



  const nextNumber =
    lastNumber + 1;



  return `${prefix}-${String(nextNumber).padStart(4,"0")}`;

}