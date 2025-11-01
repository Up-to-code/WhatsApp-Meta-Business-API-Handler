# WhatsApp Business API Handler

A comprehensive TypeScript/JavaScript library for integrating WhatsApp Business API with webhook support. Works seamlessly with Express.js, Next.js, and any Node.js environment.

## Features

- 🚀 Full WhatsApp Business API support
- 🔄 Built-in webhook handling with signature verification
- 📨 Send text, media, location, contacts, templates, and interactive messages
- ⚡ Rate limiting and auto-retry mechanisms
- 🔒 Secure webhook signature verification
- 🎯 TypeScript support with full type definitions
- 🌐 Works with Express.js, Next.js, Fastify, and standalone Node.js

## Installation

```bash
npm install
```

### For Node.js 16-17 (no native fetch):

```bash
npm install node-fetch@2 @types/node-fetch
```

Then add to your code:
```typescript
import fetch from 'node-fetch';
global.fetch = fetch as any;
```

## Configuration

Get your credentials from [Meta Business Suite](https://business.facebook.com/):

1. Create a WhatsApp Business App
2. Get your `Access Token` and `Phone Number ID`
3. Set up webhook with `Verify Token` and `App Secret`

## Quick Start

### Basic Setup

```typescript
import { WhatsAppHandler } from './whatsapp-handler';

const whatsapp = new WhatsAppHandler({
  token: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  webhookVerifyToken: 'YOUR_VERIFY_TOKEN',
  appSecret: 'YOUR_APP_SECRET',
  businessAccountId: 'YOUR_BUSINESS_ACCOUNT_ID', // Optional
  version: 'v21.0', // Optional, default: v21.0
  apiTimeout: 30000, // Optional, default: 30000ms
  maxRetries: 3, // Optional, default: 3
  rateLimitPerSecond: 80 // Optional, default: 80
});
```

### Sending Messages

```typescript
// Send text message
await whatsapp.sendMessage('1234567890', 'Hello, World!');

// Send text with URL preview
await whatsapp.sendMessage('1234567890', 'Check this: https://example.com', true);

// Send image
await whatsapp.sendMedia('1234567890', 'image', 'https://example.com/image.jpg', 'Caption');

// Send document
await whatsapp.sendMedia('1234567890', 'document', 'MEDIA_ID', 'Caption', 'filename.pdf');

// Send location
await whatsapp.sendLocation('1234567890', 37.7749, -122.4194, 'San Francisco', '123 Main St');

// Send contact
await whatsapp.sendContact('1234567890', [{
  name: {
    formatted_name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe'
  },
  phones: [{
    phone: '+1234567890',
    type: 'MOBILE'
  }]
}]);

// Send template
await whatsapp.sendTemplate('1234567890', {
  name: 'hello_world',
  language: { code: 'en_US' }
});

// Send interactive buttons
await whatsapp.sendInteractive('1234567890', {
  type: 'button',
  body: { text: 'Choose an option:' },
  action: {
    buttons: [
      { type: 'reply', reply: { id: 'btn1', title: 'Option 1' } },
      { type: 'reply', reply: { id: 'btn2', title: 'Option 2' } }
    ]
  }
});

// Mark message as read
await whatsapp.markAsRead('MESSAGE_ID');
```

## Webhook Integration

### Option 1: Built-in Standalone Server

Perfect for simple applications or microservices:

```typescript
import { WhatsAppHandler } from './whatsapp-handler';

const whatsapp = new WhatsAppHandler({
  token: process.env.WHATSAPP_TOKEN!,
  phoneNumberId: process.env.PHONE_NUMBER_ID!,
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  appSecret: process.env.APP_SECRET!
});

// Set up handlers
whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    console.log('New message from:', metadata.displayName);
    console.log('Message:', message.text?.body);
    
    // Auto-reply
    if (message.type === 'text') {
      await whatsapp.sendMessage(
        message.from,
        `You said: ${message.text.body}`
      );
    }
    
    // Mark as read
    await whatsapp.markAsRead(message.id);
  },
  
  onMessageStatus: async (status) => {
    console.log(`Message ${status.id} is now: ${status.status}`);
  },
  
  onError: async (error) => {
    console.error('Webhook error:', error);
  }
});

// Start server on port 3000
whatsapp.startWebhookServer(3000, '/webhook', () => {
  console.log('Webhook server is ready!');
});

// To stop the server
// await whatsapp.stopWebhookServer();
```

### Option 2: Express.js Integration

```typescript
import express from 'express';
import { WhatsAppHandler } from './whatsapp-handler';

const app = express();
app.use(express.json());

const whatsapp = new WhatsAppHandler({
  token: process.env.WHATSAPP_TOKEN!,
  phoneNumberId: process.env.PHONE_NUMBER_ID!,
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  appSecret: process.env.APP_SECRET!
});

// Set up message handlers
whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    console.log('Message from:', metadata.displayName);
    
    if (message.type === 'text') {
      await whatsapp.sendMessage(
        message.from,
        `Echo: ${message.text.body}`
      );
    }
    
    if (message.type === 'image') {
      const mediaUrl = await whatsapp.getMediaUrl(message.image.id);
      console.log('Image URL:', mediaUrl.url);
    }
    
    await whatsapp.markAsRead(message.id);
  },
  
  onMessageStatus: async (status) => {
    console.log('Status update:', status.status);
  }
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const result = whatsapp.verifyWebhookRequest(req.query as any);
  
  if (result.success) {
    res.status(200).send(result.challenge);
  } else {
    res.status(403).json({ error: result.error });
  }
});

// Webhook events (POST)
app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  
  try {
    const result = await whatsapp.processWebhookRequest(req.body, signature);
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Express server running on port 3000');
});
```

### Option 3: Next.js API Routes

#### App Router (Next.js 13+)

Create `app/api/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppHandler } from '@/lib/whatsapp-handler';

const whatsapp = new WhatsAppHandler({
  token: process.env.WHATSAPP_TOKEN!,
  phoneNumberId: process.env.PHONE_NUMBER_ID!,
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  appSecret: process.env.APP_SECRET!
});

// Set up handlers
whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    console.log('Message from:', metadata.displayName);
    
    if (message.type === 'text') {
      await whatsapp.sendMessage(
        message.from,
        `You said: ${message.text.body}`
      );
    }
    
    await whatsapp.markAsRead(message.id);
  },
  
  onMessageStatus: async (status) => {
    console.log('Status:', status.status);
  }
});

// GET - Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());
  
  const result = whatsapp.verifyWebhookRequest(query);
  
  if (result.success) {
    return new NextResponse(result.challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: result.error }, { status: 403 });
}

// POST - Webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-hub-signature-256') || undefined;
    
    const result = await whatsapp.processWebhookRequest(body, signature);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Pages Router (Next.js 12 and below)

Create `pages/api/webhook.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { WhatsAppHandler } from '@/lib/whatsapp-handler';

const whatsapp = new WhatsAppHandler({
  token: process.env.WHATSAPP_TOKEN!,
  phoneNumberId: process.env.PHONE_NUMBER_ID!,
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  appSecret: process.env.APP_SECRET!
});

whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    if (message.type === 'text') {
      await whatsapp.sendMessage(message.from, `Echo: ${message.text.body}`);
    }
    await whatsapp.markAsRead(message.id);
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Webhook verification
    const result = whatsapp.verifyWebhookRequest(req.query as any);
    
    if (result.success) {
      return res.status(200).send(result.challenge);
    }
    
    return res.status(403).json({ error: result.error });
  }
  
  if (req.method === 'POST') {
    // Webhook events
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const result = await whatsapp.processWebhookRequest(req.body, signature);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Option 4: Fastify Integration

```typescript
import Fastify from 'fastify';
import { WhatsAppHandler } from './whatsapp-handler';

const fastify = Fastify({ logger: true });

const whatsapp = new WhatsAppHandler({
  token: process.env.WHATSAPP_TOKEN!,
  phoneNumberId: process.env.PHONE_NUMBER_ID!,
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  appSecret: process.env.APP_SECRET!
});

whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    if (message.type === 'text') {
      await whatsapp.sendMessage(message.from, `Echo: ${message.text.body}`);
    }
  }
});

// Webhook verification
fastify.get('/webhook', async (request, reply) => {
  const result = whatsapp.verifyWebhookRequest(request.query as any);
  
  if (result.success) {
    return reply.status(200).send(result.challenge);
  }
  
  return reply.status(403).send({ error: result.error });
});

// Webhook events
fastify.post('/webhook', async (request, reply) => {
  const signature = request.headers['x-hub-signature-256'] as string;
  
  try {
    const result = await whatsapp.processWebhookRequest(request.body as any, signature);
    return reply.status(200).send(result);
  } catch (error) {
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Fastify server running on port 3000');
});
```

## Advanced Features

### Media Upload

```typescript
import fs from 'fs';

// Upload from file
const fileBuffer = fs.readFileSync('./image.jpg');
const result = await whatsapp.uploadMedia(fileBuffer, 'image/jpeg');
console.log('Media ID:', result.id);

// Send uploaded media
await whatsapp.sendMedia('1234567890', 'image', result.id, 'Caption');

// Get media URL
const mediaInfo = await whatsapp.getMediaUrl('MEDIA_ID');
console.log('URL:', mediaInfo.url);

// Delete media
await whatsapp.deleteMedia('MEDIA_ID');
```

### Interactive Messages

```typescript
// Button message
await whatsapp.sendInteractive('1234567890', {
  type: 'button',
  body: { text: 'Select an option:' },
  footer: { text: 'Powered by WhatsApp' },
  action: {
    buttons: [
      { type: 'reply', reply: { id: 'yes', title: 'Yes ✓' } },
      { type: 'reply', reply: { id: 'no', title: 'No ✗' } }
    ]
  }
});

// List message
await whatsapp.sendInteractive('1234567890', {
  type: 'list',
  body: { text: 'Choose from menu:' },
  action: {
    button: 'View Menu',
    sections: [
      {
        title: 'Main Courses',
        rows: [
          { id: 'pizza', title: 'Pizza', description: '$12.99' },
          { id: 'burger', title: 'Burger', description: '$9.99' }
        ]
      },
      {
        title: 'Drinks',
        rows: [
          { id: 'coke', title: 'Coca Cola', description: '$2.99' }
        ]
      }
    ]
  }
});
```

### Business Profile Management

```typescript
// Get business profile
const profile = await whatsapp.getBusinessProfile();
console.log(profile);

// Update business profile
await whatsapp.updateBusinessProfile({
  about: 'Welcome to our business!',
  address: '123 Main St, City',
  description: 'We provide excellent service',
  email: 'contact@business.com',
  websites: ['https://business.com'],
  vertical: 'RETAIL'
});
```

### Webhook Management

```typescript
// Register webhook with Meta
await whatsapp.registerWebhook(
  'https://yourdomain.com/webhook',
  ['messages', 'message_status']
);

// Get current subscriptions
const subscriptions = await whatsapp.getWebhookSubscriptions();
console.log(subscriptions);

// Test webhook
const testResult = await whatsapp.testWebhook('https://yourdomain.com/webhook');
console.log('Test result:', testResult);
```

## Webhook Event Handlers

```typescript
whatsapp.setWebhookHandlers({
  // Incoming messages
  onMessage: async (message, metadata) => {
    console.log('Message type:', message.type);
    console.log('From:', metadata.displayName);
    
    switch (message.type) {
      case 'text':
        console.log('Text:', message.text.body);
        break;
      case 'image':
        console.log('Image ID:', message.image.id);
        break;
      case 'video':
        console.log('Video ID:', message.video.id);
        break;
      case 'audio':
        console.log('Audio ID:', message.audio.id);
        break;
      case 'document':
        console.log('Document:', message.document.filename);
        break;
      case 'location':
        console.log('Location:', message.location.latitude, message.location.longitude);
        break;
      case 'button':
        console.log('Button clicked:', message.button.text);
        break;
      case 'interactive':
        if (message.interactive.type === 'button_reply') {
          console.log('Button ID:', message.interactive.button_reply.id);
        } else if (message.interactive.type === 'list_reply') {
          console.log('List item:', message.interactive.list_reply.title);
        }
        break;
    }
  },
  
  // Message status updates
  onMessageStatus: async (status) => {
    console.log(`Message ${status.id}: ${status.status}`);
    // Status values: 'sent', 'delivered', 'read', 'failed'
    
    if (status.errors) {
      console.error('Error:', status.errors);
    }
  },
  
  // Account updates
  onAccountUpdate: async (update) => {
    console.log('Account update:', update);
  },
  
  // Phone number changes
  onPhoneChange: async (change) => {
    console.log('Phone number changed:', change);
  },
  
  // Error handling
  onError: async (error) => {
    console.error('Webhook error:', error);
  },
  
  // Unknown events
  onUnknown: async (event) => {
    console.log('Unknown event:', event);
  }
});
```

## Error Handling

```typescript
import { WhatsAppError, RateLimitError, WebhookVerificationError } from './whatsapp-handler';

try {
  await whatsapp.sendMessage('1234567890', 'Hello!');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof WebhookVerificationError) {
    console.error('Webhook verification failed:', error.message);
  } else if (error instanceof WhatsAppError) {
    console.error('WhatsApp API error:', error.code, error.message);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Environment Variables

Create a `.env` file:

```env
WHATSAPP_TOKEN=your_access_token
PHONE_NUMBER_ID=your_phone_number_id
WEBHOOK_VERIFY_TOKEN=your_verify_token
APP_SECRET=your_app_secret
BUSINESS_ACCOUNT_ID=your_business_account_id
```

## Configuration Options

```typescript
{
  token: string;                  // Required: WhatsApp Access Token
  phoneNumberId: string;          // Required: Phone Number ID
  businessAccountId?: string;     // Optional: For webhook registration
  version?: string;               // Optional: API version (default: 'v21.0')
  appSecret?: string;             // Optional: For signature verification
  webhookVerifyToken?: string;    // Optional: For webhook verification
  apiTimeout?: number;            // Optional: Request timeout in ms (default: 30000)
  maxRetries?: number;            // Optional: Max retry attempts (default: 3)
  rateLimitPerSecond?: number;    // Optional: Rate limit (default: 80)
}
```

## TypeScript Support

Full TypeScript definitions included:

```typescript
import {
  WhatsAppHandler,
  WhatsAppConfig,
  WebhookHandlers,
  MessageMetadata,
  MediaType,
  TextMessage,
  MediaMessage,
  LocationMessage,
  ContactMessage,
  TemplateMessage,
  InteractiveMessage,
  WhatsAppError,
  RateLimitError,
  WebhookVerificationError
} from './whatsapp-handler';
```

## Testing

Test your webhook locally using ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your server
node server.js

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL in Meta Business Suite
# Example: https://abc123.ngrok.io/webhook
```

## Security Best Practices

1. **Always verify webhook signatures** in production
2. **Use environment variables** for sensitive data
3. **Implement rate limiting** on your endpoints
4. **Validate incoming data** before processing
5. **Use HTTPS** for webhook URLs
6. **Rotate tokens** regularly

## Common Issues

### Webhook Verification Failed
- Ensure `webhookVerifyToken` matches the one in Meta Business Suite
- Check that your server is publicly accessible

### Signature Verification Failed
- Verify `appSecret` is correct
- Ensure you're passing the raw request body (not parsed)

### Rate Limiting
- Respect WhatsApp's rate limits (80 requests/second by default)
- The handler automatically retries with backoff

### Media Upload Issues
- Check file size limits (image: 5MB, video: 16MB, document: 100MB)
- Verify MIME type is correct

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
- WhatsApp Business API Documentation: https://developers.facebook.com/docs/whatsapp
- GitHub Issues: [Your repo URL]

## Changelog

### v1.0.0
- Initial release
- Full WhatsApp Business API support
- Webhook handling with signature verification
- Built-in HTTP server
- Express.js, Next.js, and Fastify integration examples
- TypeScript support
- Rate limiting and retry mechanisms