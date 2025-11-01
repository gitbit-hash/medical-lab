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
  TestCategory
} from '@prisma/client';

// Re-export everything from sync
export * from './sync';

// Base types without relations for API responses
export type TestCategoryBase = TestCategory;
export type TestTemplateBase = TestTemplate;

// Test with doctor relation
export type TestWithDoctor = Test & {
  doctor: Doctor | null;
};

// Patient with relations
export type PatientWithRelations = Patient & {
  doctors: (PatientDoctor & {
    doctor: Doctor;
  })[];
  tests: TestWithDoctor[];
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

// TestCategory with relations - make children and tests optional
export type TestCategoryWithChildren = TestCategory & {
  children?: TestCategoryWithChildren[];
  tests?: TestTemplateWithCategory[];
};

// TestTemplate with category
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

// API response types for test selection
export type TestCategoryTree = TestCategory & {
  children?: TestCategoryTree[];
  tests?: TestTemplateWithCategory[];
};

export type TestTemplateSearchResult = TestTemplate & {
  category: TestCategory;
  parameters: TestParameter[]; // Add this
};