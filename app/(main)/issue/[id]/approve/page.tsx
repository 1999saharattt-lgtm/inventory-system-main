import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  verifySession,
  type SessionUser,
} from "@/lib/session";
import { approveIssue } from "./action";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const categoryName: Record<string, string> = {
  OFFICE: "วัสดุสำนักงาน",
  COMPUTER: "วัสดุคอมพิวเตอร์",
  ELECTRIC: "วัสดุไฟฟ้าและวิทยุ",
  HOUSEHOLD: "วัสดุงานบ้านและงานครัว",
  VEHICLE: "วัสดุยานพาหนะ",
  PRINTING: "วัสดุสื่อสิ่งพิมพ์",
};

export default async function ApproveIssuePage({
  params,
}: Props) {
  const { id } = await params;

  // =====================================================
  // Session
  // =====================================================

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  let session: SessionUser | null = null;

  if (token) {
    try {
      session = await verifySession(token);
    } catch {
      session = null;
    }
  }

  // =====================================================
  // Login
  // =====================================================

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // ADMIN เท่านั้น
  // =====================================================

  if (session.role !== "ADMIN") {
    redirect("/issue");
  }

  // =====================================================
  // ดึงข้อมูลใบเบิก
  // =====================================================

  const issue = await prisma.issue.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      department: true,
      officer: true,
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  // =====================================================
  // ต้องเป็น PENDING เท่านั้น
  // =====================================================

  if (issue.status !== "PENDING") {
    redirect(`/issue/${issue.id}`);
  }

  // =====================================================
  // สรุปจำนวนที่ขอ
  // =====================================================

  const totalRequested = issue.items.reduce(
    (total, item) => total + Number(item.qty),
    0
  );

  // =====================================================
  // Server Action สำหรับยืนยันเบิกจ่าย
  // =====================================================

  const submitApprove = async (formData: FormData) => {
    "use server";

    const issuedQty: Record<number, number> = {};

    for (const item of issue.items) {
      const fieldName = `issuedQty_${item.id}`;
      const rawValue = formData.get(fieldName);

      if (
        rawValue === null ||
        String(rawValue).trim() === ""
      ) {
        throw new Error(
          `กรุณาระบุจำนวนเบิกจ่ายจริงสำหรับ "${item.material.name}"`
        );
      }

      const value = Number(rawValue);

      if (
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 0
      ) {
        throw new Error(
          `จำนวนเบิกจ่ายของ "${item.material.name}" ไม่ถูกต้อง`
        );
      }

      if (value > Number(item.qty)) {
        throw new Error(
          `จำนวนเบิกจ่ายของ "${item.material.name}" มากกว่าจำนวนที่ขอเบิก`
        );
      }

      issuedQty[item.id] = value;
    }

    await approveIssue(issue.id, issuedQty);

    redirect(`/issue/${issue.id}`);
  };

  return (
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            📝 ตรวจสอบและลงจำนวนเบิกจ่าย
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:text-base
            "
          >
            ตรวจสอบรายการและระบุจำนวนที่เบิกจ่ายจริง
          </p>
        </div>

        <Link
          href={`/issue/${issue.id}`}
          className="
            shrink-0
            whitespace-nowrap
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            leading-tight
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:from-emerald-700
            hover:to-green-600
            sm:px-5
            sm:py-3
            sm:text-base
          "
        >
          ← กลับรายละเอียด
        </Link>
      </div>

      {/* =====================================================
          ข้อมูลใบเบิก
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-900
          bg-gradient-to-br
          from-slate-950
          to-slate-800
          p-4
          text-white
          shadow-xl
          sm:p-6
        "
      >
        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {/* เลขที่ใบเบิก */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              เลขที่ใบเบิก
            </p>

            <p
              className="
                mt-2
                break-all
                text-lg
                font-extrabold
                !text-white
              "
            >
              {issue.documentNo}
            </p>
          </div>

          {/* วันที่เบิก */}

          <div>
            <p className="text-sm font-bold !text-slate-300">
              วันที่เบิก
            </p>

            <p className="mt-2 font-extrabold !text-white">
              {new Date(
                issue.issueDate
              ).toLocaleDateString("th-TH")}
            </p>
          </div>

          {/* หน่วยงาน */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              หน่วยงาน / กลุ่มงาน
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {issue.department?.name ?? "-"}
            </p>
          </div>

          {/* ผู้ขอเบิก */}

          <div className="min-w-0">
            <p className="text-sm font-bold !text-slate-300">
              ผู้ขอเบิก
            </p>

            <p className="mt-2 break-words font-extrabold !text-white">
              {issue.officer
                ? `${issue.officer.firstName} ${issue.officer.lastName}`
                : "-"}
            </p>
          </div>

          {/* จำนวนรายการ */}

          <div>
            <p className="text-sm font-bold !text-slate-300">
              จำนวนรายการ
            </p>

            <p className="mt-2 font-extrabold !text-white">
              {issue.items.length} รายการ
            </p>
          </div>

          {/* จำนวนรวม */}

          <div>
            <p className="text-sm font-bold !text-slate-300">
              จำนวนรวมที่ขอเบิก
            </p>

            <p className="mt-2 font-extrabold !text-white">
              {totalRequested} หน่วย
            </p>
          </div>
        </div>

        {/* หมายเหตุ */}

        {issue.remark && (
          <div
            className="
              mt-5
              border-t
              border-slate-700
              pt-4
            "
          >
            <p className="text-sm font-bold !text-slate-300">
              หมายเหตุ
            </p>

            <p className="mt-1 break-words font-semibold !text-white">
              {issue.remark}
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          คำเตือน
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-amber-300
          bg-amber-50
          p-4
          shadow-lg
          sm:p-6
        "
      >
        <p className="text-lg font-extrabold text-amber-900">
          ⚠️ ตรวจสอบก่อนยืนยัน
        </p>

        <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800 sm:text-base">
          กรุณาตรวจสอบจำนวนพัสดุที่สามารถเบิกจ่ายได้จริง
          ก่อนยืนยันรายการ ระบบจะใช้จำนวนเบิกจ่ายจริงในการตัดสต็อก
          และบันทึก Stock Card
        </p>
      </div>

      {/* =====================================================
          ตารางรายการ
      ===================================================== */}

      <form action={submitApprove}>
        <div
          className="
            w-full
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-black
            bg-white
            shadow-xl
          "
        >
          <div className="w-full overflow-x-auto">
            <table
              className="
                w-full
                min-w-[900px]
                border-collapse
                text-sm
              "
            >
              <thead>
                <tr
                  className="
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    !text-white
                  "
                >
                  <th className="w-[7%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                    ลำดับ
                  </th>

                  <th className="w-[18%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                    หมวดหมู่
                  </th>

                  <th className="w-[35%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                    รายการพัสดุ
                  </th>

                  <th className="w-[15%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                    จำนวนที่ขอ
                  </th>

                  <th className="w-[15%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                    จำนวนเบิกจ่ายจริง
                  </th>

                  <th className="w-[10%] border border-black px-3 py-4 text-center font-extrabold !text-white">
                    หน่วย
                  </th>
                </tr>
              </thead>

              <tbody>
                {issue.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
                    {/* ลำดับ */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    {/* หมวดหมู่ */}

                    <td
                      className="
                        break-words
                        border
                        border-black
                        px-3
                        py-4
                        font-semibold
                      "
                    >
                      {categoryName[
                        item.material.category
                      ] ??
                        item.material.category}
                    </td>

                    {/* รายการ */}

                    <td
                      className="
                        break-words
                        border
                        border-black
                        px-3
                        py-4
                        font-semibold
                      "
                    >
                      <span className="font-extrabold">
                        {item.material.code}
                      </span>{" "}
                      - {item.material.name}
                    </td>

                    {/* จำนวนที่ขอ */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-extrabold
                      "
                    >
                      {item.qty}
                    </td>

                    {/* จำนวนที่เบิกจ่ายจริง */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                      "
                    >
                      <input
                        type="number"
                        name={`issuedQty_${item.id}`}
                        min="0"
                        max={Number(item.qty)}
                        step="1"
                        placeholder="กรอกจำนวน"
                        className="
                          w-full
                          rounded-lg
                          border
                          border-slate-400
                          bg-white
                          px-3
                          py-2
                          text-center
                          font-extrabold
                          text-slate-900
                          outline-none
                          transition
                          focus:border-emerald-600
                          focus:ring-2
                          focus:ring-emerald-200
                        "
                      />
                    </td>

                    {/* หน่วย */}

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-4
                        text-center
                        font-bold
                      "
                    >
                      {item.material.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            สรุปก่อนยืนยัน
        ===================================================== */}

        <div
          className="
            mt-4
            w-full
            min-w-0
            rounded-2xl
            border
            border-slate-900
            bg-gradient-to-br
            from-slate-950
            to-slate-800
            p-4
            text-white
            shadow-xl
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p className="text-lg font-extrabold !text-white">
                📦 จำนวนที่กำลังจะเบิกจ่าย
              </p>

              <p className="mt-1 text-sm font-semibold !text-slate-300">
                กรุณากรอกจำนวนเบิกจ่ายจริงในแต่ละรายการ
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-3xl font-extrabold !text-white">
                {totalRequested}
              </p>

              <p className="text-sm font-bold !text-slate-300">
                หน่วยที่ขอสูงสุด
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ปุ่มดำเนินการ
        ===================================================== */}

        <div
          className="
            mt-4
            flex
            w-full
            flex-col
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="submit"
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-6
              py-3
              text-center
              font-extrabold
              !text-white
              shadow-lg
              transition
              hover:scale-[1.02]
              hover:from-emerald-700
              hover:to-green-600
              active:scale-[0.98]
              sm:w-auto
            "
          >
            ✅ ยืนยันการเบิกจ่ายและตัดสต็อก
          </button>
        </div>
      </form>
    </div>
  );
}