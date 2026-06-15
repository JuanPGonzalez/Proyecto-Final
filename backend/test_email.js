require('dotenv').config();
const { sendPasswordResetEmail } = require('./services/emailService');

(async () => {
  console.log("Testing email service...");
  try {
    const success = await sendPasswordResetEmail('test@example.com', 'http://localhost/reset');
    console.log("Result:", success);
  } catch (err) {
    console.error("Test failed:", err);
  }
})();
