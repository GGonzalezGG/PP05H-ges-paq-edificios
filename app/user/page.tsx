import Header from '@app/user/components/Header';
import PackageList from '@app/user/components/PackageList';

export default function UserDashboard() {
  // Replace this with dynamic apartment number later
  const apartmentNumber = '906';

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <Header apartmentNumber={apartmentNumber} />
      <div className="max-w-3xl mx-auto mt-8">
        <h2 className="text-xl text-black mb-4 text-center">Current Packages</h2>
        <PackageList />
      </div>
    </main>
  );
}
