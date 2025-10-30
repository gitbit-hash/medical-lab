// app/tests/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { localPrisma } from '../../lib/db/local-client';
import { TestWithRelations } from '../../types';
import { TestStatus } from '@prisma/client';

interface TestDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const test = await localPrisma.test.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: true,
    },
  }) as TestWithRelations | null;

  if (!test || test.is_deleted) {
    notFound();
  }

  const getStatusConfig = (status: TestStatus) => {
    const config = {
      [TestStatus.Pending]: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
      [TestStatus.InProgress]: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      [TestStatus.Completed]: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      [TestStatus.Cancelled]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    return config[status] || config[TestStatus.Pending];
  };

  const statusConfig = getStatusConfig(test.status);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/tests"
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Tests
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{test.test_type}</h1>
              {test.test_code && (
                <p className="text-xl text-gray-600 mt-1">Code: {test.test_code}</p>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/tests/${test.id}/edit`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Edit Test
              </Link>
              <Link
                href={`/tests/${test.id}/report`}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Generate Report
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Type</label>
                  <p className="mt-1 text-sm text-gray-900">{test.test_type}</p>
                </div>
                {test.test_code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Test Code</label>
                    <p className="mt-1 text-sm text-gray-900">{test.test_code}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </p>
                </div>
                {test.units && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Units</label>
                    <p className="mt-1 text-sm text-gray-900">{test.units}</p>
                  </div>
                )}
                {test.tested_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Test Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(test.tested_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {test.completed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(test.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Results Card */}
            {(test.results || test.normal_range) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {test.results && typeof test.results === 'object' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Results</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(test.results, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {test.normal_range && typeof test.normal_range === 'object' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Normal Range</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(test.normal_range, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Patient & Doctor Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="space-y-3">
                <Link
                  href={`/patients/${test.patient.id}`}
                  className="block text-lg font-medium text-blue-600 hover:text-blue-900"
                >
                  {test.patient.name}
                </Link>

                {test.patient.date_of_birth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-sm text-gray-900">
                      {new Date(test.patient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {test.patient.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{test.patient.phone}</p>
                  </div>
                )}

                {test.patient.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{test.patient.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Card */}
            {test.doctor && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Referring Doctor</h2>
                <div className="space-y-3">
                  <Link
                    href={`/doctors/${test.doctor.id}`}
                    className="block text-lg font-medium text-green-600 hover:text-green-900"
                  >
                    Dr. {test.doctor.name}
                  </Link>

                  {test.doctor.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Specialization</label>
                      <p className="text-sm text-gray-900">{test.doctor.specialization}</p>
                    </div>
                  )}

                  {test.doctor.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{test.doctor.phone}</p>
                    </div>
                  )}

                  {test.doctor.clinic_address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Clinic Address</label>
                      <p className="text-sm text-gray-900">{test.doctor.clinic_address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}