      {/* =====================================================
          Table
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          max-w-full
          overflow-x-auto
          overscroll-x-contain
        "
      >
        <table
          className="
            w-full
            min-w-[900px]
            border-collapse
            border
            border-black
            bg-white
          "
        >
          <thead>
            <tr>
              {[
                "ลำดับ",
                "รหัสพัสดุ",
                "รายการพัสดุ",
                "หน่วย",
                "ผู้จำหน่ายล่าสุด",
                "บัญชีพัสดุ",
              ].map((title) => (
                <th
                  key={title}
                  className="
                    whitespace-nowrap
                    border
                    border-black
                    bg-gradient-to-r
                    from-slate-800
                    to-slate-700
                    px-3
                    py-3
                    text-center
                    text-lg
                    font-extrabold
                    !text-white
                  "
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-slate-900">
            {materials.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="
                    border
                    border-black
                    px-3
                    py-12
                    text-center
                    text-lg
                    font-bold
                    text-slate-500
                  "
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              materials.map((material, index) => {
                const latestReceive = material.receiveItems[0];

                const latestVendor =
                  latestReceive?.receive.vendor?.name ?? "-";

                return (
                  <tr
                    key={material.id}
                    className="
                      border
                      border-black
                      text-slate-900
                      transition
                      hover:bg-emerald-50
                    "
                  >
                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                        font-bold
                      "
                    >
                      {material.code}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-3
                        font-semibold
                      "
                    >
                      {material.name}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                      "
                    >
                      {material.unit}
                    </td>

                    <td
                      className="
                        border
                        border-black
                        px-3
                        py-3
                      "
                    >
                      {latestVendor}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        border
                        border-black
                        px-3
                        py-3
                        text-center
                      "
                    >
                      <Link
                        href={`/stock-card/material/${material.id}`}
                        className="
                          inline-block
                          rounded-xl
                          bg-gradient-to-r
                          from-emerald-600
                          to-green-500
                          px-5
                          py-2
                          font-extrabold
                          !text-white
                          shadow-lg
                          transition
                          hover:scale-105
                        "
                      >
                        เปิด
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr>
              <td
                colSpan={6}
                className="
                  h-0
                  border-0
                  border-b-2
                  border-b-black
                  bg-white
                  p-0
                "
              />
            </tr>
          </tfoot>
        </table>
      </div>