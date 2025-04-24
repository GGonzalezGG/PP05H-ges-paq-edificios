import AdminSidebar from './components/AdminSidebar';
import TopBar from './components/TopBar';
import PackageList from './components/PackageList';

export default function AdminPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Paquetes Pendientes</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
              + Nuevo Paquete
            </button>
          </div>
          <PackageList />
        </main>
      </div>
    </div>
  );
}
