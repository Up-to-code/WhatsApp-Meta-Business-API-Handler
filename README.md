# WhatsApp Meta Business API Handler

A comprehensive JavaScript class for interacting with the WhatsApp Cloud API (Meta Business Platform). This handler simplifies sending messages, media, interactive buttons, templates, and more through WhatsApp Business.

## Features

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

Simply import the class into your project:

```javascript
import WhatsAppHandler from './WhatsAppHandler.js';
```

Or copy the class directly into your codebase.

## Configuration

Initialize the handler with your credentials:

```javascript
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

```javascript
await whatsapp.sendMessage('1234567890', 'Hello from WhatsApp API!');
```

**Note**: Phone numbers should include country code without the `+` sign (e.g., `1234567890` for US number).

### Send Image with Caption

```javascript
await whatsapp.sendMediaWithMessage(
  '1234567890', 
  'image', 
  'https://example.com/image.jpg', 
  'Check out this amazing photo!'
);
```

### Send Document

```javascript
await whatsapp.sendMedia(
  '1234567890',
  'document',
  'https://example.com/report.pdf',
  { filename: 'Monthly_Report.pdf' }
);
```

### Mark Message as Read

```javascript
await whatsapp.markAsRead('wamid.HBgNMTIzNDU2Nzg5MAxx==');
```

### Send Reaction

```javascript
await whatsapp.sendReaction('1234567890', 'wamid.XXX==', '👍');
```

### Send Location

```javascript
await whatsapp.sendLocation(
  '1234567890',
  37.7749,
  -122.4194,
  'San Francisco Office',
  '123 Market St, San Francisco, CA'
);
```

### Send Interactive Buttons

```javascript
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

```javascript
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

```javascript
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

```javascript
// Upload from File object
const file = document.getElementById('fileInput').files[0];
const response = await whatsapp.uploadMedia(file);
console.log('Media ID:', response.id);

// Use the media ID to send
await whatsapp.sendMedia('1234567890', 'image', response.id);
```

### Get Media URL

```javascript
const mediaInfo = await whatsapp.getMediaUrl('MEDIA_ID');
console.log('Media URL:', mediaInfo.url);
```

### Download Media

```javascript
const mediaUrl = 'https://lookaside.fbsbx.com/whatsapp_business/...';
const blob = await whatsapp.downloadMedia(mediaUrl);

// Create download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'media-file';
a.click();
```

## API Methods Reference

| Method | Description | Parameters |
|--------|-------------|------------|
| `sendMessage()` | Send text message | `to, message` |
| `sendMedia()` | Send media file | `to, mediaType, mediaUrl, options` |
| `sendMediaWithMessage()` | Send media with caption | `to, mediaType, mediaUrl, caption` |
| `markAsRead()` | Mark message as read | `messageId` |
| `readMessage()` | Get message details | `messageId` |
| `sendReaction()` | React to message | `to, messageId, emoji` |
| `sendLocation()` | Send location | `to, latitude, longitude, name, address` |
| `sendTemplate()` | Send template message | `to, templateName, languageCode, components` |
| `sendButtons()` | Send interactive buttons | `to, bodyText, buttons, options` |
| `sendList()` | Send interactive list | `to, bodyText, buttonText, sections, options` |
| `uploadMedia()` | Upload media to WhatsApp | `file` |
| `getMediaUrl()` | Get media URL | `mediaId` |
| `downloadMedia()` | Download media file | `mediaUrl` |

## Media Types

Supported media types:
- `image` - JPEG, PNG
- `video` - MP4, 3GPP
- `audio` - AAC, MP3, AMR, OGG
- `document` - PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

## Error Handling

All methods return promises and will throw errors if the API request fails:

```javascript
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

To receive messages, you'll need to set up webhook handlers. Here's a basic Express.js example:

```javascript
app.post('/webhook', (req, res) => {
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

## Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Suite](https://business.facebook.com)
- [API Changelog](https://developers.facebook.com/docs/whatsapp/cloud-api/changelog)

## License

MIT License - feel free to use this in your projects!

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Support

For API-specific issues, refer to [Meta's WhatsApp Business Platform Support](https://developers.facebook.com/support).

---

**Note**: This handler requires an active Meta Business account and WhatsApp Business API access. Pricing applies based on conversation volume.