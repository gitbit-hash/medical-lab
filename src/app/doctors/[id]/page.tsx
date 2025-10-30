// app/doctors/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { localPrisma } from '../../lib/db/local-client';
import { DoctorWithRelations, PatientWithDoctor } from '../../types';

interface DoctorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const { id } = await params

  const doctor = await localPrisma.doctor.findUnique({
    where: { id },
    include: {
      patients: {
        include: {
          patient: {
            include: {
              tests: {
                where: {
                  referring_doctor_id: id
                },
                orderBy: { created_at: 'desc' }
              }
            }
          },
        },
        orderBy: { referred_at: 'desc' },
      },
    },
  }) as DoctorWithRelations | null;

  if (!doctor || doctor.is_deleted) {
    notFound();
  }

  const patientCount = doctor.patients.length;
  const recentTests = doctor.patients.flatMap(pd =>
    pd.patient.tests.map(test => ({
      ...test,
      patient: pd.patient
    }))
  ).slice(0, 5); // Show only 5 most recent tests

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/doctors"
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Doctors
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dr. {doctor.name}</h1>
              {doctor.specialization && (
                <p className="text-xl text-gray-600 mt-1">{doctor.specialization}</p>
              )}
              <p className="text-gray-500 mt-2">
                {patientCount} patient{patientCount !== 1 ? 's' : ''} under care
              </p>
            </div>
            <Link
              href={`/doctors/${doctor.id}/edit`}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Edit Doctor
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Information & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.phone}</p>
                  </div>
                )}
                {doctor.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.email}</p>
                  </div>
                )}
                {doctor.clinic_address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Clinic Address</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.clinic_address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tests */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tests</h2>
              {recentTests.length > 0 ? (
                <div className="space-y-3">
                  {recentTests.map((test) => (
                    <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{test.test_type}</h3>
                          <p className="text-sm text-gray-500">
                            Patient: {test.patient.name}
                          </p>
                          {test.test_code && (
                            <p className="text-sm text-gray-500">Code: {test.test_code}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          test.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {test.status}
                        </span>
                      </div>
                      {test.tested_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Tested: {new Date(test.tested_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent tests</p>
              )}
            </div>
          </div>

          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
                <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                  {patientCount}
                </span>
              </div>
              {doctor.patients.length > 0 ? (
                <div className="space-y-3">
                  {doctor.patients.map((pd) => (
                    <div key={pd.id} className="border border-gray-200 rounded-lg p-3">
                      <Link
                        href={`/patients/${pd.patient.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 block"
                      >
                        {pd.patient.name}
                      </Link>
                      {pd.patient.phone && (
                        <p className="text-sm text-gray-600">{pd.patient.phone}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Referred: {new Date(pd.referred_at).toLocaleDateString()}
                      </p>
                      {pd.is_primary && (
                        <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">No patients yet</p>
                  <Link
                    href="/patients/create"
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Add a patient
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}