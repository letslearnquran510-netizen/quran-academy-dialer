
/**
 * =================================================================================================
 * SECURE BACKEND SERVERLESS FUNCTION (/api/make-call.ts)
 * =================================================================================================
 * 
 * This file is designed to be deployed as a standalone serverless function on a platform
 * like Vercel. When placed in the `/api` directory, Vercel automatically makes it a
 * live API endpoint.
 * 
 * --- DEPLOYMENT & SECURITY CHECKLIST ---
 * 1.  [REQUIRED] Install dependencies for the backend:
 *     `npm install twilio`
 * 
 * 2.  [REQUIRED] Set Environment Variables in your Vercel project settings:
 *     - TWILIO_ACCOUNT_SID: Your Account SID from the Twilio console.
 *     - TWILIO_AUTH_TOKEN: Your Auth Token from the Twilio console.
 *     - TWILIO_PHONE_NUMBER: Your active Twilio phone number.
 * 
 * 3.  [DONE] This code is now updated to read these secure environment variables.
 *     It NO LONGER accepts credentials from the frontend.
 * 
 */

// Using Vercel's runtime-agnostic types for serverless functions.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }

    // --- 1. Get Secure Credentials from Environment Variables ---
    // These variables MUST be set in your Vercel project's settings page.
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("CRITICAL: Twilio environment variables are not set on the server.");
      return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error. The calling service is not correctly set up. Please contact support.' 
      });
    }
    
    // --- 2. Get Data from the Frontend Request Body ---
    const { staffNumber, studentNumber, recordCall } = req.body;

    if (!staffNumber || !studentNumber) {
      return res.status(400).json({ success: false, message: 'Missing staff or student phone number.' });
    }

    const client = twilio(accountSid, authToken);

    // --- 3. Create TwiML to Bridge the Call ---
    // This tells Twilio: "When the staff member answers, immediately dial the student's number."
    const twiml = new twilio.twiml.VoiceResponse();
    const dial = twiml.dial({
      callerId: twilioPhoneNumber, // Ensures the student sees your Twilio number
    });
    dial.number(studentNumber);

    // --- 4. Prepare Twilio Call Options ---
    const callOptions: {
      twiml: string;
      to: string;
      from: string;
      record?: boolean;
    } = {
      twiml: twiml.toString(),
      to: staffNumber,           // First, call the staff member
      from: twilioPhoneNumber, // From your official Twilio number
    };
    
    if (recordCall === true) {
      callOptions.record = true;
    }

    // --- 5. Initiate the Call with Twilio ---
    client.calls
      .create(callOptions)
      .then(call => {
        console.log(`Call initiated successfully. SID: ${call.sid}. Recording: ${!!callOptions.record}`);
        return res.status(200).json({
          success: true,
          message: 'Call is being connected by Twilio.',
          callSid: call.sid,
        });
      })
      .catch(error => {
        console.error('Twilio API Error:', error);
        const message = error.message || 'Could not initiate the call via Twilio.';
        return res.status(500).json({ success: false, message });
      });
  } catch (error) {
    console.error('[API Make-Call Error]', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return res.status(500).json({ success: false, message: `Internal Server Error: ${message}` });
  }
}
