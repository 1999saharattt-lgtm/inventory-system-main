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
    if (!open) {
      return;
    }

    let mounted = true;

    async function generateQRCode() {
      try {
        setIsGenerating(true);
        setQrCode("");

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
      ===================================================== */}

      <AppButton
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`เปิด QR Code ${materialCode}`}
      >
        เปิด
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
            z-[9999]
            flex
            min-h-screen
            w-screen
            items-center
            justify-center
            overflow-y-auto
            bg-slate-950/50
            p-4
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
              z-[10000]
              w-full
              max-w-[440px]
              overflow-hidden
              rounded-[30px]
              border
              border-black
              bg-white
              shadow-[0_30px_100px_-30px_rgba(15,23,42,0.75)]
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* =================================================
                CLOSE X
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
                z-[10001]
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-black
                bg-white
                text-xl
                font-black
                leading-none
                !text-slate-700
                shadow-sm
                transition-all
                duration-200

                hover:bg-slate-100
                hover:!text-slate-950

                active:scale-95
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
                border-black
                bg-slate-50
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
                  pr-10
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
                  mt-4
                  flex
                  w-fit
                  items-center
                  justify-center
                  rounded-[12px]
                  border
                  border-black
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-extrabold
                  !text-slate-900
                "
              >
                รหัสพัสดุ :{" "}
                {materialCode}
              </div>

              {/* =============================================
                  MATERIAL NAME
              ============================================= */}

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-[340px]
                  break-words
                  text-base
                  font-extrabold
                  leading-relaxed
                  !text-slate-800
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
                bg-white
                px-6
                py-6
                sm:px-8
              "
            >
              {/* =============================================
                  QR CODE
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
                  rounded-[22px]
                  border
                  border-black
                  bg-white
                  p-4
                  shadow-sm
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
                      gap-4
                    "
                  >
                    {isGenerating && (
                      <div
                        aria-hidden="true"
                        className="
                          h-10
                          w-10
                          animate-spin
                          rounded-full
                          border-4
                          border-slate-200
                          border-t-blue-600
                        "
                      />
                    )}

                    <p
                      className="
                        text-center
                        text-sm
                        font-extrabold
                        !text-slate-600
                      "
                    >
                      {isGenerating
                        ? "กำลังสร้าง QR Code..."
                        : "ไม่สามารถสร้าง QR Code ได้"}
                    </p>
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
                  rounded-[16px]
                  border
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

              {/* =============================================
                  CLOSE BUTTON
              ============================================= */}

              <div className="mt-5">
                <AppButton
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() =>
                    setOpen(false)
                  }
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