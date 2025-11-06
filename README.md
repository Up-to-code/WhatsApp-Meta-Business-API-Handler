# WhatsApp Business API Handler - Complete Documentation

## 📚 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Webhook Setup](#webhook-setup)
6. [Sending Messages](#sending-messages)
7. [Message Types](#message-types)
8. [Webhook Handlers](#webhook-handlers)
9. [Storage & History](#storage--history)
10. [Conversation Management](#conversation-management)
11. [Advanced Features](#advanced-features)
12. [API Reference](#api-reference)
13. [Examples](#examples)
14. [Troubleshooting](#troubleshooting)

---

## Overview

A comprehensive TypeScript/Node.js library for integrating WhatsApp Business API with support for:

- ✅ Universal webhook handling (Express, Next.js, Fastify, Koa, HTTP)
- 💬 All message types (text, media, voice, location, contacts)
- 📦 Message storage and retrieval
- 🔄 Conversation state management
- 📊 Real-time statistics
- 🔐 Webhook signature verification
- ⚡ Message queuing with retry logic
- 🎯 Event-driven architecture

---

## Installation

```bash
npm install @your-package/whatsapp-handler
# or
yarn add @your-package/whatsapp-handler
```

### Requirements

- Node.js 16+
- WhatsApp Business API credentials
- Meta Business Account

---

## Quick Start

### Basic Setup

```typescript
import { createWhatsAppHandler } from './whatsapp-handler';

const whatsapp = createWhatsAppHandler({
  token: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  webhookVerifyToken: 'YOUR_VERIFY_TOKEN'
});

// Send a message
await whatsapp.sendMessage('1234567890', 'Hello from WhatsApp!');
```

### Using Environment Variables

```typescript
import { createWhatsAppHandlerFromEnv } from './whatsapp-handler';

// Reads from process.env automatically
const whatsapp = createWhatsAppHandlerFromEnv();
```

Required environment variables:
```env
WHATSAPP_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret
```

---

## Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | **Required** | WhatsApp API access token |
| `phoneNumberId` | `string` | **Required** | Your WhatsApp phone number ID |
| `businessAccountId` | `string` | Optional | Business account ID |
| `version` | `string` | `'v21.0'` | API version |
| `appSecret` | `string` | Optional | App secret for signature verification |
| `webhookVerifyToken` | `string` | Optional | Token for webhook verification |
| `apiTimeout` | `number` | `30000` | API request timeout (ms) |
| `maxRetries` | `number` | `3` | Max retry attempts for failed requests |
| `autoMarkRead` | `boolean` | `true` | Auto-mark messages as read |
| `autoProcessMessages` | `boolean` | `true` | Auto-process incoming messages |
| `queueEnabled` | `boolean` | `true` | Enable message queue |
| `maxQueueSize` | `number` | `1000` | Maximum queue size |

### Full Configuration Example

```typescript
const whatsapp = createWhatsAppHandler({
  token: 'YOUR_TOKEN',
  phoneNumberId: 'YOUR_PHONE_ID',
  businessAccountId: 'YOUR_BUSINESS_ID',
  version: 'v21.0',
  appSecret: 'YOUR_APP_SECRET',
  webhookVerifyToken: 'YOUR_VERIFY_TOKEN',
  apiTimeout: 30000,
  maxRetries: 3,
  autoMarkRead: true,
  autoProcessMessages: true,
  queueEnabled: true,
  maxQueueSize: 1000,
  storage: {
    type: 'memory',
    autoCleanup: true,
    maxMessagesPerConversation: 1000
  },
  webhook: {
    verifyToken: 'YOUR_VERIFY_TOKEN',
    appSecret: 'YOUR_APP_SECRET',
    autoProcess: true,
    autoMarkRead: true,
    verifySignature: true,
    maxBodySize: 10485760, // 10MB
    timeout: 30000
  }
});
```

---

## Webhook Setup

### Express.js

```typescript
import express from 'express';

const app = express();
app.use(express.json());

// Use as middleware
app.post('/webhook', whatsapp.expressMiddleware());
app.get('/webhook', whatsapp.expressMiddleware());

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Next.js (App Router)

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const result = await whatsapp.processWebhook({
    method: 'POST',
    headers: Object.fromEntries(req.headers),
    body,
    query: Object.fromEntries(req.nextUrl.searchParams)
  });

  return NextResponse.json(result.data, { status: result.status });
}

export async function GET(req: NextRequest) {
  const result = await whatsapp.processWebhook({
    method: 'GET',
    headers: Object.fromEntries(req.headers),
    query: Object.fromEntries(req.nextUrl.searchParams)
  });

  if (result.challenge) {
    return new NextResponse(result.challenge, { status: 200 });
  }

  return NextResponse.json(result.data, { status: result.status });
}
```

### Next.js (Pages Router)

```typescript
// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await whatsapp.nextjsHandler(req, res);
}
```

### Standalone HTTP Server

```typescript
// Start built-in server
const server = whatsapp.startWebhookServer(3000, '/webhook', () => {
  console.log('Webhook server started on port 3000');
});

// Stop server
await whatsapp.stopWebhookServer();
```

### Generic/Universal Handler

```typescript
// Works with any framework
const result = await whatsapp.processWebhook({
  method: 'POST',
  headers: req.headers,
  body: req.body,
  query: req.query,
  rawBody: req.rawBody
});
```

---

## Sending Messages

### Text Messages

```typescript
// Simple text message
await whatsapp.sendMessage('1234567890', 'Hello World!');

// With URL preview
await whatsapp.sendMessage('1234567890', 'Check this out: https://example.com', {
  previewUrl: true
});

// Reply to a message
await whatsapp.sendMessage('1234567890', 'Thanks for your message!', {
  replyTo: 'MESSAGE_ID'
});

// With priority (for queue)
await whatsapp.sendMessage('1234567890', 'Urgent message!', {
  priority: 1,
  queueIfBusy: true
});
```

### Voice Messages

```typescript
// Using media ID
await whatsapp.sendVoice('1234567890', 'MEDIA_ID');

// Using URL
await whatsapp.sendVoice('1234567890', 'https://example.com/audio.mp3');

// With reply
await whatsapp.sendVoice('1234567890', 'MEDIA_ID', {
  replyTo: 'MESSAGE_ID'
});
```

### Mark as Read

```typescript
await whatsapp.markAsRead('MESSAGE_ID');
```

---

## Message Types

### Supported Message Types

| Type | Icon | Description | Example Handler |
|------|------|-------------|-----------------|
| Text | 💬 | Plain text messages | `onMessage` |
| Image | 📸 | Photo messages | `onMedia` |
| Video | 🎥 | Video messages | `onMedia` |
| Audio | 🎵 | Audio files | `onMedia` |
| Voice | 🎵 | Voice notes | `onVoice` |
| Document | 📄 | PDF, docs, etc. | `onMedia` |
| Sticker | 💬 | Sticker messages | `onMedia` |
| Location | 📍 | GPS coordinates | `onLocation` |
| Contact | 👤 | Contact cards | `onContact` |
| Interactive | 📋 | Buttons/lists | `onInteractive` |
| Reaction | ❤️ | Message reactions | `onReaction` |

### Message Status Types

| Status | Icon | Description |
|--------|------|-------------|
| Sent | 🚀 | Message sent to WhatsApp servers |
| Delivered | ✅ | Message delivered to recipient |
| Read | 🔍 | Message read by recipient |
| Failed | ❌ | Message failed to send |

---

## Webhook Handlers

### Setting Up Handlers

```typescript
whatsapp.setWebhookHandlers({
  // Handle all incoming messages
  onMessage: async (message, metadata) => {
    console.log('New message:', message);
    console.log('From:', metadata.displayName);
    console.log('Phone:', metadata.waId);
  },

  // Handle message status updates
  onMessageStatus: async (status) => {
    console.log('Message status:', status.status);
    console.log('Message ID:', status.id);
  },

  // Handle voice messages
  onVoice: async (voice, metadata) => {
    console.log('Voice message received');
    console.log('Media ID:', voice.media?.id);
  },

  // Handle media (images, videos, documents)
  onMedia: async (media, metadata) => {
    console.log('Media type:', media.media?.type);
    console.log('Media ID:', media.media?.id);
    console.log('Caption:', media.media?.caption);
  },

  // Handle location messages
  onLocation: async (location, metadata) => {
    console.log('Location:', location.location);
    console.log('Coordinates:', {
      lat: location.location?.latitude,
      lng: location.location?.longitude
    });
  },

  // Handle contact messages
  onContact: async (contact, metadata) => {
    console.log('Contacts:', contact.contacts);
  },

  // Handle interactive messages (buttons, lists)
  onInteractive: async (interactive, metadata) => {
    console.log('Interactive type:', interactive.interactive?.type);
    console.log('Button reply:', interactive.interactive?.button_reply);
  },

  // Handle reactions
  onReaction: async (reaction, metadata) => {
    console.log('Reaction:', reaction.reaction?.emoji);
    console.log('To message:', reaction.reaction?.message_id);
  },

  // Handle errors
  onError: async (error) => {
    console.error('Error:', error);
  },

  // Handle unknown events
  onUnknown: async (event) => {
    console.log('Unknown event:', event);
  }
});
```

### Metadata Object

```typescript
interface MessageMetadata {
  phoneNumberId?: string;      // Your phone number ID
  displayPhoneNumber?: string;  // Your display number
  displayName?: string;         // Sender's name
  waId?: string;               // Sender's WhatsApp ID
  timestamp?: string;          // Message timestamp
  messageId?: string;          // Message ID
}
```

---

## Storage & History

### Get Conversation History

```typescript
// Get last 50 messages
const messages = await whatsapp.getConversationHistory('1234567890');

// With pagination
const messages = await whatsapp.getConversationHistory('1234567890', 20, 0);
```

### Search Messages

```typescript
// Search in all conversations
const results = await whatsapp.searchMessages('hello');

// Search in specific conversation
const results = await whatsapp.searchMessages('hello', '1234567890');
```

### Stored Message Structure

```typescript
interface StoredMessage {
  id: string;                  // Internal message ID
  whatsappId?: string;         // WhatsApp message ID
  conversationId: string;      // Phone number
  direction: 'incoming' | 'outgoing';
  type: string;               // Message type
  content: any;               // Message content
  timestamp: number;          // Unix timestamp
  status: MessageStatus;      // Message status
  media?: {                   // Media info (if applicable)
    id?: string;
    url?: string;
    mimeType: string;
    fileName?: string;
    fileSize?: number;
  };
  error?: {                   // Error info (if failed)
    code: number;
    message: string;
    details?: any;
  };
}
```

---

## Conversation Management

### Get Conversation State

```typescript
const state = whatsapp.getConversationState('1234567890');

console.log(state);
// {
//   id: '1234567890',
//   state: 'active',
//   lastActivity: Date,
//   messageCount: 42,
//   displayName: 'John Doe',
//   metadata: {},
//   currentStep: 'waiting_for_response',
//   context: {}
// }
```

### Update Conversation Context

```typescript
// Store custom data for conversation
whatsapp.updateConversationContext('1234567890', {
  userName: 'John',
  preferredLanguage: 'en',
  orderInProgress: true,
  cartItems: ['item1', 'item2']
});
```

### Conversation State Structure

```typescript
interface ConversationState {
  id: string;                    // Conversation ID (phone number)
  state: 'active' | 'waiting' | 'completed' | 'archived';
  lastActivity: Date;            // Last message timestamp
  messageCount: number;          // Total messages
  displayName: string;           // User's display name
  metadata: Record<string, any>; // System metadata
  currentStep?: string;          // Current conversation step
  context: Record<string, any>;  // Custom context data
}
```

---

## Advanced Features

### Event Emitters

```typescript
// Listen to events
whatsapp.on('messageSent', (data) => {
  console.log('Message sent:', data.messageId);
});

whatsapp.on('messageFailed', (data) => {
  console.error('Message failed:', data.error);
});

whatsapp.on('messageRead', (data) => {
  console.log('Message read:', data.messageId);
});

whatsapp.on('storageCleaned', (data) => {
  console.log('Cleaned messages:', data.deletedCount);
});

whatsapp.on('queuedMessageSent', (data) => {
  console.log('Queued message sent:', data.queueId);
});

whatsapp.on('queuedMessageFailed', (data) => {
  console.error('Queued message failed:', data.error);
});
```

### Statistics

```typescript
// Get message statistics
const stats = whatsapp.getStatistics();

console.log(stats);
// {
//   sent: 150,
//   received: 320,
//   failed: 5,
//   delivered: 145,
//   read: 130
// }
```

### Queue Management

```typescript
// Get queue statistics
const queueStats = whatsapp.getQueueStats();

console.log(queueStats);
// {
//   size: 10,
//   maxSize: 1000,
//   usagePercentage: 1
// }
```

### Middleware Support

```typescript
// Add custom middleware
whatsapp.use(async (event, metadata) => {
  console.log('Processing event:', event);
  
  // Return false to stop processing
  if (event.type === 'spam') {
    return false;
  }
  
  // Return true to continue
  return true;
});
```

---

## API Reference

### Core Methods

#### `sendMessage(to, message, options?)`
Send a text message.

**Parameters:**
- `to` (string): Recipient phone number
- `message` (string): Message text
- `options` (object, optional):
  - `previewUrl` (boolean): Enable URL preview
  - `replyTo` (string): Message ID to reply to
  - `priority` (number): Message priority
  - `queueIfBusy` (boolean): Queue if busy

**Returns:** `Promise<MessageResponse>`

---

#### `sendVoice(to, audioIdOrUrl, options?)`
Send a voice message.

**Parameters:**
- `to` (string): Recipient phone number
- `audioIdOrUrl` (string): Media ID or URL
- `options` (object, optional):
  - `replyTo` (string): Message ID to reply to
  - `priority` (number): Message priority

**Returns:** `Promise<MessageResponse>`

---

#### `markAsRead(messageId)`
Mark a message as read.

**Parameters:**
- `messageId` (string): WhatsApp message ID

**Returns:** `Promise<{ success: boolean }>`

---

#### `processWebhook(request)`
Process a webhook request (universal handler).

**Parameters:**
- `request` (UniversalRequest): Request object

**Returns:** `Promise<WebhookResult>`

---

#### `setWebhookHandlers(handlers)`
Set webhook event handlers.

**Parameters:**
- `handlers` (WebhookHandlers): Handler functions

**Returns:** `void`

---

#### `getConversationHistory(conversationId, limit?, offset?)`
Get conversation message history.

**Parameters:**
- `conversationId` (string): Phone number
- `limit` (number, optional): Max messages (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:** `Promise<StoredMessage[]>`

---

#### `searchMessages(query, conversationId?)`
Search messages by text.

**Parameters:**
- `query` (string): Search term
- `conversationId` (string, optional): Limit to conversation

**Returns:** `Promise<StoredMessage[]>`

---

#### `getConversationState(conversationId)`
Get conversation state.

**Parameters:**
- `conversationId` (string): Phone number

**Returns:** `ConversationState | undefined`

---

#### `updateConversationContext(conversationId, context)`
Update conversation context data.

**Parameters:**
- `conversationId` (string): Phone number
- `context` (object): Context data to merge

**Returns:** `ConversationState`

---

#### `getStatistics()`
Get message statistics.

**Returns:** Object with sent, received, failed, delivered, read counts

---

#### `getQueueStats()`
Get message queue statistics.

**Returns:** Object with size, maxSize, usagePercentage

---

#### `startWebhookServer(port?, path?, callback?)`
Start standalone HTTP webhook server.

**Parameters:**
- `port` (number, optional): Port (default: 3000)
- `path` (string, optional): Webhook path (default: '/webhook')
- `callback` (function, optional): Success callback

**Returns:** `http.Server`

---

#### `stopWebhookServer()`
Stop webhook server.

**Returns:** `Promise<void>`

---

## Examples

### Complete Express.js Bot

```typescript
import express from 'express';
import { createWhatsAppHandler } from './whatsapp-handler';

const app = express();
app.use(express.json());

const whatsapp = createWhatsAppHandler({
  token: process.env.WHATSAPP_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!
});

// Set up handlers
whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    const text = message.text?.body;
    const from = metadata.waId!;

    if (!text) return;

    // Echo bot
    if (text.toLowerCase() === 'hello') {
      await whatsapp.sendMessage(from, 'Hello! How can I help you?');
    }
    else if (text.toLowerCase() === 'help') {
      await whatsapp.sendMessage(from, 
        'Available commands:\n- hello\n- help\n- history'
      );
    }
    else if (text.toLowerCase() === 'history') {
      const history = await whatsapp.getConversationHistory(from, 5);
      await whatsapp.sendMessage(from, 
        `You have ${history.length} recent messages`
      );
    }
    else {
      await whatsapp.sendMessage(from, `You said: ${text}`);
    }
  },

  onVoice: async (voice, metadata) => {
    const from = metadata.waId!;
    await whatsapp.sendMessage(from, 'Thanks for the voice message!');
  },

  onLocation: async (location, metadata) => {
    const from = metadata.waId!;
    const { latitude, longitude } = location.location!;
    await whatsapp.sendMessage(from, 
      `Got your location: ${latitude}, ${longitude}`
    );
  }
});

// Webhook endpoint
app.use('/webhook', whatsapp.expressMiddleware());

// Start server
app.listen(3000, () => {
  console.log('Bot running on port 3000');
});
```

### Conversation Flow Example

```typescript
whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    const text = message.text?.body;
    const from = metadata.waId!;
    
    // Get conversation state
    const state = whatsapp.getConversationState(from);
    const step = state?.currentStep || 'start';

    switch (step) {
      case 'start':
        await whatsapp.sendMessage(from, 'What\'s your name?');
        whatsapp.updateConversationContext(from, { currentStep: 'name' });
        break;

      case 'name':
        whatsapp.updateConversationContext(from, { 
          currentStep: 'email',
          userName: text 
        });
        await whatsapp.sendMessage(from, `Nice to meet you, ${text}! What\'s your email?`);
        break;

      case 'email':
        const context = whatsapp.getConversationState(from)?.context;
        whatsapp.updateConversationContext(from, { 
          currentStep: 'completed',
          userEmail: text 
        });
        await whatsapp.sendMessage(from, 
          `Thanks ${context?.userName}! We've saved your email: ${text}`
        );
        break;

      case 'completed':
        await whatsapp.sendMessage(from, 
          'Your registration is complete! Type "restart" to start over.'
        );
        if (text?.toLowerCase() === 'restart') {
          whatsapp.updateConversationContext(from, { currentStep: 'start' });
        }
        break;
    }
  }
});
```

### Message Queue Example

```typescript
// Send bulk messages with queue
const recipients = ['1111111111', '2222222222', '3333333333'];

for (const recipient of recipients) {
  await whatsapp.sendMessage(recipient, 'Bulk message', {
    queueIfBusy: true,
    priority: 0
  });
}

// Listen for queue events
whatsapp.on('queuedMessageSent', (data) => {
  console.log(`Queued message sent: ${data.messageId}`);
});

whatsapp.on('queuedMessageFailed', (data) => {
  console.error(`Queued message failed after ${data.attempts} attempts`);
});

// Monitor queue
setInterval(() => {
  const stats = whatsapp.getQueueStats();
  console.log(`Queue: ${stats.size}/${stats.maxSize} (${stats.usagePercentage.toFixed(2)}%)`);
}, 5000);
```

---

## Troubleshooting

### Common Issues

#### 1. Webhook Verification Fails

**Problem:** GET webhook returns 403

**Solution:**
```typescript
// Ensure verify token matches
const whatsapp = createWhatsAppHandler({
  webhookVerifyToken: 'same_token_in_meta_dashboard'
});
```

---

#### 2. Signature Verification Fails

**Problem:** POST webhook returns 401

**Solution:**
```typescript
// Add app secret and enable verification
const whatsapp = createWhatsAppHandler({
  appSecret: 'your_app_secret',
  webhook: {
    verifySignature: true,
    appSecret: 'your_app_secret'
  }
});
```

---

#### 3. Messages Not Sending

**Problem:** Messages fail silently

**Solution:**
```typescript
// Listen for errors
whatsapp.on('messageFailed', (data) => {
  console.error('Failed:', data.error);
});

// Check API credentials
console.log('Token:', process.env.WHATSAPP_TOKEN);
console.log('Phone ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
```

---

#### 4. Webhook Not Receiving Events

**Problem:** No events received

**Checklist:**
- ✅ Webhook URL is publicly accessible
- ✅ SSL certificate is valid
- ✅ Webhook is subscribed in Meta dashboard
- ✅ Verify token matches
- ✅ Server is running and reachable

**Test webhook:**
```bash
# Test GET (verification)
curl "http://your-domain.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Test POST (message)
curl -X POST http://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

---

#### 5. Rate Limiting

**Problem:** 429 Too Many Requests

**Solution:**
```typescript
// Enable queue to handle rate limits
const whatsapp = createWhatsAppHandler({
  queueEnabled: true,
  maxQueueSize: 1000,
  maxRetries: 3
});

// Send with queue
await whatsapp.sendMessage(to, message, { queueIfBusy: true });
```

---

### Debug Mode

```typescript
// Enable verbose logging
whatsapp.on('messageSent', console.log);
whatsapp.on('messageFailed', console.error);
whatsapp.on('messageRead', console.log);

// Log all webhook events
whatsapp.setWebhookHandlers({
  onMessage: (msg, meta) => console.log('Message:', msg, meta),
  onMessageStatus: (status) => console.log('Status:', status),
  onError: (error) => console.error('Error:', error),
  onUnknown: (event) => console.log('Unknown:', event)
});
```

---

## Best Practices

### 1. Error Handling

```typescript
try {
  await whatsapp.sendMessage(to, message);
} catch (error) {
  console.error('Failed to send message:', error);
  // Implement retry logic or alert
}
```

### 2. Message Validation

```typescript
whatsapp.setWebhookHandlers({
  onMessage: async (message, metadata) => {
    const text = message.text?.body;
    
    // Validate message exists
    if (!text) return;
    
    // Validate sender
    if (!metadata.waId) return;
    
    // Process message
    await processMessage(text, metadata.waId);
  }
});
```

### 3. Rate Limit Handling

```typescript
// Use queue for bulk operations
for (const recipient of largeRecipientList) {
  await whatsapp.sendMessage(recipient, message, {
    queueIfBusy: true
  });
  
  // Add small delay
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 4. Storage Management

```typescript
// Enable auto-cleanup
const whatsapp = createWhatsAppHandler({
  storage: {
    type: 'memory',
    autoCleanup: true,
    maxMessagesPerConversation: 1000
  }
});

// Or manual cleanup
whatsapp.on('storageCleaned', (data) => {
  console.log(`Cleaned ${data.deletedCount} old messages`);
});
```

---

## Support & Resources

- 📖 [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- 🔧 [Meta Business Suite](https://business.facebook.com)
- 💬 [GitHub Issues](https://github.com/your-repo/issues)

---

## License

MIT License - Copyright (c) 2023 Up-to-code

---

**Made with ❤️ for the WhatsApp Business API community**