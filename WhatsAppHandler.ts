/**
 * WhatsApp Meta Business API Handler
 * A comprehensive TypeScript class to interact with WhatsApp Cloud API
 */

interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
  version?: string;
}

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

interface TemplateComponent {
  type: string;
  parameters?: Array<{
    type: string;
    text?: string;
    image?: { link: string };
    video?: { link: string };
    document?: { link: string };
  }>;
}

type MediaType = 'image' | 'video' | 'audio' | 'document';

class WhatsAppHandler {
  private token: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private version: string;
  private baseUrl: string;

  /**
   * Initialize WhatsApp Handler
   * @param config - Configuration object
   */
  constructor(config: WhatsAppConfig) {
    this.token = config.token;
    this.phoneNumberId = config.phoneNumberId;
    this.businessAccountId = config.businessAccountId || '';
    this.version = config.version || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.version}`;
  }

  /**
   * Make API request to WhatsApp
   * @private
   */
  private async _makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data: any = null
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'API request failed');
      }
      
      return result as T;
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      throw error;
    }
  }

  /**
   * Send a text message
   * @param to - Recipient phone number (with country code, no + sign)
   * @param message - Message text
   * @returns API response
   */
  async sendMessage(to: string, message: string): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: true,
        body: message
      }
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Send media (image, video, audio, document)
   * @param to - Recipient phone number
   * @param mediaType - Type: 'image', 'video', 'audio', 'document'
   * @param mediaUrl - URL or media ID
   * @param options - Additional options (caption, filename)
   * @returns API response
   */
  async sendMedia(
    to: string,
    mediaType: MediaType,
    mediaUrl: string,
    options: { caption?: string; filename?: string } = {}
  ): Promise<MessageResponse> {
    const validTypes: MediaType[] = ['image', 'video', 'audio', 'document'];
    if (!validTypes.includes(mediaType)) {
      throw new Error(`Invalid media type. Must be one of: ${validTypes.join(', ')}`);
    }

    const mediaObject: any = mediaUrl.startsWith('http') 
      ? { link: mediaUrl }
      : { id: mediaUrl };

    if (options.caption && (mediaType === 'image' || mediaType === 'video')) {
      mediaObject.caption = options.caption;
    }

    if (options.filename && mediaType === 'document') {
      mediaObject.filename = options.filename;
    }

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: mediaType,
      [mediaType]: mediaObject
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Send media with caption/message
   * @param to - Recipient phone number
   * @param mediaType - Type: 'image', 'video', 'document'
   * @param mediaUrl - URL or media ID
   * @param caption - Caption text
   * @returns API response
   */
  async sendMediaWithMessage(
    to: string,
    mediaType: MediaType,
    mediaUrl: string,
    caption: string
  ): Promise<MessageResponse> {
    return await this.sendMedia(to, mediaType, mediaUrl, { caption });
  }

  /**
   * Mark message as read
   * @param messageId - Message ID to mark as read
   * @returns API response
   */
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    return await this._makeRequest<{ success: boolean }>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Read/Get message by ID
   * @param messageId - Message ID
   * @returns Message data
   */
  async readMessage(messageId: string): Promise<any> {
    return await this._makeRequest<any>(messageId, 'GET');
  }

  /**
   * Send reaction to a message
   * @param to - Recipient phone number
   * @param messageId - Message ID to react to
   * @param emoji - Emoji reaction
   * @returns API response
   */
  async sendReaction(
    to: string,
    messageId: string,
    emoji: string
  ): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji: emoji
      }
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Send location
   * @param to - Recipient phone number
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @param name - Location name
   * @param address - Location address
   * @returns API response
   */
  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name: string,
    address: string
  ): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'location',
      location: {
        latitude: latitude,
        longitude: longitude,
        name: name,
        address: address
      }
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Send template message
   * @param to - Recipient phone number
   * @param templateName - Template name
   * @param languageCode - Language code (e.g., 'en_US')
   * @param components - Template components/parameters
   * @returns API response
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components: TemplateComponent[] = []
  ): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      }
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Send interactive buttons
   * @param to - Recipient phone number
   * @param bodyText - Message body text
   * @param buttons - Array of button objects
   * @param options - Optional header and footer
   * @returns API response
   */
  async sendButtons(
    to: string,
    bodyText: string,
    buttons: Button[],
    options: { header?: string; footer?: string } = {}
  ): Promise<MessageResponse> {
    const buttonObjects = buttons.map(btn => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title
      }
    }));

    const interactive: any = {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: buttonObjects }
    };

    if (options.header) {
      interactive.header = { type: 'text', text: options.header };
    }

    if (options.footer) {
      interactive.footer = { text: options.footer };
    }

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: interactive
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Send interactive list
   * @param to - Recipient phone number
   * @param bodyText - Message body text
   * @param buttonText - Button text
   * @param sections - Array of sections with rows
   * @param options - Optional header and footer
   * @returns API response
   */
  async sendList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: ListSection[],
    options: { header?: string; footer?: string } = {}
  ): Promise<MessageResponse> {
    const interactive: any = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: sections
      }
    };

    if (options.header) {
      interactive.header = { type: 'text', text: options.header };
    }

    if (options.footer) {
      interactive.footer = { text: options.footer };
    }

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: interactive
    };

    return await this._makeRequest<MessageResponse>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );
  }

  /**
   * Upload media to WhatsApp
   * @param file - File to upload
   * @returns Media ID response
   */
  async uploadMedia(file: File | Blob): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messaging_product', 'whatsapp');

    const url = `${this.baseUrl}/${this.phoneNumberId}/media`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    return await response.json();
  }

  /**
   * Get media URL by ID
   * @param mediaId - Media ID
   * @returns Media URL and details
   */
  async getMediaUrl(mediaId: string): Promise<MediaUrlResponse> {
    return await this._makeRequest<MediaUrlResponse>(mediaId, 'GET');
  }

  /**
   * Download media file
   * @param mediaUrl - Media URL from getMediaUrl
   * @returns Media file blob
   */
  async downloadMedia(mediaUrl: string): Promise<Blob> {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    return await response.blob();
  }
}

// Usage Example:
/*
const whatsapp = new WhatsAppHandler({
  token: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  version: 'v21.0'
});

// Send text message
await whatsapp.sendMessage('1234567890', 'Hello from WhatsApp API!');

// Send image with caption
await whatsapp.sendMediaWithMessage('1234567890', 'image', 'https://example.com/image.jpg', 'Check this out!');

// Mark message as read
await whatsapp.markAsRead('wamid.XXX==');

// Send buttons
await whatsapp.sendButtons('1234567890', 'Choose an option:', [
  { id: 'btn1', title: 'Option 1' },
  { id: 'btn2', title: 'Option 2' }
]);
*/

export default WhatsAppHandler;