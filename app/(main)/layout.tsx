import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { requireLogin } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireLogin();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header: โลโก้ + ชื่อระบบ */}
      <Header />

      {/* Navigation: เมนูหลัก ติดกับ Header */}
      <Sidebar role={user.role} />

      {/* Content */}
      <main
        className="
          min-w-0
          bg-white
          min-h-screen
          overflow-x-hidden
          p-3
          sm:p-4
        "
      >
        {children}
      </main>
    </div>
  );
}