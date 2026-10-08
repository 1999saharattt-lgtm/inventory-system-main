



import { NextResponse } from "next/server";



import { cookies } from "next/headers";



import { prisma } from "@/lib/prisma";



import { verifySession } from "@/lib/session";







type InspectionRowPayload = {



  materialId?: unknown;



  accuracy?: unknown;



  shortageQty?: unknown;



  excessQty?: unknown;



  baht?: unknown;



  satang?: unknown;



  damagedQty?: unknown;



  deterioratedQty?: unknown;



  unnecessaryQty?: unknown;



  remark?: unknown;



};







type InspectionPayload = {



  fiscalYear?: unknown;



  inspectionDate?: unknown;



  inspectionEndDate?: unknown;



  inspectorIds?: unknown;



  rows?: unknown;



};







type ParsedInspectionRow = {



  materialId: number;



  accuracy: string | null;



  shortageQty: number | null;



  excessQty: number | null;



  baht: number | null;



  satang: number | null;



  damagedQty: number | null;



  deterioratedQty: number | null;



  unnecessaryQty: number | null;



  remark: string | null;



};







type ParsedInspectionPayload = {



  fiscalYear: number;



  inspectionDate: Date;



  inspectionEndDate: Date | null;



  inspectorIds: number[];



  rows: ParsedInspectionRow[];



};







type ParsePayloadResult =



  | { ok: true; data: ParsedInspectionPayload }



  | { ok: false; response: NextResponse };







function jsonError(message: string, status: number) {



  return NextResponse.json(



    { ok: false, message },



    { status }



  );



}







async function getSession() {



  const cookieStore = await cookies();



  const token = cookieStore.get("session")?.value;







  if (!token) return null;







  try {



    return await verifySession(token);



  } catch {



    return null;



  }



}







function parsePositiveInteger(value: unknown) {



  const parsed =



    typeof value === "number"



      ? value



      : Number(String(value ?? "").trim());







  return Number.isSafeInteger(parsed) && parsed > 0



    ? parsed



    : null;



}







function parseOptionalNonNegativeInteger(value: unknown) {



  if (



    value === null ||



    value === undefined ||



    String(value).trim() === ""



  ) {



    return null;



  }







  const parsed =



    typeof value === "number"



      ? value



      : Number(String(value).trim());







  return Number.isSafeInteger(parsed) && parsed >= 0



    ? parsed



    : undefined;



}







function parseText(value: unknown) {



  const text = String(value ?? "").trim();



  return text || null;



}







function parseDateOnly(value: unknown) {



  const text = String(value ?? "").trim();



  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);







  if (!match) return null;







  const year = Number(match[1]);



  const month = Number(match[2]);



  const day = Number(match[3]);







  const date = new Date(



    Date.UTC(year, month - 1, day, 0, 0, 0, 0)



  );







  if (



    date.getUTCFullYear() !== year ||



    date.getUTCMonth() !== month - 1 ||



    date.getUTCDate() !== day



  ) {



    return null;



  }







  return date;



}







function parseAccuracy(value: unknown) {



  const accuracy = String(value ?? "")



    .trim()



    .toUpperCase();







  if (!accuracy) return null;







  if (



    accuracy !== "CORRECT" &&



    accuracy !== "INCORRECT"



  ) {



    return undefined;



  }







  return accuracy;



}







