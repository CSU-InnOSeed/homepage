import type { VercelRequest, VercelResponse } from '@vercel/node';
import { decodeApplyCode } from './tagcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Step 1: import works
    const r1 = typeof decodeApplyCode;
    // Step 2: decode a real code
    const r2 = decodeApplyCode('Mr.Y|MDowOzE6MSwzOzI6MCwxOzM6MA==');
    // Step 3: process.env works
    const r3 = Object.keys(process.env).length;
    res.status(200).json({ step1_typeof: r1, step2_decoded: r2, step3_envCount: r3 });
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    });
  }
}
