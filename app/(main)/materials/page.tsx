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
                ใช้ primary = เขียวกรมอนามัย
            =============================================== */}

            <AppButton
              href="/materials/export/pdf"
              variant="primary"
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

          sm:grid-cols-2

          xl:grid-cols-3
        "
      >
        {categories.map(
          (category) => (
            <AppCard
              key={category.code}
              className="
                flex
                min-h-[190px]
                min-w-0

                flex-col
                items-center
                justify-center

                text-center

                sm:min-h-[210px]

                xl:min-h-[230px]
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

                    h-14
                    w-14
                    shrink-0

                    place-items-center

                    text-center

                    sm:h-16
                    sm:w-16
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
                  mt-3

                  w-full
                  min-w-0

                  text-center

                  sm:mt-4
                "
              >
                <h2
                  className="
                    w-full

                    break-words

                    text-center
                    text-lg
                    font-extrabold

                    !text-slate-900

                    sm:text-xl
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
                  mt-4

                  flex
                  w-full

                  items-center
                  justify-center

                  sm:mt-5
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
          )
        )}
      </section>
    </AppPage>
  );
}