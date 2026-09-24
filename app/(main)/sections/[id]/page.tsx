import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function SectionDetailPage({
  params,
}: Props) {
  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

  const sectionId = Number(id);

  if (
    !Number.isInteger(sectionId) ||
    sectionId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     SECTION
  ======================================================= */

  const section =
    await prisma.section.findUnique({
      where: {
        id: sectionId,
      },

      include: {
        officers: true,
        department: true,
      },
    });

  if (!section) {
    notFound();
  }

  /* =======================================================
     ROUTES
  ======================================================= */

  const backPath =
    `/departments/${section.departmentId}`;

  /* =======================================================
     OFFICERS
  ======================================================= */

  const officers = [
    ...section.officers,
  ].sort((a, b) => {
    const firstNameCompare =
      a.firstName.localeCompare(
        b.firstName,
        "th"
      );

    if (firstNameCompare !== 0) {
      return firstNameCompare;
    }

    return a.lastName.localeCompare(
      b.lastName,
      "th"
    );
  });

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="🏢"
        title={section.name}
        subtitle={`กลุ่ม: ${
          section.department?.name ?? "-"
        }`}
        actions={
          <AppButton
            href={backPath}
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          OFFICER TABLE
      ===================================================== */}

      <AppTableCard
        title="รายชื่อเจ้าหน้าที่"
        subtitle={`เจ้าหน้าที่ใน ${section.name}`}
        badge={`${officers.length.toLocaleString(
          "th-TH"
        )} คน`}
        className="
          w-full
          min-w-0
        "
      >
        <div
          className="
            w-full
            min-w-0
            overflow-hidden
          "
        >
          <table
            className="
              w-full
              table-fixed
              border-collapse
              bg-white
            "
          >
            {/* =================================================
                COLUMN WIDTH
            ================================================= */}

            <colgroup>
              <col className="w-[50%]" />
              <col className="w-[50%]" />
            </colgroup>

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ชื่อ - นามสกุล",
                  "ตำแหน่ง",
                ].map(
                  (title) => (
                    <th
                      key={title}
                      className="
                        whitespace-nowrap

                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-5
                        py-4

                        text-center
                        text-base
                        font-extrabold
                        !text-white

                        sm:text-lg
                      "
                    >
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {officers.length === 0 ? (
                /* =============================================
                    EMPTY STATE
                ============================================= */

                <tr>
                  <td
                    colSpan={2}
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-16
                          w-16
                          place-items-center
                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        👤
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight

                          !text-slate-900
                        "
                      >
                        ยังไม่มีเจ้าหน้าที่
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed

                          !text-slate-500
                        "
                      >
                        ยังไม่มีข้อมูลเจ้าหน้าที่ในกลุ่มงานนี้
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                officers.map(
                  (
                    officer,
                    index
                  ) => (
                    <tr
                      key={officer.id}
                      className={`
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          NAME
                      ======================================= */}

                      <td
                        className="
                          border
                          border-black

                          px-5
                          py-3.5

                          text-base
                          font-bold

                          !text-slate-900
                        "
                      >
                        <div
                          className="
                            break-words
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {officer.firstName}{" "}
                          {officer.lastName}
                        </div>
                      </td>

                      {/* =======================================
                          POSITION
                      ======================================= */}

                      <td
                        className="
                          border
                          border-black

                          px-5
                          py-3.5

                          text-base
                          font-bold

                          !text-slate-900
                        "
                      >
                        {officer.position || "-"}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}