import { defineConfig } from 'vitest/config';

/**
 * Backend integration test configuration.
 *
 * These tests run against a live CockroachDB database and share demo patient
 * data (demo-patient-001, DEMO-RFID-001, etc.). Running test files concurrently
 * causes non-deterministic failures because multiple files compete to read and
 * mutate the same PatientSession rows.
 *
 * `singleFork: true` forces all test files to run sequentially in a single
 * worker process, eliminating the race conditions while keeping the full test
 * suite runnable with a single `pnpm test` command.
 */
export default defineConfig({
  test: {
    testTimeout: 15000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
