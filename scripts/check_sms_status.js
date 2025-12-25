
require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const messageSid = process.argv[2];

if (!messageSid) {
  console.error('Please provide a Message SID');
  process.exit(1);
}

async function checkStatus() {
  try {
    const message = await client.messages(messageSid).fetch();
    console.log('Message Details:');
    console.log(`- SID: ${message.sid}`);
    console.log(`- Status: ${message.status}`);
    console.log(`- To: ${message.to}`);
    console.log(`- From: ${message.from}`);
    console.log(`- Error Code: ${message.errorCode}`);
    console.log(`- Error Message: ${message.errorMessage}`);
    console.log(`- Date Created: ${message.dateCreated}`);
    console.log(`- Date Updated: ${message.dateUpdated}`);
  } catch (error) {
    console.error('Error fetching message:', error.message);
  }
}

checkStatus();
