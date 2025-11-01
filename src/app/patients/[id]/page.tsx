import { notFound } from 'next/navigation';
import Link from 'next/link';
import { localPrisma } from '../../lib/db/local-client';
import { TestStatus } from '@prisma/client';

interface PatientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params

  // CLEAN QUERY: Load patient with minimal, non-nested relationships
  const patient = await localPrisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      date_of_birth: true,
      phone: true,
      email: true,
      address: true,
      created_at: true,
      is_deleted: true,
      // Doctors - simple relation
      doctors: {
        where: { is_deleted: false },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          }
        },
        orderBy: { referred_at: 'desc' }
      },
      // Tests - simple relation without nesting
      tests: {
        where: { is_deleted: false },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!patient || patient.is_deleted) {
    notFound();
  }

  // Debug the actual data
  console.log('🩺 PATIENT DETAIL DEBUG:', {
    patientId: patient.id,
    patientName: patient.name,
    totalTests: patient.tests.length,
    testDetails: patient.tests.map(t => ({
      id: t.id,
      test_type: t.test_type,
      test_code: t.test_code,
      status: t.status,
      created_at: t.created_at
    }))
  });

  // Check for duplicates by ID
  const testIds = patient.tests.map(t => t.id);
  const hasDuplicates = new Set(testIds).size !== testIds.length;

  if (hasDuplicates) {
    console.log('🚨 DUPLICATE TEST IDs FOUND:', {
      total: testIds.length,
      unique: new Set(testIds).size,
      duplicates: testIds.filter((id, index) => testIds.indexOf(id) !== index)
    });
  }

  // Helper function to get status classes
  const getStatusClasses = (status: TestStatus) => {
    switch (status) {
      case TestStatus.Completed:
        return 'bg-green-100 text-green-800';
      case TestStatus.InProgress:
        return 'bg-yellow-100 text-yellow-800';
      case TestStatus.Pending:
        return 'bg-gray-100 text-gray-800';
      case TestStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format status for display
  const formatStatus = (status: TestStatus) => {
    switch (status) {
      case TestStatus.Completed:
        return 'Completed';
      case TestStatus.InProgress:
        return 'In Progress';
      case TestStatus.Pending:
        return 'Pending';
      case TestStatus.Cancelled:
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/patients"
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Patients
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-600 mt-2">Patient Details</p>
              {/* Debug info */}
              {hasDuplicates && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  ⚠️ Debug: Found {testIds.length - new Set(testIds).size} duplicate tests
                </div>
              )}
            </div>
            <Link
              href={`/patients/${patient.id}/edit`}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Edit Patient
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.name}</p>
                </div>
                {patient.date_of_birth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {patient.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.phone}</p>
                  </div>
                )}
                {patient.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.email}</p>
                  </div>
                )}
                {patient.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tests Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Laboratory Tests ({patient.tests.length})
              </h2>
              {patient.tests.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {patient.tests.map((test) => (
                    <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{test.test_type}</h3>
                          <p className="text-sm text-gray-500">{test.test_code}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(test.status)}`}>
                          {formatStatus(test.status)}
                        </span>
                      </div>
                      {test.doctor && (
                        <p className="text-sm text-gray-600 mt-2">
                          Referred by: Dr. {test.doctor.name}
                        </p>
                      )}
                      {test.tested_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Tested: {new Date(test.tested_at).toLocaleDateString()}
                        </p>
                      )}
                      {/* Debug: Show test ID */}
                      <p className="text-xs text-gray-400 mt-1">ID: {test.id}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No tests yet</p>
              )}
            </div>
          </div>

          {/* Referring Doctors */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Referring Doctors</h2>
              {patient.doctors.length > 0 ? (
                <div className="space-y-3">
                  {patient.doctors.map((pd) => (
                    <div key={pd.id} className="border border-gray-200 rounded-lg p-3">
                      <h3 className="font-medium text-gray-900">{pd.doctor.name}</h3>
                      {pd.doctor.specialization && (
                        <p className="text-sm text-gray-600">{pd.doctor.specialization}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Since {new Date(pd.referred_at).toLocaleDateString()}
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
                <p className="text-gray-500 text-center py-4">No referring doctors</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}