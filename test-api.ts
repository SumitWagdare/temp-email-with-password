import { EmailProviderService } from './src/lib/email-providers/index';

async function testApi() {
  console.log("Starting test...");
  const service = new EmailProviderService();
  try {
    const domains = await service.getDomains();
    console.log("Domains:", domains);
    
    if (domains.length === 0) {
      console.error("No domains found");
      return;
    }
    
    const account = await service.createAccount("testytesty123", domains[0], "password123!");
    console.log("Account created:", account);
    
    const messages = await service.getMessages(account);
    console.log("Messages:", messages);
  } catch (err) {
    console.error("Error:", err);
  }
}

testApi();
