// types/sync.ts
import { SyncStatus, TestStatus, Patient, Doctor, Test, PatientDoctor } from '@prisma/client';

// Sync Types
export interface SyncResult {
  success: boolean;
  syncedPatients: number;
  syncedDoctors: number;
  syncedTests: number;
  conflicts: number;
  errors: string[];
}

export interface SyncStatusData {
  pendingPatients: number;
  pendingDoctors: number;
  pendingTests: number;
  isOnline: boolean;
}

// Queue Data Types
export interface PatientQueueData {
  id?: string;
  local_id?: string | null;
  name: string;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  sync_status?: SyncStatus;
}

export interface DoctorQueueData {
  id?: string;
  local_id?: string | null;
  name: string;
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
  clinic_address?: string | null;
  sync_status?: SyncStatus;
}

export interface TestQueueData {
  id?: string;
  local_id?: string | null;
  patient_id: string;
  referring_doctor_id?: string | null;
  test_type: string;
  test_code?: string | null;
  test_template_id: string | null;
  status?: TestStatus;
  results?: Record<string, unknown> | null;
  normal_range?: Record<string, unknown> | null;
  units?: string | null;
  tested_at?: Date | null;
  completed_at?: Date | null;
  sync_status?: SyncStatus;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Form Data Types
export interface PatientFormData {
  name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  doctorIds?: string[];
}

export interface DoctorFormData {
  name: string;
  specialization?: string;
  phone?: string;
  email?: string;
  clinic_address?: string;
}

export interface TestFormData {
  patient_id: string;
  referring_doctor_id?: string;
  test_type: string;
  test_code?: string;
  test_template_id?: string;
  status?: TestStatus;
  results?: Record<string, unknown>;
  normal_range?: Record<string, unknown>;
  units?: string;
  tested_at?: string;
  completed_at?: string;
}