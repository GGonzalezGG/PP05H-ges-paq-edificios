export default function PackageList() {
    const packages = [
      { apartment: "906", receivedDate: "2025-04-22" },
      { apartment: "705", receivedDate: "2025-04-21" },
    ];
  
    return (
      <div className="bg-white shadow-md rounded-lg p-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="pb-2">Departamento</th>
              <th className="pb-2">Fecha de recepción</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, i) => (
              <tr key={i} className="text-gray-700 border-b last:border-none">
                <td className="py-2">{pkg.apartment}</td>
                <td className="py-2">{pkg.receivedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  