{/* =====================================================
    Header
===================================================== */}

<div
  className="
    flex
    min-h-[110px]
    w-full
    min-w-0
    flex-col
    justify-center
    gap-4
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
    sm:flex-row
    sm:items-center
    sm:justify-between
    sm:gap-4
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
        sm:text-4xl
      "
    >
      ✏️ แก้ไขข้อมูลเจ้าหน้าที่
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
        sm:text-lg
      "
    >
      ปรับปรุงข้อมูลรายชื่อและประเภทบุคลากร
    </p>
  </div>

  <Link
    href={`/departments/${sectionId}`}
    className="
      w-full
      shrink-0
      rounded-xl
      bg-gradient-to-r
      from-emerald-600
      to-green-500
      px-4
      py-2.5
      text-center
      text-sm
      font-extrabold
      !text-white
      shadow-lg
      transition
      hover:scale-105
      sm:w-auto
      sm:px-5
      sm:py-3
      sm:text-base
    "
  >
    ← กลับ
  </Link>
</div>