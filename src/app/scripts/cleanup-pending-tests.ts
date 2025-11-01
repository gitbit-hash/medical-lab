import { localPrisma } from '../lib/db/local-client';

async function cleanupPendingTests() {
  console.log('🧹 Cleaning up pending tests that are deleted...');

  // Find tests that are deleted but still marked as pending
  const deletedPendingTests = await localPrisma.test.findMany({
    where: {
      is_deleted: true,
      sync_status: 'Pending'
    }
  });

  console.log(`📊 Found ${deletedPendingTests.length} deleted tests with pending sync`);

  // Update their sync status to 'Synced' since they don't need to sync
  const result = await localPrisma.test.updateMany({
    where: {
      is_deleted: true,
      sync_status: 'Pending'
    },
    data: {
      sync_status: 'Synced'
    }
  });

  console.log(`✅ Updated ${result.count} tests from Pending to Synced`);

  // Verify
  const remainingPendingDeleted = await localPrisma.test.count({
    where: {
      is_deleted: true,
      sync_status: 'Pending'
    }
  });

  console.log(`🔍 Remaining deleted tests with pending sync: ${remainingPendingDeleted}`);
}

cleanupPendingTests()
  .catch(console.error)
  .finally(() => process.exit());