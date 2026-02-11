import { Request, Response } from 'express';
import { runHealthChecks, HealthCheckResult } from './health.service';

// Helper to calculate overall health percent
function calculateHealthPercent(results: HealthCheckResult[]): number {
  const statusMap: Record<string, number> = { ok: 1, warning: 0.5, error: 0 };
  const values = results.map(r => statusMap[r.status] ?? 0);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / results.length) * 100);
}

// -------------------
// SSE Controller
// -------------------
export async function systemHealthSSE(req: Request, res: Response) {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const results: HealthCheckResult[] = [];
  const tests = [
    () => require('./health.service').checkBackend(),
    () => require('./health.service').checkMongoDB(),
    () => require('./health.service').checkStorage(),
    () => require('./health.service').checkVersion(),
  ];

  for (const test of tests) {
    const result = await test();
    results.push(result);
    // Send incremental result to client
    res.write(`data: ${JSON.stringify(result)}\n\n`);
  }

  // Send final summary
  const healthPercent = calculateHealthPercent(results);
  res.write(`data: ${JSON.stringify({ summary: true, healthPercent, results })}\n\n`);
  res.end();
}
