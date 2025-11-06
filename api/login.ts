
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { type, password, name } = req.body;

  if (!type || !password) {
    return res.status(400).json({ success: false, message: 'Missing login type or password.' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const staffPassword = process.env.STAFF_PASSWORD;

  if (!adminPassword || !staffPassword) {
      console.error("CRITICAL: ADMIN_PASSWORD or STAFF_PASSWORD environment variables are not set.");
      return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error. The authentication service is not correctly set up.' 
      });
  }

  let isAuthenticated = false;

  if (type === 'admin' && password === adminPassword) {
    isAuthenticated = true;
  } else if (type === 'staff' && password === staffPassword) {
    if (!name) {
        return res.status(400).json({ success: false, message: 'Staff name is required.' });
    }
    isAuthenticated = true;
  }

  if (isAuthenticated) {
    return res.status(200).json({ success: true, message: 'Login successful.' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
}
