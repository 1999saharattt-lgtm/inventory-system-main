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

  const [error, setError] =
    useState("");

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
        setError("");
        setQrCode("");

        /* =====================================================
           URL สำหรับ Stock Card PDF
        ===================================================== */

        const url = new URL(
          `/stock-card/material/${materialId}/pdf`,
          window.location.origin
        ).toString();

        /* =====================================================
           Generate QR Code
        ===================================================== */

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

        if (!mounted) {
          return;
        }

        setQrCode(dataUrl);
      } catch (error) {
        console.error(
          "ไม่สามารถสร้าง QR Code ได้:",
          error
        );

        if (!mounted) {
          return;
        }

        setQrCode("");
        setError(
          "ไม่สามารถสร้าง QR Code ได้"
        );
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
     ESC / BODY SCROLL
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
     OPEN
  ========================================================= */

  function handleOpen() {
    setOpen(true);
  }

  /* =========================================================
     CLOSE
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
          OPEN QR BUTTON

          ใช้สีจาก AppButton กลาง
          ปุ่ม "เปิด" = primary
          ไม่มี Emoji / Icon
      ===================================================== */}

      <AppButton
        type="button"
        variant="primary"
        size="sm"
        onClick={handleOpen}
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
              rounded-[30px]
              border
              border-slate-300
              bg-white
              shadow-[0_30px_100px_-30px_rgba(15,23,42,0.65)]
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
                border-2
                !border-black
                bg-white
                text-xl
                font-black
                !text-slate-900
                shadow-sm
                transition-all
                duration-200

                hover:bg-slate-100

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
                border-slate-200
                px-6
                pb-5
                pt-8
                text-center
                sm:px-8
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

              {/* ===============================================
                  MATERIAL CODE
              =============================================== */}

              <div
                className="
                  mx-auto
                  mt-4
                  max-w-[330px]
                  rounded-[14px]
                  border-2
                  !border-black
                  bg-white
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    !text-slate-500
                  "
                >
                  รหัสพัสดุ
                </p>

                <p
                  className="
                    mt-1
                    break-words
                    font-extrabold
                    !text-slate-900
                  "
                >
                  {materialCode}
                </p>
              </div>

              {/* ===============================================
                  MATERIAL NAME
              =============================================== */}

              <div
                className="
                  mx-auto
                  mt-3
                  max-w-[330px]
                  rounded-[14px]
                  border-2
                  !border-black
                  bg-white
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    !text-slate-500
                  "
                >
                  รายการพัสดุ
                </p>

                <p
                  className="
                    mt-1
                    break-words
                    font-extrabold
                    !text-slate-900
                  "
                >
                  {materialName}
                </p>
              </div>
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
                  rounded-[24px]
                  border-2
                  !border-black
                  bg-white
                  p-4
                "
              >
                {/* ===============================================
                    LOADING
                =============================================== */}

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
                      className="
                        h-10
                        w-10
                        animate-spin
                        rounded-full
                        border-4
                        border-slate-200
                        border-t-slate-900
                      "
                    />

                    <p
                      className="
                        text-sm
                        font-extrabold
                        !text-slate-600
                      "
                    >
                      กำลังสร้าง QR Code...
                    </p>
                  </div>
                )}

                {/* ===============================================
                    QR IMAGE
                =============================================== */}

                {!isGenerating &&
                  qrCode && (
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
                  )}

                {/* ===============================================
                    ERROR
                =============================================== */}

                {!isGenerating &&
                  !qrCode && (
                    <div
                      className="
                        px-5
                        text-center
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-extrabold
                          !text-red-600
                        "
                      >
                        {error ||
                          "ไม่พบข้อมูล QR Code"}
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
                  rounded-[16px]
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
                  "
                >
                  สแกน QR Code
                  เพื่อเปิดบัญชีพัสดุ
                </p>
              </div>

              {/* =================================================
                  CLOSE

                  ใช้ AppButton กลาง
              ================================================= */}

              <div className="mt-5">
                <AppButton
                  type="button"
                  variant="secondary"
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