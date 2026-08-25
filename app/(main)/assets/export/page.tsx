import Link from "next/link";

export default function AssetsExportPage() {
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
            📄 ส่งออกทะเบียนคุมครุภัณฑ์
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            เลือกรูปแบบรายงานที่ต้องการส่งออก
          </p>
        </div>
      </div>

      {/* =====================================================
          Export Options
      ===================================================== */}

      <div
        className="
          grid
          gap-5
          md:grid-cols-3
        "
      >
        {/* ===================================================
            ทะเบียนคุมครุภัณฑ์
        =================================================== */}

        <Link
          href="/assets/export/pdf"
          className="
            group
            overflow-hidden
            rounded-2xl
            border
            border-slate-300
            bg-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div
            className="
              h-2
              bg-gradient-to-r
              from-slate-700
              to-slate-900
            "
          />

          <div
            className="
              flex
              min-h-[250px]
              flex-col
              items-center
              justify-center
              gap-5
              p-6
              text-center
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-slate-100
                text-4xl
                shadow-md
                transition
                duration-300
                group-hover:scale-110
              "
            >
              📋
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                ทะเบียนคุมครุภัณฑ์
              </h2>

              <p className="mt-2 text-base font-semibold text-slate-600">
                รายการครุภัณฑ์ทั้งหมดตามหน่วยงาน
              </p>
            </div>

            <span
              className="
                rounded-xl
                bg-gradient-to-r
                from-slate-800
                to-slate-950
                px-7
                py-3
                font-extrabold
                text-white
                shadow-lg
                transition
                group-hover:scale-105
              "
            >
              ส่งออก PDF
            </span>
          </div>
        </Link>

        {/* ===================================================
            รายงานการตรวจสอบ
        =================================================== */}

        <Link
          href="/assets/export/inspection"
          className="
            group
            overflow-hidden
            rounded-2xl
            border
            border-slate-300
            bg-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div
            className="
              h-2
              bg-gradient-to-r
              from-emerald-600
              to-green-500
            "
          />

          <div
            className="
              flex
              min-h-[250px]
              flex-col
              items-center
              justify-center
              gap-5
              p-6
              text-center
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                text-4xl
                shadow-md
                transition
                duration-300
                group-hover:scale-110
              "
            >
              🔍
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                รายงานการตรวจสอบ
              </h2>

              <p className="mt-2 text-base font-semibold text-slate-600">
                รายงานผลการตรวจสอบครุภัณฑ์รายไตรมาส
              </p>
            </div>

            <span
              className="
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-7
                py-3
                font-extrabold
                text-white
                shadow-lg
                transition
                group-hover:scale-105
              "
            >
              ส่งออก PDF
            </span>
          </div>
        </Link>

        {/* ===================================================
            รายงานการจำหน่าย
        =================================================== */}

        <Link
          href="/assets/export/disposal"
          className="
            group
            overflow-hidden
            rounded-2xl
            border
            border-slate-300
            bg-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div
            className="
              h-2
              bg-gradient-to-r
              from-red-600
              to-rose-500
            "
          />

          <div
            className="
              flex
              min-h-[250px]
              flex-col
              items-center
              justify-center
              gap-5
              p-6
              text-center
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-xl
                border
                border-red-200
                bg-red-50
                text-4xl
                shadow-md
                transition
                duration-300
                group-hover:scale-110
              "
            >
              🗃️
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                รายงานการจำหน่าย
              </h2>

              <p className="mt-2 text-base font-semibold text-slate-600">
                รายการครุภัณฑ์ที่จำหน่ายแล้ว
              </p>
            </div>

            <span
              className="
                rounded-xl
                bg-gradient-to-r
                from-red-600
                to-rose-500
                px-7
                py-3
                font-extrabold
                text-white
                shadow-lg
                transition
                group-hover:scale-105
              "
            >
              ส่งออก PDF
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}