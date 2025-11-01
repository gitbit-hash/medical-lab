'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TestStatus } from '@prisma/client';
import { PatientQueueData, PatientWithRelations, TestWithDoctor } from '../../types';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog';


export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [patient, setPatient] = useState<PatientWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${id}`);
      if (response.ok) {
        const result = await response.json();
        setPatient(result.data);
        // console.log(data.tests)
      } else {
        console.error('Failed to load patient');
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };


  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!patient) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to patients list
        router.push('/patients');
      } else {
        alert(`Failed to delete patient: ${result.error}`);
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
      alert('Failed to delete patient');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };


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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Loading patient data...</div>
        </div>
      </div>
    );
  }

  if (!patient || patient.is_deleted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Patient not found</div>
          <Link href="/patients" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        message={`Are you sure you want to delete patient "${patient?.name}"? This will also delete all their tests and cannot be undone.`}
        confirmText="Delete Patient"
        isLoading={isDeleting}
      />

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
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/patients/${patient.id}/edit`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Edit Patient
              </Link>
              <button
                onClick={handleDeleteClick}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Patient'}
              </button>
            </div>
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
              <h2 className="text-xl font-semibold text-gray-900">Laboratory Tests</h2>
              {patient.tests.length > 0 ? (
                <div className="space-y-3">
                  {patient.tests.map((test: TestWithDoctor) => (
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