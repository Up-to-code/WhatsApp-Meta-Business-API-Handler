# WhatsApp Meta Business API Handler

A lightweight, easy-to-use TypeScript wrapper for WhatsApp Cloud API. Send messages, media, buttons, and more with full type safety.

## Features

- ✅ **Full TypeScript support** with type definitions
- ✅ Send text messages
- ✅ Send media (images, videos, audio, documents)
- ✅ Mark messages as read
- ✅ Send reactions (emojis)
- ✅ Send location
- ✅ Send template messages
- ✅ Send interactive buttons
- ✅ Send interactive lists
- ✅ Upload and download media
- ✅ Read messages by ID

## Prerequisites

Before using this handler, you need:

1. **Meta Business Account** - Sign up at [business.facebook.com](https://business.facebook.com)
2. **WhatsApp Business App** - Create one in Meta Business Suite
3. **Phone Number ID** - Get this from your WhatsApp Business API setup
4. **Access Token** - Generate from Meta Developer Portal
5. **Verified Business Phone Number** - Required for sending messages

## Installation

```bash
npm install @types/node
```

Then import the class:

```typescript
import WhatsAppHandler from './WhatsAppHandler';
```

## Configuration

Initialize the handler with your credentials:

```typescript
const whatsapp = new WhatsAppHandler({
  token: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  businessAccountId: 'YOUR_BUSINESS_ACCOUNT_ID', // optional
  version: 'v21.0' // API version, optional (default: v21.0)
});
```

### Getting Your Credentials

1. **Access Token**: Go to Meta Developer Portal → Your App → WhatsApp → API Setup
2. **Phone Number ID**: Found in the same API Setup section
3. **Business Account ID**: Available in Business Settings

## Usage Examples

### Send Text Message

```typescript
await whatsapp.sendMessage('1234567890', 'Hello from WhatsApp API!');
```

**Note**: Phone numbers should include country code without the `+` sign (e.g., `1234567890` for US number).

### Send Image with Caption

```typescript
await whatsapp.sendMediaWithMessage(
  '1234567890', 
  'image', 
  'https://example.com/image.jpg', 
  'Check out this amazing photo!'
);
```

### Send Document

```typescript
await whatsapp.sendMedia(
  '1234567890',
  'document',
  'https://example.com/report.pdf',
  { filename: 'Monthly_Report.pdf' }
);
```

### Mark Message as Read

```typescript
await whatsapp.markAsRead('wamid.HBgNMTIzNDU2Nzg5MAxx==');
```

### Send Reaction

```typescript
await whatsapp.sendReaction('1234567890', 'wamid.XXX==', '👍');
```

### Send Location

```typescript
await whatsapp.sendLocation(
  '1234567890',
  37.7749,
  -122.4194,
  'San Francisco Office',
  '123 Market St, San Francisco, CA'
);
```

### Send Interactive Buttons

```typescript
await whatsapp.sendButtons(
  '1234567890',
  'Please select an option:',
  [
    { id: 'option1', title: 'Option 1' },
    { id: 'option2', title: 'Option 2' },
    { id: 'option3', title: 'Option 3' }
  ],
  {
    header: 'Welcome!',
    footer: 'Powered by WhatsApp API'
  }
);
```

### Send Interactive List

```typescript
await whatsapp.sendList(
  '1234567890',
  'Choose a product category:',
  'View Options',
  [
    {
      title: 'Electronics',
      rows: [
        { id: 'phone', title: 'Smartphones', description: 'Latest phones' },
        { id: 'laptop', title: 'Laptops', description: 'Premium laptops' }
      ]
    },
    {
      title: 'Clothing',
      rows: [
        { id: 'shirt', title: 'Shirts', description: 'Casual wear' },
        { id: 'shoes', title: 'Shoes', description: 'Sports shoes' }
      ]
    }
  ],
  {
    header: 'Product Catalog',
    footer: 'Select to view details'
  }
);
```

### Send Template Message

```typescript
await whatsapp.sendTemplate(
  '1234567890',
  'hello_world',
  'en_US',
  [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'John Doe' }
      ]
    }
  ]
);
```

### Upload Media

```typescript
// Upload from File object
const file = document.getElementById('fileInput').files[0];
const response = await whatsapp.uploadMedia(file);
console.log('Media ID:', response.id);

// Use the media ID to send
await whatsapp.sendMedia('1234567890', 'image', response.id);
```

### Get Media URL

```typescript
const mediaInfo = await whatsapp.getMediaUrl('MEDIA_ID');
console.log('Media URL:', mediaInfo.url);
```

### Download Media

```typescript
const mediaUrl = 'https://lookaside.fbsbx.com/whatsapp_business/...';
const blob = await whatsapp.downloadMedia(mediaUrl);

// Create download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'media-file';
a.click();
```

## TypeScript Types

### Interfaces

```typescript
interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
  version?: string;
}

interface Button {
  id: string;
  title: string;
}

interface ListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

type MediaType = 'image' | 'video' | 'audio' | 'document';
```

### Response Types

```typescript
interface MessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface MediaResponse {
  id: string;
}

interface MediaUrlResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}
```

## API Methods Reference

| Method | Return Type | Parameters |
|--------|-------------|------------|
| `sendMessage()` | `Promise<MessageResponse>` | `to: string, message: string` |
| `sendMedia()` | `Promise<MessageResponse>` | `to: string, mediaType: MediaType, mediaUrl: string, options?` |
| `sendMediaWithMessage()` | `Promise<MessageResponse>` | `to: string, mediaType: MediaType, mediaUrl: string, caption: string` |
| `markAsRead()` | `Promise<{success: boolean}>` | `messageId: string` |
| `readMessage()` | `Promise<any>` | `messageId: string` |
| `sendReaction()` | `Promise<MessageResponse>` | `to: string, messageId: string, emoji: string` |
| `sendLocation()` | `Promise<MessageResponse>` | `to: string, latitude: number, longitude: number, name: string, address: string` |
| `sendTemplate()` | `Promise<MessageResponse>` | `to: string, templateName: string, languageCode: string, components?` |
| `sendButtons()` | `Promise<MessageResponse>` | `to: string, bodyText: string, buttons: Button[], options?` |
| `sendList()` | `Promise<MessageResponse>` | `to: string, bodyText: string, buttonText: string, sections: ListSection[], options?` |
| `uploadMedia()` | `Promise<MediaResponse>` | `file: File \| Blob` |
| `getMediaUrl()` | `Promise<MediaUrlResponse>` | `mediaId: string` |
| `downloadMedia()` | `Promise<Blob>` | `mediaUrl: string` |

## Media Types

Supported media types:
- `image` - JPEG, PNG
- `video` - MP4, 3GPP
- `audio` - AAC, MP3, AMR, OGG
- `document` - PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

## Error Handling

All methods return promises and will throw errors if the API request fails:

```typescript
try {
  await whatsapp.sendMessage('1234567890', 'Hello!');
  console.log('Message sent successfully');
} catch (error) {
  console.error('Failed to send message:', error.message);
}
```

## Rate Limits

WhatsApp Cloud API has rate limits:
- **80 messages per second** per phone number
- **1000 conversations per day** for free tier
- Check Meta documentation for current limits

## Best Practices

1. **Store tokens securely** - Never expose access tokens in client-side code
2. **Validate phone numbers** - Ensure proper format before sending
3. **Handle webhooks** - Set up webhook handlers to receive incoming messages
4. **Use templates** - For initial contact, use approved message templates
5. **Respect opt-ins** - Only message users who have opted in
6. **Monitor API responses** - Check for errors and handle accordingly

## Webhook Integration

To receive messages, you'll need to set up webhook handlers. Here's a basic Express.js + TypeScript example:

```typescript
import express, { Request, Response } from 'express';

app.post('/webhook', async (req: Request, res: Response) => {
  const data = req.body;
  
  if (data.entry?.[0]?.changes?.[0]?.value?.messages) {
    const message = data.entry[0].changes[0].value.messages[0];
    console.log('Received message:', message);
    
    // Process message here
    // Mark as read
    await whatsapp.markAsRead(message.id);
  }
  
  res.sendStatus(200);
});
```

## Troubleshooting

**Message not sending?**
- Verify phone number format (country code without +)
- Check access token validity
- Ensure phone number is verified
- Verify you have active conversations quota

**Media upload failing?**
- Check file size (max 16MB for most types)
- Verify file format is supported
- Ensure proper content type

**Template rejected?**
- Templates must be pre-approved by Meta
- Check template name and language code
- Verify parameter count matches template

**TypeScript compilation errors?**
- Ensure you're using TypeScript 4.0+
- Install required type definitions: `npm install @types/node`

## Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Suite](https://business.facebook.com)
- [API Changelog](https://developers.facebook.com/docs/whatsapp/cloud-api/changelog)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## License

MIT License - feel free to use this in your projects!

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Support

For API-specific issues, refer to [Meta's WhatsApp Business Platform Support](https://developers.facebook.com/support).

---

**Note**: This handler requires an active Meta Business account and WhatsApp Business API access. Pricing applies based on conversation volume.