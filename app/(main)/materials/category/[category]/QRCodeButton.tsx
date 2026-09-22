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
  const [open, setOpen] =
    useState(false);

  const [qrCode, setQrCode] =
    useState("");

  const [isGenerating, setIsGenerating] =
    useState(false);

  /* =========================================================
     GENERATE QR CODE
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const generateQRCode =
      async () => {
        try {
          setIsGenerating(true);
          setQrCode("");

          /* ===============================================
             URL เดิมที่เคยใช้งานได้
          =============================================== */

          const url = new URL(
            `/stock-card/material/${materialId}/pdf`,
            window.location.origin
          ).toString();

          /* ===============================================
             GENERATE QR CODE
          =============================================== */

          const dataUrl =
            await QRCode.toDataURL(
              url,
              {
                width: 400,
                margin: 2,
                errorCorrectionLevel:
                  "H",
              }
            );

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
      };

    generateQRCode();

    return () => {
      mounted = false;
    };
  }, [open, materialId]);

  /* =========================================================
     KEYBOARD / BODY SCROLL
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

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
     UI
  ========================================================= */

  return (
    <>
      {/* =====================================================
          OPEN BUTTON
          เหลือเฉพาะคำว่า "เปิด"
          สีใช้จาก AppButton กลาง
      ===================================================== */}

      <AppButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setOpen(true)
        }
        aria-label={`เปิด QR Code ${materialCode}`}
      >
        เปิด
      </AppButton>

      {/* =====================================================
          QR MODAL
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
            bg-slate-950/45
            p-4
            backdrop-blur-md
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
              rounded-[30px]
              border
              border-slate-300
              bg-white/95
              shadow-[0_30px_100px_-30px_rgba(15,23,42,0.65)]
              backdrop-blur-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* =================================================
                MOBILE HANDLE
            ================================================= */}

            <div
              className="
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
                CLOSE
            ================================================= */}

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
                z-10
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-black
                bg-slate-100
                p-0
                text-lg
                font-black
                !text-slate-600
                shadow-sm
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
                border-b
                border-slate-300
                px-6
                pb-5
                pt-7
                text-center
                sm:px-8
                sm:pt-8
              "
            >
              <h2
                id="qr-modal-title"
                className="
                  text-2xl
                  font-black
                  tracking-tight
                  !text-slate-900
                "
              >
                QR Code พัสดุ
              </h2>

              <p
                className="
                  mt-3
                  text-sm
                  font-extrabold
                  !text-slate-500
                  sm:text-base
                "
              >
                รหัสพัสดุ :{" "}
                {materialCode}
              </p>

              <p
                className="
                  mt-1
                  break-words
                  text-base
                  font-extrabold
                  leading-snug
                  !text-slate-700
                  sm:text-lg
                "
              >
                {materialName}
              </p>
            </div>

            {/* =================================================
                QR CONTENT
            ================================================= */}

            <div
              className="
                px-6
                py-6
                sm:px-8
              "
            >
              {/* =================================================
                  QR CODE BOX
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
                  !border-black
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
                      block
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
                      gap-3
                    "
                  >
                    {isGenerating && (
                      <div
                        className="
                          h-8
                          w-8
                          animate-spin
                          rounded-full
                          border-[3px]
                          border-slate-200
                          border-t-slate-900
                        "
                      />
                    )}

                    <span
                      className="
                        text-center
                        text-sm
                        font-extrabold
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
                  !border-black
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
                  ใช้สีจาก AppButton กลาง
              ================================================= */}

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