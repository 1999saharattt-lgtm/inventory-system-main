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
  const [qrCode, setQrCode] = useState("");
  const [isGenerating, setIsGenerating] =
    useState(false);

  /* =========================================================
     Generate QR Code
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const generateQRCode = async () => {
      try {
        setIsGenerating(true);

        const url = new URL(
          `/stock-card/material/${materialId}/pdf`,
          window.location.origin
        ).toString();

        const dataUrl = await QRCode.toDataURL(url, {
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
    };

    generateQRCode();

    return () => {
      mounted = false;
    };
  }, [open, materialId]);

  /* =========================================================
     Keyboard / Body Scroll
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

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

  return (
    <>
      {/* =====================================================
          OPEN BUTTON
          ใช้ Component กลาง
      ===================================================== */}

      <AppButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`เปิด QR Code ${materialCode}`}
      >
        <span>▦</span>
        <span>เปิด</span>
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
            animate-in
            fade-in
            duration-200
            sm:p-6
          "
          onClick={() => setOpen(false)}
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
              animate-in
              zoom-in-95
              slide-in-from-bottom-3
              duration-300
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* =================================================
                TOP HANDLE
            ================================================= */}

            <div className="flex justify-center pt-3 sm:hidden">
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
                X CLOSE BUTTON

                ปุ่มนี้เป็น Icon Control เฉพาะ Modal
                จึงคงเป็น button ปกติ
            ================================================= */}

            <button
              type="button"
              onClick={() => setOpen(false)}
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
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-[18px]
                  bg-gradient-to-br
                  from-blue-500
                  to-blue-600
                  text-2xl
                  text-white
                  shadow-[0_14px_28px_-14px_rgba(59,130,246,0.65)]
                  ring-1
                  ring-white/30
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

              <p
                className="
                  mt-2
                  text-sm
                  font-extrabold
                  !text-slate-500
                  sm:text-base
                "
              >
                รหัสพัสดุ : {materialCode}
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
                QR CODE
            ================================================= */}

            <div className="px-6 py-6 sm:px-8">
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
                          border-blue-100
                          border-t-blue-500
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
                  border
                  border-black
                  bg-blue-50/80
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
                    !text-blue-700
                    sm:text-base
                  "
                >
                  สแกน QR Code เพื่อเปิดบัญชีพัสดุ
                </p>
              </div>

              {/* =================================================
                  CLOSE BUTTON
                  ใช้ Component กลาง
              ================================================= */}

              <div className="mt-5">
                <AppButton
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setOpen(false)}
                  className="w-full"
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