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
      <Sidebar role={user.role} />

      <div className="min-w-0">
        <Header />

        <main
          className="
            min-w-0
            p-3
            bg-white
            min-h-screen
            overflow-x-hidden
            sm:p-4
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}