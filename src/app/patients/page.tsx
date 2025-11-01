'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PatientWithRelations } from '../types';
import { DeleteConfirmationDialog } from '../components/delete-confirmation-dialog';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // ← Dialog state
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const result = await response.json();
        setPatients(result.data || result);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteClick = (patientId: string, patientName: string) => {
    setPatientToDelete({ id: patientId, name: patientName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    setIsDeleting(patientToDelete.id);

    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the patient list
        await loadPatients();
        setShowDeleteDialog(false);
        setPatientToDelete(null);
      } else {
        alert(`Failed to delete patient: ${result.error}`);
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
      alert('Failed to delete patient');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setPatientToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Loading patients...</div>
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
        message={`Are you sure you want to delete patient "${patientToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Patient"
        isLoading={isDeleting === patientToDelete?.id}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-2">Manage patient records</p>
          </div>
          <Link
            href="/patients/create"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Patient
          </Link>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referring Doctors
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
              {patients.map((patient: PatientWithRelations) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    {patient.date_of_birth && (
                      <div className="text-sm text-gray-500">
                        DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{patient.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {patient.doctors.map(pd => pd.doctor.name).join(', ') || 'None'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/patients/${patient.id}/edit`}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(patient.id, patient.name)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting === patient.id}
                    >
                      {isDeleting === patient.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {patients.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No patients found</div>
              <Link
                href="/patients/create"
                className="inline-block mt-4 text-blue-500 hover:text-blue-700"
              >
                Add your first patient
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}