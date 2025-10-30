// types/index.ts
import { Patient, Doctor, Test, PatientDoctor, SyncStatus, TestStatus } from '@prisma/client';

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
  patient?: Patient; // Optional for when we include patient
};

// PatientDoctor with doctor relation
export type PatientDoctorWithDoctor = PatientDoctor & {
  doctor: Doctor;
};

// PatientDoctor with patient relation
export type PatientDoctorWithPatient = PatientDoctor & {
  patient: Patient;
};

// For tests with patient
export type PatientWithDoctor = Patient & {
  tests: Test[];
};