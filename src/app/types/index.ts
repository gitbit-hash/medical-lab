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

// Test with doctor relation
export type TestWithDoctor = Test & {
  doctor: Doctor | null;
};

// PatientDoctor with doctor relation
export type PatientDoctorWithDoctor = PatientDoctor & {
  doctor: Doctor;
};