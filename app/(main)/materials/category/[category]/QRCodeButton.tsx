"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import AppButton from "@/components/AppButton";

type Props = {
  materialId: number;
  materialCode: string;
  materialName: string;
};

export default function QRCodeButton({
  materialId,
  materialCode,
  materialName,
}: Props) {
  const [open, setOpen] = useState(false);

  const [qrCode, setQrCode] =
    useState<string>("");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [hasError, setHasError] =
    useState(false);

  /* =========================================================
     GENERATE QR CODE
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function generateQRCode() {
      try {
        setIsGenerating(true);
        setHasError(false);
        setQrCode("");

        /* -----------------------------------------------------
           URL ที่ QR Code จะเปิด
        ----------------------------------------------------- */

        const targetUrl =
          `${window.location.origin}` +
          `/stock-card/material/${materialId}/pdf`;

        /* -----------------------------------------------------
           Generate QR
        ----------------------------------------------------- */

        const dataUrl =
          await QRCode.toDataURL(
            targetUrl,
            {
              width: 500,
              margin: 2,
              errorCorrectionLevel: "H",

              color: {
                dark: "#000000",
                light: "#ffffff",
              },
            }
          );

        if (cancelled) return;

        setQrCode(dataUrl);
      } catch (error) {
        console.error(
          "ไม่สามารถสร้าง QR Code ได้:",
          error
        );

        if (cancelled) return;

        setQrCode("");
        setHasError(true);
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }

    generateQRCode();

    return () => {
      cancelled = true;
    };
  }, [open, materialId]);

  /* =========================================================
     BODY SCROLL + ESC
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  /* =========================================================
     OPEN MODAL
  ========================================================= */

  function handleOpen() {
    setQrCode("");
    setHasError(false);
    setOpen(true);
  }

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  function handleClose() {
    setOpen(false);
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      {/* =====================================================
          OPEN BUTTON
          สีมาจาก AppButton กลาง
      ===================================================== */}

      <AppButton
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        aria-label={`เปิด QR Code ${materialCode}`}
      >
        <span aria-hidden="true">
          ▦
        </span>

        <span>เปิด</span>
      </AppButton>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-center
            justify-center
            overflow-y-auto
            bg-slate-950/40
            p-4
            backdrop-blur-md
            sm:p-6
          "
          onClick={handleClose}
        >
          {/* =================================================
              MODAL CARD
          ================================================= */}

          <div
            className="
              relative
              w-full
              max-w-[440px]
              overflow-hidden
              rounded-[32px]
              border
              border-white/80
              bg-white/95
              shadow-[0_32px_100px_-28px_rgba(15,23,42,0.65)]
              backdrop-blur-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* =================================================
                AMBIENT
            ================================================= */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-52
                w-52
                rounded-full
                bg-blue-400/10
                blur-3xl
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-24
                -left-20
                h-52
                w-52
                rounded-full
                bg-cyan-400/[0.08]
                blur-3xl
              "
            />

            {/* =================================================
                MOBILE HANDLE
            ================================================= */}

            <div
              className="
                relative
                flex
                justify-center
                pt-3
                sm:hidden
              "
            >
              <div
                className="
                  h-1.5
                  w-10
                  rounded-full
                  bg-slate-300
                "
              />
            </div>

            {/* =================================================
                CLOSE ICON
            ================================================= */}

            <button
              type="button"
              onClick={handleClose}
              aria-label="ปิด"
              className="
                absolute
                right-4
                top-4
                z-20
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-slate-100/90
                p-0
                text-xl
                font-black
                leading-none
                !text-slate-500
                shadow-sm
                backdrop-blur-xl
                transition-all
                duration-200

                hover:bg-slate-200
                hover:!text-slate-900

                active:scale-[0.9]
              "
            >
              ×
            </button>

            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                relative
                border-b
                border-slate-200/80
                px-6
                pb-5
                pt-8
                text-center
                sm:px-8
                sm:pt-9
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-[20px]
                  bg-gradient-to-br
                  from-slate-800
                  to-slate-950
                  text-3xl
                  !text-white
                  shadow-[0_18px_34px_-18px_rgba(15,23,42,0.7)]
                  ring-1
                  ring-white/20
                "
              >
                ▦
              </div>

              <h2
                id="qr-modal-title"
                className="
                  mt-4
                  text-2xl
                  font-black
                  tracking-tight
                  !text-slate-900
                "
              >
                QR Code พัสดุ
              </h2>

              {/* Material Code */}

              <div
                className="
                  mx-auto
                  mt-3
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-300
                  bg-slate-100
                  px-3.5
                  py-1.5
                  text-sm
                  font-extrabold
                  !text-slate-700
                  shadow-sm
                "
              >
                รหัสพัสดุ :{" "}
                {materialCode}
              </div>

              {/* Material Name */}

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-[330px]
                  break-words
                  text-base
                  font-extrabold
                  leading-relaxed
                  !text-slate-700
                  sm:text-lg
                "
              >
                {materialName}
              </p>
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div
              className="
                relative
                px-6
                py-6
                sm:px-8
              "
            >
              {/* =================================================
                  QR CONTAINER
              ================================================= */}

              <div
                className="
                  mx-auto
                  flex
                  aspect-square
                  w-full
                  max-w-[310px]
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-[26px]
                  border-2
                  border-black
                  bg-white
                  p-4
                  shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]
                "
              >
                {/* =============================================
                    LOADING
                ============================================= */}

                {isGenerating && (
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      gap-4
                    "
                  >
                    <div
                      aria-hidden="true"
                      className="
                        h-10
                        w-10
                        animate-spin
                        rounded-full
                        border-[3px]
                        border-slate-200
                        border-t-slate-900
                      "
                    />

                    <p
                      className="
                        text-sm
                        font-extrabold
                        !text-slate-500
                      "
                    >
                      กำลังสร้าง QR Code...
                    </p>
                  </div>
                )}

                {/* =============================================
                    QR CODE
                ============================================= */}

                {!isGenerating &&
                  qrCode && (
                    <img
                      src={qrCode}
                      alt={`QR Code ${materialCode}`}
                      width={500}
                      height={500}
                      className="
                        block
                        h-full
                        w-full
                        object-contain
                      "
                    />
                  )}

                {/* =============================================
                    ERROR
                ============================================= */}

                {!isGenerating &&
                  !qrCode &&
                  hasError && (
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-3
                        px-5
                        text-center
                      "
                    >
                      <span
                        className="
                          text-3xl
                        "
                      >
                        ⚠️
                      </span>

                      <p
                        className="
                          text-sm
                          font-extrabold
                          leading-relaxed
                          !text-red-600
                        "
                      >
                        ไม่สามารถสร้าง QR Code ได้
                      </p>
                    </div>
                  )}
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div
                className="
                  mx-auto
                  mt-5
                  max-w-[310px]
                  rounded-[18px]
                  border-2
                  border-black
                  bg-slate-50
                  px-4
                  py-3
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-extrabold
                    leading-relaxed
                    !text-slate-700
                    sm:text-base
                  "
                >
                  สแกน QR Code
                  เพื่อเปิดบัญชีพัสดุ
                </p>
              </div>

              {/* =================================================
                  CLOSE BUTTON
                  ใช้ AppButton กลาง
              ================================================= */}

              <div className="mt-5">
                <AppButton
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleClose}
                  fullWidth
                >
                  ปิด
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}