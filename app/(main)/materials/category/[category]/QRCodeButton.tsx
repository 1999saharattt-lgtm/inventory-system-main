"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  materialId: number;
};

export default function QRCodeButton({
  materialId,
}: Props) {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    const generateQRCode = async () => {
      const url = `${window.location.origin}/stock-card/material/${materialId}/pdf`;

      const dataUrl = await QRCode.toDataURL(url, {
        width: 180,
        margin: 2,
      });

      setQrCode(dataUrl);
    };

    generateQRCode();
  }, [materialId]);

  if (!qrCode) {
    return null;
  }

  function openQRCode() {
    const newWindow = window.open(
      "",
      "_blank",
      "width=500,height=600"
    );

    if (!newWindow) {
      return;
    }

    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code</title>
        </head>

        <body
          style="
            margin:0;
            padding:30px;
            text-align:center;
            font-family:Arial,sans-serif;
          "
        >
          <h2>QR Code</h2>

          <p>
            สแกนเพื่อดูบัญชีพัสดุ
          </p>

          <img
            src="${qrCode}"
            style="width:300px;height:300px;"
          />

          <p>
            รหัสพัสดุ: ${materialId}
          </p>
        </body>
      </html>
    `);

    newWindow.document.close();
  }

  return (
    <button
      type="button"
      onClick={openQRCode}
      title="เปิด QR Code"
      className="
        rounded-lg
        border
        border-slate-300
        bg-white
        p-2
        shadow
        transition
        hover:scale-105
        hover:shadow-lg
      "
    >
      <img
        src={qrCode}
        alt="QR Code"
        className="h-20 w-20"
      />
    </button>
  );
}