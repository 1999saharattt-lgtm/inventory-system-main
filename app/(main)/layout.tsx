import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />


      <div
        className="
          flex-1
          min-w-0
        "
      >

        <Header />


        <main
          className="
            p-8
            bg-white
            min-h-screen
            overflow-x-auto
          "
        >
          {children}
        </main>


      </div>


    </div>
  );
}