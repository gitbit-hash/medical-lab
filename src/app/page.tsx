// app/page.tsx
import Link from 'next/link'

// Define the color type
type ColorType = 'blue' | 'green' | 'purple' | 'orange' | 'gray'

interface DashboardCardProps {
  title: string
  description: string
  href: string
  color: ColorType
}

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Medical Laboratory Management
          </h1>
          <p className="text-gray-600 mt-2">
            Offline-first laboratory management system
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Patients"
            description="Manage patient records"
            href="/patients"
            color="blue"
          />
          <DashboardCard
            title="Doctors"
            description="Manage referring doctors"
            href="/doctors"
            color="green"
          />
          <DashboardCard
            title="Tests"
            description="Manage laboratory tests"
            href="/tests"
            color="purple"
          />
          <DashboardCard
            title="Reports"
            description="Generate test reports"
            href="/reports"
            color="orange"
          />
          <DashboardCard
            title="Sync Status"
            description="Check synchronization"
            href="/sync"
            color="gray"
          />
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">System Status</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Local database connected</span>
          </div>
        </div>
      </div>
    </main>
  )
}

function DashboardCard({ title, description, href, color }: DashboardCardProps) {
  const colorClasses: Record<ColorType, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    gray: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
  }

  return (
    <Link
      href={href}
      className={`block p-6 rounded-lg border-2 transition-colors ${colorClasses[color]}`}
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm opacity-75">{description}</p>
    </Link>
  )
}