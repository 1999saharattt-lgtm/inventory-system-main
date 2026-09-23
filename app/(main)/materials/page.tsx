import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

/* =========================================================
   TYPES
========================================================= */

type Category = {
  code: string;
  name: string;
  icon: string;
};

/* =========================================================
   CATEGORIES
========================================================= */

const categories: Category[] = [
  {
    code: "OFFICE",
    name: "วัสดุสำนักงาน",
    icon: "📄",
  },
  {
    code: "COMPUTER",
    name: "วัสดุคอมพิวเตอร์",
    icon: "💻",
  },
  {
    code: "ELECTRIC",
    name: "วัสดุไฟฟ้าและวิทยุ",
    icon: "⚡",
  },
  {
    code: "HOUSEHOLD",
    name: "วัสดุงานบ้านและงานครัว",
    icon: "🏠",
  },
  {
    code: "VEHICLE",
    name: "วัสดุยานพาหนะ",
    icon: "🚗",
  },
  {
    code: "PRINTING",
    name: "วัสดุสื่อสิ่งพิมพ์",
    icon: "📰",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function MaterialsPage() {
  return (
    <AppPage>
      {/* =====================================================
          HEADER
          ใช้ Component กลางของระบบ
      ===================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle="เลือกหมวดหมู่เพื่อดูและจัดการข้อมูลพัสดุ"
        actions={
          <>
            {/* ===============================================
                QR CODE รวม
            =============================================== */}

            <AppButton
              href="/materials/qr/pdf"
              variant="primary"
              size="md"
              target="_blank"
              icon={
                <span aria-hidden="true">
                  📱
                </span>
              }
            >
              QR Code รวม
            </AppButton>

            {/* ===============================================
                รวมรายการพัสดุ
            =============================================== */}

            <AppButton
              href="/materials/export/pdf"
              variant="secondary"
              size="md"
              target="_blank"
              icon={
                <span aria-hidden="true">
                  📋
                </span>
              }
            >
              รวมรายการพัสดุ
            </AppButton>
          </>
        }
      />

      {/* =====================================================
          CATEGORY SECTION
          ใช้ AppCard กลาง
      ===================================================== */}

      <AppCard
        className="
          w-full
          min-w-0

          p-4

          sm:p-5
          lg:p-6
        "
      >
        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <div
          className="
            mb-5

            flex
            flex-col
            gap-1
          "
        >
          <h2
            className="
              text-lg
              font-black
              tracking-tight
              !text-slate-900

              sm:text-xl
            "
          >
            หมวดหมู่พัสดุ
          </h2>

          <p
            className="
              text-sm
              font-semibold
              !text-slate-500
            "
          >
            เลือกหมวดหมู่ที่ต้องการเพื่อดูและจัดการรายการพัสดุ
          </p>
        </div>

        {/* ===================================================
            CATEGORY GRID
        =================================================== */}

        <div
          className="
            grid
            w-full
            min-w-0

            grid-cols-1
            gap-4

            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {categories.map(
            (category) => (
              <AppInfoCard
                key={category.code}
                className="
                  flex
                  min-h-[220px]
                  min-w-0
                  flex-col
                "
              >
                {/* ===========================================
                    CONTENT
                =========================================== */}

                <div
                  className="
                    flex
                    min-h-0
                    flex-1
                    flex-col
                    items-center
                    justify-center

                    text-center
                  "
                >
                  {/* =========================================
                      ICON
                  ========================================= */}

                  <div
                    className="
                      text-4xl
                      leading-none

                      sm:text-5xl
                    "
                    aria-hidden="true"
                  >
                    {category.icon}
                  </div>

                  {/* =========================================
                      CATEGORY NAME
                  ========================================= */}

                  <h3
                    className="
                      mt-4

                      break-words

                      text-lg
                      font-black
                      leading-tight
                      tracking-tight
                      !text-slate-900

                      sm:text-xl
                    "
                  >
                    {category.name}
                  </h3>

                  {/* =========================================
                      DESCRIPTION
                  ========================================= */}

                  <p
                    className="
                      mt-2

                      max-w-[300px]

                      text-sm
                      font-semibold
                      leading-relaxed
                      !text-slate-500
                    "
                  >
                    ดูและจัดการข้อมูลพัสดุในหมวดหมู่นี้
                  </p>
                </div>

                {/* ===========================================
                    ACTION
                    ใช้ AppButton กลาง
                =========================================== */}

                <div
                  className="
                    mt-5

                    flex
                    w-full
                    justify-center
                  "
                >
                  <AppButton
                    href={`/materials/category/${category.code}`}
                    variant="primary"
                    size="md"
                  >
                    เปิด
                  </AppButton>
                </div>
              </AppInfoCard>
            )
          )}
        </div>
      </AppCard>
    </AppPage>
  );
}