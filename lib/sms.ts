import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const adminNumber = process.env.ADMIN_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendSMS = async (to: string, body: string) => {
  if (!client) {
    console.warn('Twilio credentials not found. SMS not sent.', { body, to });
    return { success: false, error: 'Missing credentials' };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log('SMS sent:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
};

export const notifyAdmin = async (message: string) => {
    if (!adminNumber) {
        console.warn('Admin phone number not set. Notification skipped.');
        return { success: false, error: 'Missing admin phone' };
    }
    return sendSMS(adminNumber, message);
}
