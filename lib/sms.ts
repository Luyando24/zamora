import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const adminNumber = process.env.ADMIN_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Formatting helper
function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '');

  // Check if it's a Zambian number starting with 0 (e.g., 097...)
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return '+260' + cleanPhone.substring(1);
  }
  
  // Check if it's a Zambian number without 0 (e.g., 97...)
  if (cleanPhone.length === 9 && (cleanPhone.startsWith('9') || cleanPhone.startsWith('7'))) {
      return '+260' + cleanPhone;
  }

  // Ensure it starts with +
  if (!cleanPhone.startsWith('+')) {
      return '+' + cleanPhone;
  }

  return cleanPhone;
}

export const sendSMS = async (to: string, body: string) => {
  if (!client) {
    console.warn('Twilio credentials not found. SMS not sent.', { body, to });
    return { success: false, error: 'Missing credentials' };
  }

  const formattedTo = formatPhoneNumber(to);
  if (!formattedTo) {
      console.warn('Invalid phone number format', { to });
      return { success: false, error: 'Invalid phone number' };
  }

  try {
    const params: any = {
      body,
      to: formattedTo,
    };

    if (messagingServiceSid) {
      params.messagingServiceSid = messagingServiceSid;
    } else if (fromNumber) {
      params.from = fromNumber;
    } else {
      console.warn('No Twilio From number or Messaging Service SID found. SMS might fail.');
      // Twilio might fail if neither is provided, unless using a default from console
    }

    const message = await client.messages.create(params);
    console.log('SMS sent:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
};

export const notifyAdmin = async (message: string, overridePhone?: string | null) => {
    const targetPhone = overridePhone || adminNumber;
    
    if (!targetPhone) {
        console.warn('Admin phone number not set. Notification skipped.');
        return { success: false, error: 'Missing admin phone' };
    }
    return sendSMS(targetPhone, message);
}
