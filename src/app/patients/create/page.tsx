'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TestSelectionForm } from '../../components/test-selection-form';
import { TestTemplateSearchResult } from '../../types';

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

export default function CreatePatientPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<TestTemplateSearchResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const doctorsData = await response.json();
        setDoctors(doctorsData);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Patient name is required');
    }

    if (selectedTests.length === 0) {
      errors.push('At least one test must be selected');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // First create the patient
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          doctorIds: selectedDoctors,
        }),
      });

      if (!patientResponse.ok) {
        throw new Error('Failed to create patient');
      }

      const patientResult = await patientResponse.json();
      const patientId = patientResult.data?.id || patientResult.id;

      // Then create tests for the patient
      const testPromises = selectedTests.map(test =>
        fetch('/api/tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_id: patientId,
            test_type: test.name,
            test_code: test.code,
            test_template_id: test.id,
            status: 'Pending',
          }),
        })
      );

      await Promise.all(testPromises);
      router.push('/patients');

    } catch (error) {
      console.error('Failed to create patient:', error);
      alert('Failed to create patient and tests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorToggle = (doctorId: string) => {
    setSelectedDoctors(prev =>
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/patients"
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Patients
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Patient</h1>
          <p className="text-gray-600 mt-2">Create a new patient record with laboratory tests</p>
        </div>

        {/* Form Errors */}
        {formErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside text-red-700">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Patient Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter patient's full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Test Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Laboratory Tests *</h2>
              <p className="text-gray-600 mb-4">Select at least one test for the patient</p>
              <TestSelectionForm
                selectedTests={selectedTests}
                onTestsChange={setSelectedTests}
              />
            </div>

            {/* Referring Doctors */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Referring Doctors</h2>
              <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                {doctors.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No doctors available.{' '}
                    <Link href="/doctors/create" className="text-blue-500 hover:text-blue-700">
                      Add doctors first
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <label key={doctor.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDoctors.includes(doctor.id)}
                          onChange={() => handleDoctorToggle(doctor.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{doctor.name}</span>
                          {doctor.specialization && (
                            <span className="text-gray-500 text-sm ml-2">
                              - {doctor.specialization}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Form Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-lg">
            <div className="flex justify-end space-x-4">
              <Link
                href="/patients"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || selectedTests.length === 0}
                className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? 'Creating Patient...' : 'Create Patient & Tests'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}