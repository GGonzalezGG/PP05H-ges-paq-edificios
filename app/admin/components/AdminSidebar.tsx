import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg hidden sm:block">
      <div className="h-full flex flex-col p-6 space-y-4">
        <h2 className="text-xl font-bold text-blue-600">Panel Admin</h2>
        <nav className="flex flex-col space-y-2">
          <Link href="/admin/apartment-data" className="text-gray-700 hover:text-blue-600">📘 Datos de Departamentos</Link>
          <Link href="/admin/history" className="text-gray-700 hover:text-blue-600">📦 Historial de Paquetes</Link>
          <span className="text-gray-400">➕ Más funcionalidades</span>
        </nav>
      </div>
    </aside>
  );
}
