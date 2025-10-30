// app/doctors/page.tsx
import Link from 'next/link';
import { localPrisma } from '../lib/db/local-client';
import { DoctorWithRelations } from '../types';

export default async function DoctorsPage() {
  const doctors = await localPrisma.doctor.findMany({
    where: { is_deleted: false },
    include: {
      patients: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  }) as DoctorWithRelations[];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-600 mt-2">Manage referring doctors</p>
          </div>
          <Link
            href="/doctors/create"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Doctor
          </Link>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>

        {doctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No doctors found</div>
            <Link
              href="/doctors/create"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add your first doctor
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface DoctorCardProps {
  doctor: DoctorWithRelations;
}

function DoctorCard({ doctor }: DoctorCardProps) {
  const patientCount = doctor.patients.length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
          {doctor.specialization && (
            <p className="text-gray-600 mt-1">{doctor.specialization}</p>
          )}
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
          {patientCount} patient{patientCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {doctor.phone && (
          <div className="flex items-center">
            <span className="w-5">📞</span>
            <span>{doctor.phone}</span>
          </div>
        )}
        {doctor.email && (
          <div className="flex items-center">
            <span className="w-5">✉️</span>
            <span className="truncate">{doctor.email}</span>
          </div>
        )}
        {doctor.clinic_address && (
          <div className="flex items-start">
            <span className="w-5 mt-1">📍</span>
            <span className="text-xs">{doctor.clinic_address}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <Link
          href={`/doctors/${doctor.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </Link>
        <div className="flex space-x-2">
          <Link
            href={`/doctors/${doctor.id}/edit`}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            Edit
          </Link>
          <button className="text-red-600 hover:text-red-800 text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}