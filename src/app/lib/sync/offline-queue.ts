// lib/sync/offline-queue.ts
import { SyncStatus, TestStatus, Prisma } from '@prisma/client';
import { PatientQueueData, DoctorQueueData, TestQueueData } from '../../types/sync';

class OfflineQueue {
  private isOnline = true;
  private syncInterval: NodeJS.Timeout | null = null;

  // Initialize the queue manager
  init(): void {
    this.setupNetworkDetection();
    this.startAutoSync();
  }

  // Set up network status detection
  private setupNetworkDetection(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('Online - attempting sync');
        this.trySync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('Offline - queuing operations locally');
      });

      this.isOnline = navigator.onLine;
    }
  }

  // Start automatic sync attempts
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.trySync();
      }
    }, 30000); // Try every 30 seconds when online
  }

  // Add patient to queue
  async addPatient(patientData: PatientQueueData): Promise<any> {
    const patientId = patientData.id || this.generateId();

    try {
      // Always store locally first
      const result = await this.storePatientLocally({
        ...patientData,
        id: patientId,
        local_id: patientData.id ? null : patientId,
        sync_status: 'Pending' as SyncStatus,
      });

      // If online, try immediate sync
      if (this.isOnline) {
        await this.trySync();
      }

      return result;
    } catch (error) {
      console.error('Failed to add patient to queue:', error);
      throw error;
    }
  }

  // Add doctor to queue
  async addDoctor(doctorData: DoctorQueueData): Promise<any> {
    const doctorId = doctorData.id || this.generateId();

    try {
      const result = await this.storeDoctorLocally({
        ...doctorData,
        id: doctorId,
        local_id: doctorData.id ? null : doctorId,
        sync_status: 'Pending' as SyncStatus,
      });

      if (this.isOnline) {
        await this.trySync();
      }

      return result;
    } catch (error) {
      console.error('Failed to add doctor to queue:', error);
      throw error;
    }
  }

  // Add test to queue
  async addTest(testData: TestQueueData): Promise<any> {
    const testId = testData.id || this.generateId();

    try {
      const result = await this.storeTestLocally({
        ...testData,
        id: testId,
        local_id: testData.id ? null : testId,
        sync_status: 'Pending' as SyncStatus,
      });

      if (this.isOnline) {
        await this.trySync();
      }

      return result;
    } catch (error) {
      console.error('Failed to add test to queue:', error);
      throw error;
    }
  }

  // Store patient locally
  private async storePatientLocally(patientData: PatientQueueData & { id: string; sync_status: SyncStatus }): Promise<any> {
    const { localPrisma } = await import('../db/local-client');

    return await localPrisma.patient.create({
      data: {
        id: patientData.id,
        local_id: patientData.local_id,
        name: patientData.name,
        date_of_birth: patientData.date_of_birth ? new Date(patientData.date_of_birth) : null,
        phone: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        sync_status: patientData.sync_status,
      },
    });
  }

  // Store doctor locally
  private async storeDoctorLocally(doctorData: DoctorQueueData & { id: string; sync_status: SyncStatus }): Promise<any> {
    const { localPrisma } = await import('../db/local-client');

    return await localPrisma.doctor.create({
      data: {
        id: doctorData.id,
        local_id: doctorData.local_id,
        name: doctorData.name,
        specialization: doctorData.specialization,
        phone: doctorData.phone,
        email: doctorData.email,
        clinic_address: doctorData.clinic_address,
        sync_status: doctorData.sync_status,
      },
    });
  }

  // Store test locally
  private async storeTestLocally(testData: TestQueueData & { id: string; sync_status: SyncStatus }): Promise<any> {
    const { localPrisma } = await import('../db/local-client');

    const data: Prisma.TestCreateInput = {
      id: testData.id,
      local_id: testData.local_id,
      patient: { connect: { id: testData.patient_id } },
      test_type: testData.test_type,
      test_code: testData.test_code,
      status: testData.status || 'Pending',
      units: testData.units,
      tested_at: testData.tested_at || null,
      completed_at: testData.completed_at || null,
      sync_status: testData.sync_status,
    };

    // Handle referring doctor if present
    if (testData.referring_doctor_id) {
      data.doctor = { connect: { id: testData.referring_doctor_id } };
    }

    // Handle JSON fields with proper Prisma types
    if (testData.results === null || testData.results === undefined) {
      data.results = Prisma.DbNull;
    } else {
      data.results = testData.results as Prisma.InputJsonValue;
    }

    if (testData.normal_range === null || testData.normal_range === undefined) {
      data.normal_range = Prisma.DbNull;
    } else {
      data.normal_range = testData.normal_range as Prisma.InputJsonValue;
    }

    return await localPrisma.test.create({
      data,
    });
  }

  // Try to sync pending changes
  async trySync(): Promise<boolean> {
    if (!this.isOnline) {
      console.log('Cannot sync - offline');
      return false;
    }

    try {
      console.log('Attempting sync...');
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sync successful:', result);
        return true;
      } else {
        console.error('Sync failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  // Manual sync trigger
  async manualSync(): Promise<boolean> {
    return await this.trySync();
  }

  // Generate unique ID
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();