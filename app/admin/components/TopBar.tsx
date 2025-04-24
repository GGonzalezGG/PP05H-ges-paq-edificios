// components/TopBar.tsx

export default function TopBar() {
    return (
      <div className="flex items-center justify-between bg-white p-4 shadow-md">
        <div className="flex items-center space-x-3 cursor-pointer text-gray-600 hover:text-black">
          <span className="text-xl">🔍 Buscar</span>
        </div>
        <button className="p-2 bg-blue-600 border-3 rounded-md border-black text-white hover:bg-blue-700 font-medium">
          Cerrar sesión
        </button>
      </div>
    );
  }
  
