'use client';

import { useRouter } from 'next/navigation';

export default function Header({ apartmentNumber }: { apartmentNumber: string }) {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center">
      <button
        onClick={() => router.push('/login')}
        className="text-sm text-white bg-red-500 px-3 py-1 rounded hover:bg-red-600"
      >
        Logout
      </button>
      <div className="text-center text-3xl font-medium text-gray-700">
        Apartment {apartmentNumber}
      </div>
      <button
        onClick={() => router.push('/user/history')}
        className="text-sm text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
      >
        History
      </button>
    </div>
  );
}
