// app/patients/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { TestSelectionForm } from '../../../components/test-selection-form';
import { TestTemplateSearchResult, TestTemplateWithCategoryAndParams } from '../../../types';
import { TestStatus } from '@prisma/client';

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<TestTemplateWithCategoryAndParams[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {

      const [patientRes, doctorsRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch('/api/doctors'),
        fetch(`/api/tests?patientId=${patientId}`)
      ]);

      const testsRes = await fetch(`/api/tests?patientId=${patientId}`);


      if (!patientRes.ok) throw new Error('Failed to load patient');
      if (!doctorsRes.ok) throw new Error('Failed to load doctors');
      if (!testsRes.ok) throw new Error('Failed to load tests');

      const patientData = await patientRes.json();
      const patient = patientData.data || patientData;

      const doctorsData = await doctorsRes.json();
      const testsData = await testsRes.json();
      const patientTests = testsData.data || testsData;

      // Set patient form data
      setFormData({
        name: patient.name,
        date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
      });

      // Set selected doctors
      if (patient.doctors) {
        setSelectedDoctors(patient.doctors.map((pd: any) => pd.doctor_id));
      }

      // Set doctors
      setDoctors(doctorsData.data || doctorsData);

      // Load test templates for existing tests - TYPE-SAFE VERSION
      // Load test templates for existing tests - COMPLETE FIXED VERSION
      if (patientTests.length > 0) {

        const testTemplatesPromises = patientTests.map(async (test: any) => {
          let template: TestTemplateWithCategoryAndParams | null = null;
          let recoveredFees = 0;

          // STEP 1: Try to load by template ID
          if (test.test_template_id) {
            try {
              const templateRes = await fetch(`/api/test-templates/${test.test_template_id}`);
              if (templateRes.ok) {
                const templateData = await templateRes.json();
                template = templateData.data;
                recoveredFees = template?.fees || 0;
              }
            } catch (error) {
              console.error(`Error loading template ${test.test_template_id}:`, error);
            }
          }

          // STEP 2: Search by name to recover fees
          if (!template) {
            try {
              const searchResponse = await fetch(`/api/test-templates?search=${encodeURIComponent(test.test_type)}`);
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const matchingTemplates = searchData.data || searchData;

                if (matchingTemplates.length > 0) {
                  const matchedTemplate = matchingTemplates[0];
                  recoveredFees = matchedTemplate.fees || 0;
                  template = matchedTemplate;
                }
              }
            } catch (error) {
              console.error('Error searching for template:', error);
            }
          }

          // STEP 3: Create proper synthetic template with parameters
          if (!template) {
            const now = new Date();

            template = {
              // Core TestTemplate fields
              id: test.test_template_id || test.id,
              name: test.test_type,
              code: test.test_code || test.test_type,
              category_id: 'synthetic-category',
              description: `Test created for ${patient.name}`,
              specimen: null,
              container: null,
              volume: null,
              storage: null,
              methodology: null,
              turnaround_time: null,
              fees: recoveredFees,
              is_active: true,
              created_at: now,
              updated_at: now,
              expired_at: null,

              // Category relation
              category: {
                id: 'synthetic-category',
                name: 'Previously Added Tests',
                description: null,
                parent_id: null,
                is_active: true,
                created_at: now,
                updated_at: now
              },

              // Parameters array - now valid!
              parameters: []
            } as TestTemplateWithCategoryAndParams;
          }

          return template;
        });

        const testTemplatesResults = await Promise.all(testTemplatesPromises);
        const validTestTemplates = testTemplatesResults.filter(Boolean) as TestTemplateWithCategoryAndParams[];

        setSelectedTests(validTestTemplates);
      } else {
        setSelectedTests([]);
      }

    } catch (error) {
      console.error('❌ Failed to load patient data:', error);
      alert('Failed to load patient data');
    } finally {
      setIsLoading(false);
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

    // Enhanced double submission protection
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const patientResponse = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          doctorIds: selectedDoctors,
        }),
      });

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json();
        throw new Error(`Failed to update patient: ${errorData.error}`);
      }

      const testsRes = await fetch(`/api/tests?patientId=${patientId}`);

      if (!testsRes.ok) {
        throw new Error('Failed to fetch current tests');
      }

      const testsData = await testsRes.json();
      const currentTests = testsData.data || testsData;

      // STEP 3: Delete current tests with verification
      const deletePromises = currentTests.map(async (test: any) => {
        const deleteResponse = await fetch(`/api/tests/${test.id}`, {
          method: 'DELETE'
        });

        if (!deleteResponse.ok) {
          console.error(`   ❌ Failed to delete test ${test.id}`);
          throw new Error(`Failed to delete test ${test.id}`);
        }
        return true;
      });

      // Wait for ALL deletions to complete
      await Promise.all(deletePromises);

      await new Promise(resolve => setTimeout(resolve, 500));

      const createPromises = selectedTests.map(async (test, index) => {

        const testData = {
          patient_id: patientId,
          test_type: test.name,
          test_code: test.code,
          test_template_id: test.id,
          status: 'Pending' as TestStatus,
        };

        const createResponse = await fetch('/api/tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error(`   ❌ Failed to create test ${test.name}:`, errorData);
          throw new Error(`Failed to create test ${test.name}`);
        }

        const createdTest = await createResponse.json();
        return createdTest;
      });

      // Wait for ALL creations to complete
      await Promise.all(createPromises);

      const finalCheckRes = await fetch(`/api/tests?patientId=${patientId}`);

      router.push(`/patients/${patientId}`);

    } catch (error) {
      alert(`Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Loading patient data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/patients/${patientId}`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Patient
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Patient</h1>
          <p className="text-gray-600 mt-2">Update patient information and tests</p>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Debug Info:</strong> Selected Tests: {selectedTests.length} |
          Patient ID: {patientId}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
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

          {/* Test Selection Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Laboratory Tests *</h2>
            <p className="text-gray-600 mb-4">
              {selectedTests.length > 0
                ? `Currently ${selectedTests.length} test(s) selected. Add or remove tests as needed.`
                : 'No tests selected. Please add at least one test.'}
            </p>
            <TestSelectionForm
              selectedTests={selectedTests}
              onTestsChange={setSelectedTests}
            />
          </div>

          {/* Referring Doctors Card */}
          <div className="bg-white rounded-lg shadow p-6">
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

          {/* Form Actions */}
          <div className="bg-white rounded-lg shadow p-6 sticky bottom-6">
            <div className="flex justify-end space-x-4">
              <Link
                href={`/patients/${patientId}`}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || selectedTests.length === 0}
                className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                onClick={(e) => {
                  if (isSubmitting) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {isSubmitting ? 'Updating Patient...' : 'Update Patient & Tests'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}