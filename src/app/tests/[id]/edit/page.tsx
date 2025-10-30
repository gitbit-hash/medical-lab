// app/tests/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PatientWithRelations, DoctorWithRelations, TestFormData } from '../../../types';
import { TestStatus } from '@prisma/client';

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [doctors, setDoctors] = useState<DoctorWithRelations[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<TestFormData>({
    patient_id: '',
    referring_doctor_id: '',
    test_type: '',
    test_code: '',
    status: TestStatus.Pending,
    results: undefined,
    normal_range: undefined,
    units: '',
    tested_at: '',
    completed_at: '',
  });

  useEffect(() => {
    loadFormData();
  }, [testId]);

  const loadFormData = async () => {
    try {
      const [testRes, patientsRes, doctorsRes] = await Promise.all([
        fetch(`/api/tests/${testId}`),
        fetch('/api/patients'),
        fetch('/api/doctors')
      ]);

      if (testRes.ok) {
        const testData = await testRes.json();
        const test = testData.data || testData;

        setFormData({
          patient_id: test.patient_id,
          referring_doctor_id: test.referring_doctor_id || '',
          test_type: test.test_type,
          test_code: test.test_code || '',
          status: test.status,
          results: test.results,
          normal_range: test.normal_range,
          units: test.units || '',
          tested_at: test.tested_at ? new Date(test.tested_at).toISOString().slice(0, 16) : '',
          completed_at: test.completed_at ? new Date(test.completed_at).toISOString().slice(0, 16) : '',
        });
      }

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.data || patientsData);
      }

      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setDoctors(doctorsData.data || doctorsData);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/tests/${testId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update test');
      }
    } catch (error) {
      console.error('Failed to update test:', error);
      alert('Failed to update test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJsonChange = (field: 'results' | 'normal_range', value: string) => {
    try {
      const parsedValue = value ? JSON.parse(value) : undefined;
      setFormData(prev => ({
        ...prev,
        [field]: parsedValue
      }));
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/tests/${testId}`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Test Details
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Test</h1>
          <p className="text-gray-600 mt-2">Update test information</p>
        </div>

        {/* Test Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient *
                  </label>
                  <select
                    name="patient_id"
                    required
                    value={formData.patient_id}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} {patient.phone && `- ${patient.phone}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referring Doctor
                  </label>
                  <select
                    name="referring_doctor_id"
                    value={formData.referring_doctor_id}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} {doctor.specialization && `- ${doctor.specialization}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Type *
                  </label>
                  <input
                    type="text"
                    name="test_type"
                    required
                    value={formData.test_type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CBC, Lipid Profile, Blood Glucose"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Code
                  </label>
                  <input
                    type="text"
                    name="test_code"
                    value={formData.test_code}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CBC001, LIPID002"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={TestStatus.Pending}>Pending</option>
                    <option value={TestStatus.InProgress}>In Progress</option>
                    <option value={TestStatus.Completed}>Completed</option>
                    <option value={TestStatus.Cancelled}>Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Units
                  </label>
                  <input
                    type="text"
                    name="units"
                    value={formData.units}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., mg/dL, mmol/L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Date
                  </label>
                  <input
                    type="datetime-local"
                    name="tested_at"
                    value={formData.tested_at}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="datetime-local"
                    name="completed_at"
                    value={formData.completed_at}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Results (JSON)
                  </label>
                  <textarea
                    value={formData.results ? JSON.stringify(formData.results, null, 2) : ''}
                    onChange={(e) => handleJsonChange('results', e.target.value)}
                    rows={6}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder='{"hemoglobin": 14.2, "wbc": 6500, ...}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter results as JSON format
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Normal Range (JSON)
                  </label>
                  <textarea
                    value={formData.normal_range ? JSON.stringify(formData.normal_range, null, 2) : ''}
                    onChange={(e) => handleJsonChange('normal_range', e.target.value)}
                    rows={6}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder='{"hemoglobin": {"min": 13.5, "max": 17.5}, ...}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter normal ranges as JSON format
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/tests/${testId}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update Test'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}