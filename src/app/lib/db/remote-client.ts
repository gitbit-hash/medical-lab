// lib/db/remote-client.ts
import { PrismaClient } from '@prisma/client'

class RemoteDB {
  private prisma: PrismaClient | null = null
  private isConnected = false

  async connect() {
    if (this.isConnected && this.prisma) return this.prisma

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.REMOTE_DATABASE_URL,
        },
      },
    })

    // Test connection
    try {
      await this.prisma.$queryRaw`SELECT 1`
      this.isConnected = true
    } catch (error) {
      this.prisma = null
      this.isConnected = false
      throw error
    }

    return this.prisma
  }

  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
      this.isConnected = false
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      await this.connect()
      return true
    } catch {
      return false
    }
  }
}

export const remoteDB = new RemoteDB()