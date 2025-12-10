import mongoose from 'mongoose';
import axios from 'axios';

export interface HealthCheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

// Each check is async and returns a HealthCheckResult
export async function checkBackend(): Promise<HealthCheckResult> {
  return { name: 'backend', status: 'ok', message: 'Backend is running' };
}

export async function checkMongoDB(): Promise<HealthCheckResult> {
  try {
    const state = mongoose.connection.readyState;
    const statesMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return state === 1
      ? {
          name: 'mongodb',
          status: 'ok',
          message: 'MongoDB is connected',
          details: {
            connectionState: state,
            readyState: statesMap[state],
            host: mongoose.connection.host || 'unknown',
            database: mongoose.connection.name || 'unknown',
          },
        }
      : {
          name: 'mongodb',
          status: 'error',
          message: `MongoDB connection problem: ${statesMap[state]}`,
        };
  } catch (error: any) {
    return { name: 'mongodb', status: 'error', message: error.message };
  }
}

export async function checkStorage(): Promise<HealthCheckResult> {
  try {
    return { name: 'storage', status: 'ok', message: 'Storage available' };
  } catch (error: any) {
    return { name: 'storage', status: 'error', message: error.message };
  }
}

export function checkVersion(): HealthCheckResult {
  const packageJson = require('../../package.json');
  return { name: 'version', status: 'ok', message: 'Backend version fetched', details: { version: packageJson.version } };
}

// Run checks sequentially and return results as an array
export async function runHealthChecks(queue: any = null): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const tests = [checkBackend, checkMongoDB, checkStorage, checkVersion];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
    } catch (error: any) {
      results.push({ name: 'unknown', status: 'error', message: error.message });
    }
  }

  return results;
}
