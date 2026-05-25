import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#eef3fb] text-ink">
      <Navbar />
      <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <Sidebar />
        <main className="min-w-0 pb-6">{children}</main>
      </div>
    </div>
  );
}
