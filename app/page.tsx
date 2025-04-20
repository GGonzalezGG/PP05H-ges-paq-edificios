import Link from 'next/link';

const routes = [
  { path: '/user', label: 'User Dashboard' },
  { path: '/admin', label: 'Admin Panel' },
  { path: '/login', label: 'Login' }
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.jpg')" }}>
      <div className="bg-white bg-opacity-80 shadow-xl rounded-2xl p-10 max-w-xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">E E E soy sans</h1>
        <p className="text-gray-500">Sitios:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {routes.map(({ path, label }) => (
            <Link
              key={path}
              href={path}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-300"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
