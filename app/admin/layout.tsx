import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin/conversations" className="text-lg font-semibold">
            Studio Admin
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin/conversations"
                className="text-gray-600 hover:text-black"
              >
                Conversations
              </Link>
              <Link
                href="/admin/corrections"
                className="text-gray-600 hover:text-black"
              >
                Corrections
              </Link>
            </nav>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
