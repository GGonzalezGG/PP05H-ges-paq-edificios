import PackageCard from '@app/user/components/PackageCard';

// Dummy data — replace with real data from API or DB
const dummyPackages = [
  { id: '1', sender: 'Amazon', receivedDate: '2025-04-10' },
  { id: '2', sender: 'Shein', receivedDate: '2025-04-12' },
];

export default function PackageList() {
  return (
    <div>
      {dummyPackages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}
