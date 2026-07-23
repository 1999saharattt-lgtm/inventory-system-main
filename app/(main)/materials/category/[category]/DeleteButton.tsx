"use client";

type Props = {
  id: number;
};

export default function DeleteButton({ id }: Props) {
  async function handleDelete() {
    const ok = confirm("ต้องการลบพัสดุนี้ใช่หรือไม่?");

    if (!ok) return;

    const res = await fetch(`/api/materials/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("ลบสำเร็จ");
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.message ?? "ลบไม่สำเร็จ");
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
    >
      ลบ
    </button>
  );
}