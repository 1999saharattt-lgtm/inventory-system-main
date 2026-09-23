import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";

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
      ===================================================== */}

      <AppPageHeader
        icon="📦"
        title="รายการพัสดุทั้งหมด"
        subtitle="เลือกหมวดหมู่เพื่อดูและจัดการข้อมูลพัสดุ"
        actions={
          <>
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
          CATEGORY GRID
      ===================================================== */}

      <section
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
        {categories.map((category) => (
          <AppCard
            key={category.code}
            className="
              flex
              min-h-[230px]
              min-w-0
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            {/* ===============================================
                ICON
            =============================================== */}

            <div
              className="
                flex
                w-full
                items-center
                justify-center
                text-center
              "
            >
              <div
                className="
                  grid
                  h-16
                  w-16
                  shrink-0
                  place-items-center
                  text-center
                "
                aria-hidden="true"
              >
                <span
                  className="
                    block
                    text-center
                    text-3xl
                    leading-none
                  "
                >
                  {category.icon}
                </span>
              </div>
            </div>

            {/* ===============================================
                INFORMATION
            =============================================== */}

            <div
              className="
                mt-4
                w-full
                min-w-0
                text-center
              "
            >
              <h2
                className="
                  w-full
                  break-words
                  text-center
                  text-xl
                  font-extrabold
                  !text-slate-900
                "
              >
                {category.name}
              </h2>

              <p
                className="
                  mt-2
                  w-full
                  break-words
                  text-center
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                ดูและจัดการข้อมูลพัสดุในหมวดหมู่นี้
              </p>
            </div>

            {/* ===============================================
                ACTION
            =============================================== */}

            <div
              className="
                mt-5
                flex
                w-full
                items-center
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
          </AppCard>
        ))}
      </section>
    </AppPage>
  );
}