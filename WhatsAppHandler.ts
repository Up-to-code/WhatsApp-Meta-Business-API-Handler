/**
 * WhatsApp Meta Business API Handler
 * A comprehensive class to interact with WhatsApp Cloud API
 */

// Define interfaces for better type safety
interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
  version?: string;
}

interface MessageResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
  };
}

interface MediaObject {
  link?: string;
  id?: string;
  caption?: string;
  filename?: string;
}

interface ButtonObject {
  id: string;
  title: string;
}

interface InteractiveOptions {
  header?: string;
  footer?: string;
}

interface ListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

// Constants
const DEFAULT_API_VERSION = 'v21.0';
const VALID_MEDIA_TYPES = ['image', 'video', 'audio', 'document'] as const;
type MediaType = typeof VALID_MEDIA_TYPES[number];

class WhatsAppHandler {
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly businessAccountId: string;
  private readonly version: string;
  private readonly baseUrl: string;

  /**
   * Initialize WhatsApp Handler
   * @param config - Configuration object
   */
  constructor(config: WhatsAppConfig) {
    this.token = config.token;
    this.phoneNumberId = config.phoneNumberId;
    this.businessAccountId = config.businessAccountId || '';
    this.version = config.version || DEFAULT_API_VERSION;
    this.baseUrl = `https://graph.facebook.com/${this.version}`;
  }

  /**
   * Make API request to WhatsApp
   * @private
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param data - Request body data
   * @returns Promise with API response
   */
  private async _makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data: object | null = null
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error?.message || 'API request failed';
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      throw error;
    }
  }

  /**
   * Send a text message
   * @param to - Recipient phone number (with country code, no + sign)
   * @param message - Message text
   * @returns Promise with API response
   */
  async sendMessage(to: string, message: string): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body: message,
      },
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Send media (image, video, audio, document)
   * @param to - Recipient phone number
   * @param mediaType - Type: 'image', 'video', 'audio', 'document'
   * @param mediaUrl - URL or media ID
   * @param options - Additional options (caption, filename)
   * @returns Promise with API response
   */
  async sendMedia(
    to: string,
    mediaType: MediaType,
    mediaUrl: string,
    options: { caption?: string; filename?: string } = {}
  ): Promise<MessageResponse> {
    if (!VALID_MEDIA_TYPES.includes(mediaType)) {
      throw new Error(`Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(', ')}`);
    }

    const mediaObject: MediaObject = mediaUrl.startsWith('http')
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
      to,
      type: mediaType,
      [mediaType]: mediaObject,
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Send media with caption/message
   * @param to - Recipient phone number
   * @param mediaType - Type: 'image', 'video', 'document'
   * @param mediaUrl - URL or media ID
   * @param caption - Caption text
   * @returns Promise with API response
   */
  async sendMediaWithMessage(
    to: string,
    mediaType: MediaType,
    mediaUrl: string,
    caption: string
  ): Promise<MessageResponse> {
    return this.sendMedia(to, mediaType, mediaUrl, { caption });
  }

  /**
   * Mark message as read
   * @param messageId - Message ID to mark as read
   * @returns Promise with API response
   */
  async markAsRead(messageId: string): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Read/Get message by ID
   * @param messageId - Message ID
   * @returns Promise with message data
   */
  async readMessage(messageId: string): Promise<any> {
    return this._makeRequest(messageId);
  }

  /**
   * Send reaction to a message
   * @param to - Recipient phone number
   * @param messageId - Message ID to react to
   * @param emoji - Emoji reaction
   * @returns Promise with API response
   */
  async sendReaction(to: string, messageId: string, emoji: string): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji,
      },
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Send location
   * @param to - Recipient phone number
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @param name - Location name
   * @param address - Location address
   * @returns Promise with API response
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
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address,
      },
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Send template message
   * @param to - Recipient phone number
   * @param templateName - Template name
   * @param languageCode - Language code (e.g., 'en_US')
   * @param components - Template components/parameters
   * @returns Promise with API response
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components: any[] = []
  ): Promise<MessageResponse> {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Send interactive buttons
   * @param to - Recipient phone number
   * @param bodyText - Message body text
   * @param buttons - Array of button objects [{id, title}]
   * @param options - Optional header and footer
   * @returns Promise with API response
   */
  async sendButtons(
    to: string,
    bodyText: string,
    buttons: ButtonObject[],
    options: InteractiveOptions = {}
  ): Promise<MessageResponse> {
    const buttonObjects = buttons.map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title,
      },
    }));

    const interactive: any = {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: buttonObjects },
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
      to,
      type: 'interactive',
      interactive,
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Send interactive list
   * @param to - Recipient phone number
   * @param bodyText - Message body text
   * @param buttonText - Button text
   * @param sections - Array of sections with rows
   * @param options - Optional header and footer
   * @returns Promise with API response
   */
  async sendList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: ListSection[],
    options: InteractiveOptions = {}
  ): Promise<MessageResponse> {
    const interactive: any = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections,
      },
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
      to,
      type: 'interactive',
      interactive,
    };

    return this._makeRequest<MessageResponse>(`${this.phoneNumberId}/messages`, 'POST', data);
  }

  /**
   * Upload media to WhatsApp
   * @param file - File to upload
   * @returns Promise with media ID response
   */
  async uploadMedia(file: File | Blob): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messaging_product', 'whatsapp');

    const url = `${this.baseUrl}/${this.phoneNumberId}/media`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  /**
   * Get media URL by ID
   * @param mediaId - Media ID
   * @returns Promise with media URL and details
   */
  async getMediaUrl(mediaId: string): Promise<any> {
    return this._makeRequest(mediaId);
  }

  /**
   * Download media file
   * @param mediaUrl - Media URL from getMediaUrl
   * @returns Promise with media file blob
   */
  async downloadMedia(mediaUrl: string): Promise<Blob> {
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return response.blob();
  }
}

export default WhatsAppHandler;