async function parsePayload(



  request: Request



): Promise<ParsePayloadResult> {



  let body: InspectionPayload | null = null;







  try {



    body = (await request.json()) as InspectionPayload;



  } catch {



    return {



      ok: false,



      response: jsonError("ข้อมูลที่ส่งมาไม่ถูกต้อง", 400),



    };



  }







  if (!body || typeof body !== "object" || Array.isArray(body)) {



    return {



      ok: false,



      response: jsonError("ข้อมูลที่ส่งมาไม่ถูกต้อง", 400),



    };



  }







  const fiscalYear = parsePositiveInteger(body.fiscalYear);







  if (



    fiscalYear === null ||



    fiscalYear < 2400 ||



    fiscalYear > 3000



  ) {



    return {



      ok: false,



      response: jsonError("ปีงบประมาณไม่ถูกต้อง", 400),



    };



  }







  const inspectionDate = parseDateOnly(



    body.inspectionDate



  );







  if (!inspectionDate) {



    return {



      ok: false,



      response: jsonError("วันที่เริ่มตรวจสอบไม่ถูกต้อง", 400),



    };



  }







  // รองรับประวัติเดิมที่ยังไม่มีวันที่ตรวจสอบแล้วเสร็จ



  const hasEndDate =



    body.inspectionEndDate !== null &&



    body.inspectionEndDate !== undefined &&



    String(body.inspectionEndDate).trim() !== "";







  const inspectionEndDate = hasEndDate



    ? parseDateOnly(body.inspectionEndDate)



    : null;







  if (hasEndDate && !inspectionEndDate) {



    return {



      ok: false,



      response: jsonError(



        "วันที่ตรวจสอบแล้วเสร็จไม่ถูกต้อง",



        400



      ),



    };



  }







  if (



    inspectionEndDate &&



    inspectionEndDate.getTime() < inspectionDate.getTime()



  ) {



    return {



      ok: false,



      response: jsonError(



        "วันที่ตรวจสอบแล้วเสร็จต้องไม่ก่อนวันที่เริ่มตรวจสอบ",



        400



      ),



    };



  }







  if (!Array.isArray(body.inspectorIds)) {



    return {



      ok: false,



      response: jsonError(



        "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน",



        400



      ),



    };



  }







  const inspectorIds = body.inspectorIds.map(



    parsePositiveInteger



  );







  if (



    inspectorIds.length !== 3 ||



    inspectorIds.some((id) => id === null)



  ) {



    return {



      ok: false,



      response: jsonError(



        "กรุณาเลือกคณะกรรมการตรวจสอบให้ครบ 3 คน",



        400



      ),



    };



  }







  const validInspectorIds = inspectorIds as number[];







  if (new Set(validInspectorIds).size !== 3) {



    return {



      ok: false,



      response: jsonError(



        "ไม่สามารถเลือกคณะกรรมการตรวจสอบซ้ำกันได้",



        400



      ),



    };



  }







  if (!Array.isArray(body.rows) || body.rows.length === 0) {



    return {



      ok: false,



      response: jsonError(



        "ไม่พบรายการพัสดุสำหรับบันทึก",



        400



      ),



    };



  }







  const rows: ParsedInspectionRow[] = [];







  const numberFields = [



    "shortageQty",



    "excessQty",



    "baht",



    "satang",



    "damagedQty",



    "deterioratedQty",



    "unnecessaryQty",



  ] as const;







  for (let index = 0; index < body.rows.length; index++) {



    const rawRow = body.rows[index] as InspectionRowPayload;







    if (



      !rawRow ||



      typeof rawRow !== "object" ||



      Array.isArray(rawRow)



    ) {



      return {



        ok: false,



        response: jsonError(



          `ข้อมูลรายการที่ ${index + 1} ไม่ถูกต้อง`,



          400



        ),



      };



    }







    const materialId = parsePositiveInteger(



      rawRow.materialId



    );







    if (materialId === null) {



      return {



        ok: false,



        response: jsonError(



          `รหัสพัสดุรายการที่ ${index + 1} ไม่ถูกต้อง`,



          400



        ),



      };



    }







    const accuracy = parseAccuracy(rawRow.accuracy);







    if (accuracy === undefined) {



      return {



        ok: false,



        response: jsonError(



          `ผลการตรวจสอบรายการที่ ${index + 1} ไม่ถูกต้อง`,



          400



        ),



      };



    }







    const values = Object.fromEntries(



      numberFields.map((field) => [



        field,



        parseOptionalNonNegativeInteger(rawRow[field]),



      ])



    ) as Record<



      (typeof numberFields)[number],



      number | null | undefined



    >;







    if (



      numberFields.some(



        (field) => values[field] === undefined



      )



    ) {



      return {



        ok: false,



        response: jsonError(



          `จำนวนในรายการที่ ${index + 1} ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`,



          400



        ),



      };



    }







    rows.push({



      materialId,



      accuracy,



      shortageQty: values.shortageQty ?? null,



      excessQty: values.excessQty ?? null,



      baht: values.baht ?? null,



      satang: values.satang ?? null,



      damagedQty: values.damagedQty ?? null,



      deterioratedQty: values.deterioratedQty ?? null,



      unnecessaryQty: values.unnecessaryQty ?? null,



      remark: parseText(rawRow.remark),



    });



  }







  const materialIds = rows.map((row) => row.materialId);







  if (new Set(materialIds).size !== materialIds.length) {



    return {



      ok: false,



      response: jsonError(



        "พบรายการพัสดุซ้ำในข้อมูลที่ส่งมา",



        400



      ),



    };



  }







  return {



    ok: true,



    data: {



      fiscalYear,



      inspectionDate,



      inspectionEndDate,



      inspectorIds: validInspectorIds,



      rows,



    },



  };



}







