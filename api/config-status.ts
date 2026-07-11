import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Return config status info
  res.status(200).json({
    hasSystemKey: !!process.env.GEMINI_API_KEY
  });
}
