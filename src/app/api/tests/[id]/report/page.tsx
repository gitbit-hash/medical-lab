// app/tests/[id]/report/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { localPrisma } from '../../../../lib/db/local-client';
import { TestWithRelations } from '../../../../types';

interface TestReportPageProps {
  params: {
    id: string;
  };
}

export default async function TestReportPage({ params }: TestReportPageProps) {
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

  const formatJsonForDisplay = (data: any): string => {
    if (!data || typeof data !== 'object') return 'No data';

    return Object.entries(data)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}: ${JSON.stringify(value, null, 2)}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/tests/${test.id}`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Test
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Report</h1>
              <p className="text-gray-600 mt-2">Laboratory Test Results</p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Print Report
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow p-8 print:shadow-none">
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900">Medical Laboratory Report</h1>
            <p className="text-gray-600 mt-2">Confidential Laboratory Results</p>
            <p className="text-sm text-gray-500 mt-4">
              Report Generated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            {/* Patient Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Name:</strong> {test.patient.name}
                </div>
                {test.patient.date_of_birth && (
                  <div>
                    <strong>Date of Birth:</strong> {new Date(test.patient.date_of_birth).toLocaleDateString()}
                  </div>
                )}
                {test.patient.phone && (
                  <div>
                    <strong>Phone:</strong> {test.patient.phone}
                  </div>
                )}
                {test.patient.email && (
                  <div>
                    <strong>Email:</strong> {test.patient.email}
                  </div>
                )}
              </div>
            </div>

            {/* Referring Doctor */}
            {test.doctor && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                  Referring Doctor
                </h2>
                <div className="space-y-2">
                  <div>
                    <strong>Name:</strong> Dr. {test.doctor.name}
                  </div>
                  {test.doctor.specialization && (
                    <div>
                      <strong>Specialization:</strong> {test.doctor.specialization}
                    </div>
                  )}
                  {test.doctor.clinic_address && (
                    <div>
                      <strong>Clinic:</strong> {test.doctor.clinic_address}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Test Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Test Type:</strong> {test.test_type}
                </div>
                {test.test_code && (
                  <div>
                    <strong>Test Code:</strong> {test.test_code}
                  </div>
                )}
                <div>
                  <strong>Status:</strong> {test.status}
                </div>
                {test.units && (
                  <div>
                    <strong>Units:</strong> {test.units}
                  </div>
                )}
                {test.tested_at && (
                  <div>
                    <strong>Test Date:</strong> {new Date(test.tested_at).toLocaleString()}
                  </div>
                )}
                {test.completed_at && (
                  <div>
                    <strong>Completed:</strong> {new Date(test.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {(test.results || test.normal_range) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                  Laboratory Results
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {test.results && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Test Results</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {formatJsonForDisplay(test.results)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {test.normal_range && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Normal Range</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {formatJsonForDisplay(test.normal_range)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-center text-gray-600">
              <p className="font-medium">This is an electronically generated report</p>
              <p className="text-sm mt-2">For any queries, please contact the laboratory</p>
              <p className="text-xs mt-4">
                Report ID: {test.id} | Generated on: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}