async function validateReferences(



  data: ParsedInspectionPayload



) {



  const materialIds = data.rows.map(



    (row) => row.materialId



  );







  const officers = await prisma.officer.findMany({



    where: {



      id: { in: data.inspectorIds },



    },



    select: {



      id: true,



      firstName: true,



      lastName: true,



    },



  });







  if (officers.length !== data.inspectorIds.length) {



    return {



      ok: false as const,



      response: jsonError(



        "ไม่พบข้อมูลคณะกรรมการตรวจสอบบางราย",



        400



      ),



    };



  }







  const officerMap = new Map(



    officers.map((officer) => [officer.id, officer])



  );







  const inspectorNames = data.inspectorIds.map((id) => {



    const officer = officerMap.get(id);







    return officer



      ? `${officer.firstName} ${officer.lastName}`.trim()



      : "";



  });







  const materials = await prisma.material.findMany({



    where: {



      id: { in: materialIds },



    },



    select: {



      id: true,



    },



  });







  if (materials.length !== materialIds.length) {



    return {



      ok: false as const,



      response: jsonError(



        "ไม่พบข้อมูลพัสดุบางรายการ กรุณาเปิดหน้าใหม่แล้วลองอีกครั้ง",



        400



      ),



    };



  }







  return {



    ok: true as const,



    inspectorNames,



  };



}













export async function POST(request: Request) {



  const session = await getSession();







  if (!session) {



    return jsonError("กรุณาเข้าสู่ระบบ", 401);



  }







  const parsed = await parsePayload(request);







  if (!parsed.ok) {



    return parsed.response;



  }







  const data = parsed.data;







  const existingInspection =



    await prisma.stockCardInspection.findUnique({



      where: {



        fiscalYear: data.fiscalYear,



      },



      select: {



        id: true,



      },



    });







  if (existingInspection) {



    return jsonError(



      `มีข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${data.fiscalYear} แล้ว`,



      409



    );



  }







  const references = await validateReferences(data);







  if (!references.ok) {



    return references.response;



  }







  try {



    const inspection = await prisma.$transaction(



      async (tx) => {



        const created = await tx.stockCardInspection.create({



          data: {



            fiscalYear: data.fiscalYear,



            inspectionDate: data.inspectionDate,



            inspectionEndDate: data.inspectionEndDate,



            inspectorIds: data.inspectorIds,



            inspectorNames: references.inspectorNames,



          },



          select: {



            id: true,



            fiscalYear: true,



            inspectionDate: true,



            inspectionEndDate: true,



          },



        });







        await tx.stockCardInspectionRow.createMany({



          data: data.rows.map((row) => ({



            inspectionId: created.id,



            materialId: row.materialId,



            accuracy: row.accuracy,



            shortageQty: row.shortageQty,



            excessQty: row.excessQty,



            baht: row.baht,



            satang: row.satang,



            damagedQty: row.damagedQty,



            deterioratedQty: row.deterioratedQty,



            unnecessaryQty: row.unnecessaryQty,



            remark: row.remark,



          })),



        });







        return created;



      }



    );







    return NextResponse.json(



      {



        ok: true,



        message:



          "บันทึกผลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว",



        inspection: {



          id: inspection.id,



          fiscalYear: inspection.fiscalYear,



          inspectionDate: inspection.inspectionDate,



          inspectionEndDate: inspection.inspectionEndDate,



          rowCount: data.rows.length,



        },



      },



      { status: 201 }



    );



  } catch (error) {



    console.error(



      "Create stock card inspection error:",



      error



    );







    try {



      const duplicate =



        await prisma.stockCardInspection.findUnique({



          where: {



            fiscalYear: data.fiscalYear,



          },



          select: {



            id: true,



          },



        });







      if (duplicate) {



        return jsonError(



          `มีข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${data.fiscalYear} แล้ว`,



          409



        );



      }



    } catch (duplicateCheckError) {



      console.error(



        "Check duplicate stock card inspection error:",



        duplicateCheckError



      );



    }







    return jsonError(



      "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบบัญชีพัสดุ",



      500



    );



  }



}







