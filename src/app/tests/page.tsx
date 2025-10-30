// app/tests/page.tsx
import Link from 'next/link';
import { localPrisma } from '../lib/db/local-client';
import { TestWithRelations } from '../types';
import { TestStatus } from '@prisma/client';

export default async function TestsPage() {
  const tests = await localPrisma.test.findMany({
    where: { is_deleted: false },
    include: {
      patient: true,
      doctor: true,
    },
    orderBy: { created_at: 'desc' },
  }) as TestWithRelations[];

  const getStatusBadge = (status: TestStatus) => {
    const statusConfig = {
      [TestStatus.Pending]: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
      [TestStatus.InProgress]: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      [TestStatus.Completed]: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      [TestStatus.Cancelled]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig[TestStatus.Pending];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laboratory Tests</h1>
            <p className="text-gray-600 mt-2">Manage and track laboratory tests</p>
          </div>
          <Link
            href="/tests/create"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Test
          </Link>
        </div>

        {/* Tests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referring Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{test.test_type}</div>
                    {test.test_code && (
                      <div className="text-sm text-gray-500">Code: {test.test_code}</div>
                    )}
                    {test.units && (
                      <div className="text-sm text-gray-500">Units: {test.units}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/patients/${test.patient.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      {test.patient.name}
                    </Link>
                    {test.patient.phone && (
                      <div className="text-sm text-gray-500">{test.patient.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {test.doctor ? (
                      <Link
                        href={`/doctors/${test.doctor.id}`}
                        className="text-sm font-medium text-green-600 hover:text-green-900"
                      >
                        Dr. {test.doctor.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-500">Not specified</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(test.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(test.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/tests/${test.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/tests/${test.id}/edit`}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/tests/${test.id}/report`}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No tests found</div>
              <Link
                href="/tests/create"
                className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add your first test
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.status === TestStatus.Completed).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.status === TestStatus.InProgress).length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.status === TestStatus.Pending).length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}