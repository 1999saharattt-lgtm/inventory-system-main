"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

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

  useEffect(() => {
    if (!open) return;

    const generateQRCode = async () => {
      const url = `${window.location.origin}/stock-card/material/${materialId}/pdf`;

      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setQrCode(dataUrl);
    };

    generateQRCode();
  }, [open, materialId]);

  return (
    <>
      {/* ปุ่มเปิด QR */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          rounded-lg
          bg-blue-600
          px-4
          py-2
          font-extrabold
          text-white
          shadow
          transition
          hover:bg-blue-700
        "
      >
        เปิด
      </button>

      {/* Modal QR Code */}
      {open && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/60
            p-4
          "
          onClick={() => setOpen(false)}
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900">
                QR Code พัสดุ
              </h2>

              <p className="mt-2 text-lg font-bold text-slate-700">
                รหัสพัสดุ : {materialCode}
              </p>

              <p className="mt-1 text-lg font-bold text-slate-700">
                {materialName}
              </p>
            </div>

            {/* QR */}
            <div className="flex justify-center">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt={`QR Code ${materialCode}`}
                  className="h-80 w-80"
                />
              ) : (
                <div className="flex h-80 w-80 items-center justify-center">
                  <span className="font-bold text-slate-500">
                    กำลังสร้าง QR Code...
                  </span>
                </div>
              )}
            </div>

            {/* คำอธิบาย */}
            <p className="mt-4 text-center text-base font-semibold text-slate-600">
              สแกน QR Code เพื่อเปิดบัญชีพัสดุ
            </p>

            {/* ปุ่มปิด */}
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                  rounded-xl
                  bg-slate-800
                  px-8
                  py-3
                  font-extrabold
                  text-white
                  shadow
                  transition
                  hover:bg-slate-700
                "
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
