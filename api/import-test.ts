import type { VercelRequest, VercelResponse } from '@vercel/node';
import { APPLY_CATEGORIES } from './tagcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ count: APPLY_CATEGORIES.length, keys: APPLY_CATEGORIES.map(c => c.key) });
}
