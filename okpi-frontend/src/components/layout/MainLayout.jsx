import Footer from "./Footer";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(112,139,117,0.18),_transparent_35%),linear-gradient(180deg,_#f4efe6_0%,_#f7f3ed_100%)]">
      <Navbar />
      <div className="page-shell grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar />
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
