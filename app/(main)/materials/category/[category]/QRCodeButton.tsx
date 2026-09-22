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
    useState("");

  const [isGenerating, setIsGenerating] =
    useState(false);

  /* =========================================================
     GENERATE QR CODE
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    async function generateQRCode() {
      try {
        setIsGenerating(true);

        const url = new URL(
          `/stock-card/material/${materialId}/pdf`,
          window.location.origin
        ).toString();

        const dataUrl =
          await QRCode.toDataURL(url, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: "H",
          });

        if (mounted) {
          setQrCode(dataUrl);
        }
      } catch (error) {
        console.error(
          "ไม่สามารถสร้าง QR Code ได้:",
          error
        );

        if (mounted) {
          setQrCode("");
        }
      } finally {
        if (mounted) {
          setIsGenerating(false);
        }
      }
    }

    generateQRCode();

    return () => {
      mounted = false;
    };
  }, [open, materialId]);

  /* =========================================================
     KEYBOARD / BODY SCROLL
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

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
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          OPEN BUTTON
          สีมาจาก AppButton กลางเท่านั้น
      ===================================================== */}

      <AppButton
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setOpen(true)}
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
            animate-in
            fade-in
            duration-200
            sm:p-6
          "
          onClick={() =>
            setOpen(false)
          }
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
              border-black
              bg-white/95
              shadow-[0_32px_100px_-28px_rgba(15,23,42,0.65)]
              backdrop-blur-2xl
              animate-in
              zoom-in-95
              slide-in-from-bottom-3
              duration-300
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* ===============================================
                AMBIENT GLOW
            =============================================== */}

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

            {/* ===============================================
                MOBILE HANDLE
            =============================================== */}

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

            {/* ===============================================
                ICON CLOSE CONTROL
            =============================================== */}

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
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
                border-black
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

            {/* ===============================================
                HEADER
            =============================================== */}

            <div
              className="
                relative
                border-b
                border-black
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

              {/* =============================================
                  MATERIAL CODE
              ============================================= */}

              <div
                className="
                  mx-auto
                  mt-3
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-black
                  bg-slate-100/80
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

            {/* ===============================================
                CONTENT
            =============================================== */}

            <div
              className="
                relative
                px-6
                py-6
                sm:px-8
              "
            >
              {/* =============================================
                  QR CARD
              ============================================= */}

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
                  border
                  border-black
                  bg-white
                  p-4
                  shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]
                "
              >
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt={`QR Code ${materialCode}`}
                    className="
                      h-full
                      w-full
                      object-contain
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-full
                      w-full
                      flex-col
                      items-center
                      justify-center
                      gap-4
                    "
                  >
                    {isGenerating && (
                      <div
                        aria-hidden="true"
                        className="
                          h-9
                          w-9
                          animate-spin
                          rounded-full
                          border-[3px]
                          border-slate-200
                          border-t-slate-800
                        "
                      />
                    )}

                    <span
                      className="
                        px-4
                        text-center
                        text-sm
                        font-extrabold
                        leading-relaxed
                        !text-slate-500
                      "
                    >
                      {isGenerating
                        ? "กำลังสร้าง QR Code..."
                        : "ไม่สามารถสร้าง QR Code ได้"}
                    </span>
                  </div>
                )}
              </div>

              {/* =============================================
                  DESCRIPTION
              ============================================= */}

              <div
                className="
                  mx-auto
                  mt-5
                  max-w-[310px]
                  rounded-[18px]
                  border
                  border-black
                  bg-slate-50/90
                  px-4
                  py-3
                  text-center
                  shadow-inner
                "
              >
                <p
                  className="
                    text-sm
                    font-extrabold
                    leading-relaxed
                    !text-slate-600
                    sm:text-base
                  "
                >
                  สแกน QR Code
                  เพื่อเปิดบัญชีพัสดุ
                </p>
              </div>

              {/* =============================================
                  CLOSE BUTTON
                  ใช้สีจาก AppButton กลาง
              ============================================= */}

              <div className="mt-5">
                <AppButton
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() =>
                    setOpen(false)
                  }
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