export async function PUT(request: Request) {



  const session = await getSession();







  if (!session) {



    return jsonError("กรุณาเข้าสู่ระบบ", 401);



  }







  const parsed = await parsePayload(request);







  if (!parsed.ok) {



    return parsed.response;



  }







  const data = parsed.data;







  const url = new URL(request.url);







  const queryFiscalYearText = url.searchParams.get(



    "fiscalYear"



  );







  if (queryFiscalYearText) {



    const queryFiscalYear = parsePositiveInteger(



      queryFiscalYearText



    );







    if (



      queryFiscalYear === null ||



      queryFiscalYear < 2400 ||



      queryFiscalYear > 3000



    ) {



      return jsonError(



        "ปีงบประมาณใน URL ไม่ถูกต้อง",



        400



      );



    }







    if (queryFiscalYear !== data.fiscalYear) {



      return jsonError(



        "ปีงบประมาณของข้อมูลไม่ตรงกับรายการที่ต้องการแก้ไข",



        400



      );



    }



  }







  const existingInspection =



    await prisma.stockCardInspection.findUnique({



      where: {



        fiscalYear: data.fiscalYear,



      },



      select: {



        id: true,



        fiscalYear: true,



      },



    });







  if (!existingInspection) {



    return jsonError(



      `ไม่พบข้อมูลการตรวจสอบบัญชีพัสดุประจำปีงบประมาณ ${data.fiscalYear}`,



      404



    );



  }







  // Validate current material IDs and permit changes to the material roster.

  const references = await validateReferences(data);







  if (!references.ok) {



    return references.response;



  }







  try {



    const inspection = await prisma.$transaction(



      async (tx) => {



        const updated = await tx.stockCardInspection.update({



          where: {



            id: existingInspection.id,



          },



          data: {



            inspectionDate: data.inspectionDate,



            inspectionEndDate: data.inspectionEndDate,



            inspectorIds: data.inspectorIds,



            inspectorNames: references.inspectorNames,



          },



          select: {



            id: true,



            fiscalYear: true,



            inspectionDate: true,



            inspectionEndDate: true,



            updatedAt: true,



          },



        });







        // ลบเฉพาะผลตรวจเดิม ไม่แตะยอดคงเหลือ



        await tx.stockCardInspectionRow.deleteMany({



          where: {



            inspectionId: existingInspection.id,



          },



        });







        // บันทึกผลตรวจชุดใหม่ของพัสดุรายการเดิม



        await tx.stockCardInspectionRow.createMany({



          data: data.rows.map((row) => ({



            inspectionId: existingInspection.id,



            materialId: row.materialId,



            accuracy: row.accuracy,



            shortageQty: row.shortageQty,



            excessQty: row.excessQty,



            baht: row.baht,



            satang: row.satang,



            damagedQty: row.damagedQty,



            deterioratedQty: row.deterioratedQty,



            unnecessaryQty: row.unnecessaryQty,



            remark: row.remark,



          })),



        });







        return updated;



      }



    );







    return NextResponse.json(



      {



        ok: true,



        message:



          "แก้ไขข้อมูลการตรวจสอบบัญชีพัสดุประจำปีเรียบร้อยแล้ว",



        inspection: {



          id: inspection.id,



          fiscalYear: inspection.fiscalYear,



          inspectionDate: inspection.inspectionDate,



          inspectionEndDate: inspection.inspectionEndDate,



          updatedAt: inspection.updatedAt,



          rowCount: data.rows.length,



        },



      },



      { status: 200 }



    );



  } catch (error) {



    console.error(



      "Update stock card inspection error:",



      error



    );







    return jsonError(



      "เกิดข้อผิดพลาดในการแก้ไขข้อมูลการตรวจสอบบัญชีพัสดุ",



      500



    );



  }



}

/** ลบเฉพาะประวัติการตรวจสอบและผลตรวจ ไม่กระทบยอด Stock Card */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("กรุณาเข้าสู่ระบบ", 401);

  const url = new URL(request.url);
  const fiscalYear = parsePositiveInteger(url.searchParams.get("fiscalYear"));
  if (fiscalYear === null || fiscalYear < 2400 || fiscalYear > 3000) {
    return jsonError("ปีงบประมาณไม่ถูกต้อง", 400);
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const inspection = await tx.stockCardInspection.findUnique({
        where: { fiscalYear },
        select: { id: true },
      });
      if (!inspection) return false;

      await tx.stockCardInspectionRow.deleteMany({
        where: { inspectionId: inspection.id },
      });
      await tx.stockCardInspection.delete({ where: { id: inspection.id } });
      return true;
    });

    if (!deleted) {
      return jsonError(`ไม่พบประวัติการตรวจสอบปีงบประมาณ ${fiscalYear}`, 404);
    }
    return NextResponse.json({
      ok: true,
      message: `ลบประวัติการตรวจสอบปีงบประมาณ ${fiscalYear} เรียบร้อยแล้ว`,
    });
  } catch (error) {
    console.error("Delete stock card inspection error:", error);
    return jsonError("เกิดข้อผิดพลาดในการลบประวัติการตรวจสอบ", 500);
  }
}
