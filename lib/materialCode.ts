import { prisma } from "@/lib/prisma";

const PREFIX = {
  OFFICE: "OFF",
  COMPUTER: "COM",
  ELECTRIC: "ELE",
  HOUSEHOLD: "HOU",
  VEHICLE: "VEH",
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
    return `${prefix}-001`;
  }

  const number = Number(last.code.split("-")[1]) + 1;

  return `${prefix}-${String(number).padStart(3, "0")}`;
}