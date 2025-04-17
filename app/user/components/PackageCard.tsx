export default function PackageCard({ pkg }: { pkg: { id: string; sender: string; receivedDate: string } }) {
    return (
      <div className="bg-white shadow p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-black">From: {pkg.sender}</p>
            <p className="text-sm text-gray-500">Received: {pkg.receivedDate}</p>
          </div>
          <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
            Withdraw
          </button>
        </div>
      </div>
    );
  }
  