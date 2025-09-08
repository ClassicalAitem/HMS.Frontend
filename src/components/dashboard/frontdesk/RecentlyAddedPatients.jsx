import React from 'react';

const RecentlyAddedPatients = () => {
  const patients = [
    {
      id: '01',
      name: 'Jane Cooper',
      gender: 'F',
      age: 36,
      phone: '(217) 555-0113',
      address: '6391 Elgin St. Celina, Delaware 10299',
      status: 'Urgent',
      statusColor: 'bg-orange-500'
    },
    {
      id: '02',
      name: 'Theresa Webb',
      gender: 'F',
      age: 36,
      phone: '(207) 555-0119',
      address: '2118 Thornridge Syracuse, 35624',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '03',
      name: 'Albert Flores',
      gender: 'F',
      age: 36,
      phone: '(217) 555-0113',
      address: '3891 Ranchview Richardson,California',
      status: 'Emergency',
      statusColor: 'bg-red-500'
    },
    {
      id: '04',
      name: 'Robert Fox',
      gender: 'M',
      age: 36,
      phone: '(480) 555-0103',
      address: '3891 Ranchview Richardson,California',
      status: 'Passaway',
      statusColor: 'bg-gray-500'
    },
    {
      id: '05',
      name: 'Savannah Nguyen',
      gender: 'F',
      age: 36,
      phone: '(209) 555-0104',
      address: '6391 Elgin St. Celina, Delaware 10299',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '06',
      name: 'Annette Black',
      gender: 'F',
      age: 36,
      phone: '(225) 555-0118',
      address: '2118 Thornridge Syracuse, 35624',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '07',
      name: 'Robert Fox',
      gender: 'M',
      age: 36,
      phone: '(270) 555-0117',
      address: '3891 Ranchview Richardson,California',
      status: 'Emergency',
      statusColor: 'bg-red-500'
    },
    {
      id: '08',
      name: 'Brooklyn Simmons',
      gender: 'M',
      age: 36,
      phone: '(316) 555-0116',
      address: '3891 Ranchview Richardson,California',
      status: 'Passaway',
      statusColor: 'bg-gray-500'
    },
    {
      id: '09',
      name: 'Jacob Jones',
      gender: 'M',
      age: 36,
      phone: '(702) 555-0122',
      address: '3891 Ranchview Richardson,California',
      status: 'Urgent',
      statusColor: 'bg-orange-500'
    },
    {
      id: '10',
      name: 'Annette Black',
      gender: 'F',
      age: 36,
      phone: '(319) 555-0115',
      address: '3891 Ranchview Richardson,California',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '11',
      name: 'Savannah Nguyen',
      gender: 'F',
      age: 36,
      phone: '(316) 555-0116',
      address: '3891 Ranchview Richardson,California',
      status: 'Emergency',
      statusColor: 'bg-red-500'
    }
  ];

  const StatusBadge = ({ status, color }) => {
    const getBadgeClass = (status) => {
      switch (status) {
        case 'Urgent':
          return 'badge badge-warning';
        case 'Emergency':
          return 'badge badge-error';
        case 'Not Urgent':
          return 'badge badge-success';
        case 'Passaway':
          return 'badge badge-neutral';
        default:
          return 'badge badge-info';
      }
    };

    return (
      <span className={getBadgeClass(status)}>
        {status}
      </span>
    );
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      {/* Header */}
      <div className="card-body pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Recently Added Patients</h3>
          <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            See All
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                S/n
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="hover">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                  {patient.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-base-content">
                  {patient.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                  {patient.gender}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                  {patient.age}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                  {patient.phone}
                </td>
                <td className="px-6 py-4 text-sm text-base-content/70 max-w-xs truncate">
                  {patient.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                  <StatusBadge status={patient.status} color={patient.statusColor} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default RecentlyAddedPatients;
