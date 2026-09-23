import Link from "next/link";

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

export default function StockCardHome() {
  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="📚"
        title="รายการบัญชีพัสดุ"
        subtitle="เลือกหมวดหมู่เพื่อดูประวัติการเคลื่อนไหวพัสดุ"
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
        {categories.map((category) => {
          const href =
            `/stock-card/${category.code}`;

          return (
            <Link
              key={category.code}
              href={href}
              className="
                group
                block
                min-w-0
                no-underline
              "
            >
              <AppCard
                className="
                  flex
                  h-full
                  min-h-[230px]
                  min-w-0
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                {/* ===========================================
                    ICON
                =========================================== */}

                <div
                  className="
                    flex
                    h-16
                    w-16
                    shrink-0
                    items-center
                    justify-center

                    text-3xl
                  "
                  aria-hidden="true"
                >
                  {category.icon}
                </div>

                {/* ===========================================
                    TITLE
                =========================================== */}

                <div
                  className="
                    mt-4
                    min-w-0
                    w-full
                  "
                >
                  <h2
                    className="
                      break-words
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
                      break-words
                      text-sm
                      font-semibold
                      !text-slate-500
                    "
                  >
                    คลิกเพื่อดูรายการบัญชีพัสดุ
                  </p>
                </div>

                {/* ===========================================
                    ACTION
                =========================================== */}

                <div
                  className="
                    mt-5
                    flex
                    justify-center
                  "
                >
                  <AppButton
                    href={href}
                    variant="primary"
                    size="md"
                  >
                    เปิด
                  </AppButton>
                </div>
              </AppCard>
            </Link>
          );
        })}
      </section>
    </AppPage>
  );
}