import AdminNavbar from "@/components/layout/nav-bar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>
    <AdminNavbar />
    {children}
  </>
    ;
}
