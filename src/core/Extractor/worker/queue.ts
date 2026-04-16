/**
 * BullMQ Queue Configuration
 * 
 * Central queue definitions for the autonomous employee.
 * Uses Upstash Redis (or any accessible Redis instance).
 */

import { Queue, DefaultJobOptions } from 'bullmq';
import IORedis from 'ioredis';

if (!process.env.UPSTASH_REDIS_URL && !process.env.REDIS_URL) {
  console.warn('[Queue] Warning: No REDIS_URL configured. Queue operations will fail.');
}

export const redisConnection = new IORedis(
  process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
);

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  // Explicit Error State Machine constraints
  attempts: 3, 
  backoff: {
    type: 'exponential',
    delay: 2000, 
  },
  removeOnComplete: {
    age: 3600 * 24 * 7, // keep completed jobs for 7 days
  },
  removeOnFail: {
    age: 3600 * 24 * 30, // keep failed jobs (dead letters) for 30 days for inspection
  }
};

// Main processing queue for document workflow
export const documentProcessQueue = new Queue('document-extraction', {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const invoiceProcessQueue = new Queue('invoice-processing', {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export interface DocumentJobPayload {
  documentId: string;
  orgId: string;
  storagePath: string;
  originalFilename: string;
}

export interface InvoiceJobPayload {
  invoiceId: string;
  obligationId: string;
  orgId: string;
  storagePath: string;
  originalFilename: string;
}

export const notificationQueue = new Queue('email-notifications', {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export interface NotificationJobPayload {
  obligationId: string;
  orgId: string;
  contractName: string;
  counterpartyName: string;
  deadlineType: '90_day' | '60_day' | '30_day' | '7_day';
  noticeDeadline: string;
  emailTo: string[];
}

export const schedulerQueue = new Queue('daily-deadline-scanner', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true
  }
});
