/* =========================================================
   UI
========================================================= */

return (
  <AppPage>
    {/* =====================================================
        HEADER
    ===================================================== */}

    <AppPageHeader
      icon={
        categoryIcon[
          assetCategory
        ]
      }
      title={
        categoryName[
          assetCategory
        ]
      }
      subtitle={`${department.name} — ทะเบียนคุมครุภัณฑ์`}
      actions={
        <>
          {canManage && (
            <AppButton
              href={`/assets/${department.id}/${assetCategory.toLowerCase()}/new`}
              variant="primary"
              size="md"
              icon={
                <span aria-hidden="true">
                  ＋
                </span>
              }
            >
              เพิ่มครุภัณฑ์
            </AppButton>
          )}

          <AppButton
            href={`/assets/${department.id}`}
            variant="back"
            size="md"
            icon={
              <span aria-hidden="true">
                ←
              </span>
            }
          >
            กลับ
          </AppButton>
        </>
      }
    />

    {/* =====================================================
        SEARCH
    ===================================================== */}

    <AssetCategorySearch
      initialValue={search}
      resultCount={assets.length}
      pathname={`/assets/${department.id}/${assetCategory.toLowerCase()}`}
    />

    {/* =====================================================
        TABLE
    ===================================================== */}

    <AppTableCard
      title={`รายการ${categoryName[assetCategory]}`}
      subtitle={`${department.name} • ทะเบียนคุมครุภัณฑ์`}
      badge={`${assets.length.toLocaleString(
        "th-TH"
      )} รายการ`}
      className="
        w-full
        min-w-0
      "
    >
      <div
        className="
          w-full
          min-w-0
          overflow-x-auto
          overscroll-x-contain
        "
      >
        <table
          className="
            w-full
            min-w-[1650px]
            border-collapse
            bg-white
            text-sm
          "
        >
          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <thead>
            <tr>
              {[
                "ลำดับ",
                "รหัส GFMIS",
                "รหัสครุภัณฑ์",
                "รายการครุภัณฑ์",
                "จำนวน",
                "หน่วย",
                "ผู้รับผิดชอบ",
                "สถานะ",
                "รายละเอียด",
                "จัดการ",
              ].map(
                (tableTitle) => (
                  <th
                    key={tableTitle}
                    className="
                      whitespace-nowrap

                      border
                      border-black

                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700

                      px-4
                      py-4

                      text-center
                      text-base
                      font-extrabold
                      !text-white

                      sm:text-lg
                    "
                  >
                    {tableTitle}
                  </th>
                )
              )}
            </tr>
          </thead>

          {/* =================================================
              TABLE BODY
          ================================================= */}

          <tbody>
            {assets.length > 0 ? (
              assets.map(
                (
                  asset,
                  index
                ) => {
                  const quantity =
                    asset.quantity ??
                    1;

                  const unit =
                    getAssetUnit(
                      asset.unit,
                      asset.remark,
                      categoryUnit[
                        assetCategory
                      ]
                    );

                  const responsible =
                    getResponsibleName(
                      asset,
                      department.name
                    );

                  const status =
                    getStatusLabel(
                      asset.status
                    );

                  const detailHref =
                    `/assets/${department.id}/${assetCategory.toLowerCase()}/${asset.id}`;

                  const editHref =
                    `${detailHref}/edit`;

                  return (
                    <tr
                      key={asset.id}
                      className={`
                        ${
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* ORDER */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {(
                          index + 1
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* GFMIS */}

                      <td
                        className="
                          min-w-[180px]
                          break-all
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {asset.governmentAssetNo ||
                          "-"}
                      </td>

                      {/* ASSET CODE */}

                      <td
                        className="
                          min-w-[200px]
                          break-all
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {asset.officeAssetNo ||
                          "-"}
                      </td>

                      {/* NAME */}

                      <td
                        className="
                          min-w-[280px]
                          border
                          border-black
                          px-4
                          py-3.5
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        <div
                          className="
                            font-extrabold
                            !text-slate-900
                          "
                        >
                          {asset.name}
                        </div>

                        {(asset.brand ||
                          asset.model) && (
                          <div
                            className="
                              mt-1
                              text-xs
                              font-semibold
                              !text-slate-500
                            "
                          >
                            {[
                              asset.brand,
                              asset.model,
                            ]
                              .filter(Boolean)
                              .join(" / ")}
                          </div>
                        )}
                      </td>

                      {/* QUANTITY */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {Number(
                          quantity
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* UNIT */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {unit}
                      </td>

                      {/* RESPONSIBLE */}

                      <td
                        className="
                          min-w-[240px]
                          break-words
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                          font-extrabold
                          !text-slate-900
                        "
                      >
                        {responsible}
                      </td>

                      {/* STATUS */}

                      <td
                        className="
                          min-w-[150px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3.5
                          text-center
                        "
                      >
                        <span
                          className={`
                            inline-flex
                            items-center
                            justify-center
                            whitespace-nowrap
                            rounded-full
                            px-3
                            py-1.5
                            text-xs
                            font-extrabold
                            ${status.className}
                          `}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* =====================================
                          DETAIL
                      ===================================== */}

                      <td
                        className="
                          min-w-[130px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3
                          text-center
                        "
                      >
                        <AppButton
                          href={detailHref}
                          variant="primary"
                          size="sm"
                        >
                          เปิด
                        </AppButton>
                      </td>

                      {/* =====================================
                          ACTIONS
                      ===================================== */}

                      <td
                        className="
                          min-w-[220px]
                          whitespace-nowrap
                          border
                          border-black
                          px-4
                          py-3
                        "
                      >
                        {canManage ? (
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >
                            <AppButton
                              href={editHref}
                              variant="secondary"
                              size="sm"
                            >
                              แก้ไข
                            </AppButton>

                            <form
                              action={
                                deleteAsset
                              }
                            >
                              <input
                                type="hidden"
                                name="assetId"
                                value={
                                  asset.id
                                }
                              />

                              <AppButton
                                type="submit"
                                variant="danger"
                                size="sm"
                              >
                                ลบ
                              </AppButton>
                            </form>
                          </div>
                        ) : (
                          <span
                            className="
                              font-semibold
                              !text-slate-400
                            "
                          >
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )
            ) : (
              <tr>
                <td
                  colSpan={10}
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
                      {search
                        ? "🔍"
                        : categoryIcon[
                            assetCategory
                          ]}
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
                      {search
                        ? "ไม่พบข้อมูลที่ค้นหา"
                        : `ยังไม่มี${categoryName[assetCategory]}ในหน่วยงานนี้`}
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
                      {search
                        ? `ไม่พบข้อมูลที่ตรงกับ "${search}"`
                        : "เมื่อมีการเพิ่มครุภัณฑ์ ข้อมูลจะแสดงในตารางนี้"}
                    </p>

                    {search && (
                      <div className="mt-5">
                        <AppButton
                          href={`/assets/${department.id}/${assetCategory.toLowerCase()}`}
                          variant="primary"
                          size="md"
                        >
                          แสดงรายการทั้งหมด
                        </AppButton>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppTableCard>
  </AppPage>
);