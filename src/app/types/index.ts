// types/index.ts
import {
  Patient,
  Doctor,
  Test,
  PatientDoctor,
  SyncStatus,
  TestStatus,
  TestTemplate,
  TestParameter,
  TestCategory  // Add this import
} from '@prisma/client';

// Re-export everything
export * from './sync';

// Add the missing TestWithDoctor type
export type TestWithDoctor = Test & {
  doctor: Doctor | null;
};

// Patient with relations
export type PatientWithRelations = Patient & {
  doctors: (PatientDoctor & {
    doctor: Doctor;
  })[];
  tests: (Test & {
    doctor: Doctor | null;
    test_template: TestTemplateWithCategoryAndParams | null;
  })[];
};

// Doctor with relations
export type DoctorWithRelations = Doctor & {
  patients: (PatientDoctor & {
    patient: Patient & {
      tests: Test[];
    };
  })[];
  tests: Test[];
};

// Test with relations
export type TestWithRelations = Test & {
  patient: Patient;
  doctor: Doctor | null;
  test_template: TestTemplateWithCategoryAndParams | null;
};

// Test with patient and doctor
export type TestWithPatientAndDoctor = Test & {
  patient: Patient;
  doctor: Doctor | null;
};

// TestCategory with relations - NOW THIS WILL WORK
export type TestCategoryWithChildren = TestCategory & {
  children: TestCategory[];
  tests: TestTemplate[];
};

// TestTemplate with relations
export type TestTemplateWithCategory = TestTemplate & {
  category: TestCategory;
};

export type TestTemplateWithCategoryAndParams = TestTemplate & {
  category: TestCategory;
  parameters: TestParameter[];
};

// TestParameter type
export type TestParameterWithTemplate = TestParameter & {
  test_template: TestTemplate;
};

// PatientDoctor with doctor relation
export type PatientDoctorWithDoctor = PatientDoctor & {
  doctor: Doctor;
};

// PatientDoctor with patient relation
export type PatientDoctorWithPatient = PatientDoctor & {
  patient: Patient;
};