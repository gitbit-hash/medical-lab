// types/index.ts
import { Patient, Doctor, Test, PatientDoctor, SyncStatus, TestStatus } from '@prisma/client';
import { PatientQueueData, DoctorQueueData, TestQueueData, PatientFormData, DoctorFormData, TestFormData } from './sync';

// Re-export everything
export * from './sync';

// Patient with relations
export type PatientWithRelations = Patient & {
  doctors: (PatientDoctor & {
    doctor: Doctor;
  })[];
  tests: (Test & {
    doctor: Doctor | null;
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

// Test with doctor relation
export type TestWithDoctor = Test & {
  doctor: Doctor | null;
  patient?: Patient;
};

// Test with patient and doctor
export type TestWithRelations = Test & {
  patient: Patient;
  doctor: Doctor | null;
};

// PatientDoctor with doctor relation
export type PatientDoctorWithDoctor = PatientDoctor & {
  doctor: Doctor;
};

// PatientDoctor with patient relation
export type PatientDoctorWithPatient = PatientDoctor & {
  patient: Patient;
};