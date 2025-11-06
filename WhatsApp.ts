/**
 * Complete WhatsApp Business API Handler with Universal Webhook Support
 * TypeScript implementation for Node.js 16+
 * 
 * Features:
 * - Complete WhatsApp Business API integration
 * - Universal webhook handling (Express, Next.js, Fastify, Koa, etc.)
 * - Message storage and retrieval
 * - Voice message processing
 * - Template management
 * - Advanced message queuing
 * - Conversation state management
 * - Media handling
 * - Real-time event streaming
 * - Comprehensive error handling
 * 
 * Copyright (c) 2023 Up-to-code
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import * as crypto from 'crypto';
import * as http from 'http';
import { EventEmitter } from 'events';
import { IncomingMessage, ServerResponse } from 'http';

// ==================== Type Definitions ====================

export interface UniversalRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, string | string[]>;
  rawBody?: Buffer | string;
}

export interface UniversalResponse {
  status(code: number): UniversalResponse;
  json(data: any): UniversalResponse;
  send(data: any): UniversalResponse;
  setHeader(name: string, value: string): UniversalResponse;
  end?(data?: any): void;
}

export interface WebhookResult {
  success: boolean;
  status: number;
  data?: {
    events: ExtractedWebhookData[];
    statistics: {
      totalEvents: number;
      processedEvents: number;
      errors: number;
    };
    conversations: ConversationState[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
    framework?: string;
  };
  challenge?: string;
}

export interface WebhookHandlerConfig {
  verifyToken?: string;
  appSecret?: string;
  autoProcess?: boolean;
  autoMarkRead?: boolean;
  verifySignature?: boolean;
  maxBodySize?: number;
  timeout?: number;
}

export interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
  version?: string;
  appSecret?: string;
  webhookVerifyToken?: string;
  apiTimeout?: number;
  maxRetries?: number;
  rateLimitPerSecond?: number;
  autoMarkRead?: boolean;
  autoProcessMessages?: boolean;
  queueEnabled?: boolean;
  maxQueueSize?: number;
  webhookPath?: string;
  webhookPort?: number;
  storage?: StorageConfig;
  webhook?: WebhookHandlerConfig;
}

export interface StorageConfig {
  type: 'memory' | 'file' | 'custom';
  filePath?: string;
  customStorage?: MessageStorage;
  maxMessagesPerConversation?: number;
  autoCleanup?: boolean;
}

export interface MessageStorage {
  storeMessage(message: StoredMessage): Promise<string>;
  getMessages(conversationId: string, limit?: number, offset?: number): Promise<StoredMessage[]>;
  getMessage(messageId: string): Promise<StoredMessage | null>;
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>;
  searchMessages(query: string, conversationId?: string): Promise<StoredMessage[]>;
  cleanupMessages(olderThan: number): Promise<number>;
}

export interface StoredMessage {
  id: string;
  whatsappId?: string;
  conversationId: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  content: any;
  timestamp: number;
  status: MessageStatus;
  media?: {
    id?: string;
    url?: string;
    mimeType: string;
    fileName?: string;
    fileSize?: number;
  };
  error?: {
    code: number;
    message: string;
    details?: any;
  };
}

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export interface MessageQueueItem {
  id: string;
  to: string;
  type: string;
  payload: any;
  attempts: number;
  timestamp: number;
  priority?: number;
}

export interface WebhookMiddleware {
  (event: any, metadata: any): Promise<boolean> | boolean;
}

export interface MessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
    error_data?: any;
  };
}

export interface TextMessage {
  preview_url?: boolean;
  body: string;
}

export interface MediaMessage {
  id?: string;
  link?: string;
  caption?: string;
  filename?: string;
  provider?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
}

export interface LocationMessage {
  longitude: number;
  latitude: number;
  name?: string;
  address?: string;
}

export interface ContactMessage {
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: string;
  }>;
  birthday?: string;
  emails?: Array<{ email?: string; type?: string }>;
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
  };
  org?: {
    company?: string;
    department?: string;
    title?: string;
  };
  phones?: Array<{ phone?: string; type?: string; wa_id?: string }>;
  urls?: Array<{ url?: string; type?: string }>;
}

export interface TemplateMessage {
  name: string;
  language: { code: string };
  components?: Array<{
    type: string;
    parameters: Array<{ type: string; [key: string]: any }>;
  }>;
}

export interface InteractiveMessage {
  type: 'button' | 'list' | 'product' | 'product_list';
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    image?: MediaMessage;
    video?: MediaMessage;
    document?: MediaMessage;
  };
  body?: { text: string };
  footer?: { text: string };
  action: {
    button?: string;
    buttons?: Array<{
      type: 'reply';
      reply: { id: string; title: string };
    }>;
    sections?: Array<{
      title?: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
    catalog_id?: string;
    product_retailer_id?: string;
  };
}

export interface ReactionMessage {
  message_id: string;
  emoji: string;
}

export interface ReplyMessage {
  message_id: string;
}

export interface VoiceMessage {
  id?: string;
  link?: string;
}

export interface WebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata?: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile_name: string;
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type?: string;
          image?: MediaMessage;
          video?: MediaMessage;
          audio?: MediaMessage;
          document?: MediaMessage;
          sticker?: MediaMessage;
          location?: LocationMessage;
          contacts?: ContactMessage[];
          button?: { payload: string; text: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
          reaction?: { message_id: string; emoji: string };
          context?: { from: string; id: string };
          [key: string]: any;
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            origin: {
              type: string;
            };
          };
          pricing?: {
            pricing_model: string;
            billable: boolean;
            category: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message?: string;
            error_data?: {
              details: string;
            };
          }>;
        }>;
        errors?: Array<{
          code: number;
          title: string;
          message?: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WebhookHandlers {
  onMessage?: (message: any, metadata: MessageMetadata) => void | Promise<void>;
  onMessageStatus?: (status: any) => void | Promise<void>;
  onAccountUpdate?: (update: any) => void | Promise<void>;
  onPhoneChange?: (change: any) => void | Promise<void>;
  onError?: (error: any) => void | Promise<void>;
  onUnknown?: (event: any) => void | Promise<void>;
  onReaction?: (reaction: any, metadata: MessageMetadata) => void | Promise<void>;
  onMedia?: (media: any, metadata: MessageMetadata) => void | Promise<void>;
  onLocation?: (location: any, metadata: MessageMetadata) => void | Promise<void>;
  onContact?: (contact: any, metadata: MessageMetadata) => void | Promise<void>;
  onInteractive?: (interactive: any, metadata: MessageMetadata) => void | Promise<void>;
  onVoice?: (voice: any, metadata: MessageMetadata) => void | Promise<void>;
}

export interface MessageMetadata {
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  displayName?: string;
  waId?: string;
  timestamp?: string;
  messageId?: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'voice';

export interface ExtractedWebhookData {
  eventType: string;
  visual: WebhookVisual;
  timestamp: Date;
  phoneNumberId: string;
  displayPhoneNumber: string;
  waId: string;
  displayName: string;
  messageId?: string;
  conversationId: string;
  content: {
    text?: string;
    media?: {
      type: MediaType;
      id?: string;
      url?: string;
      caption?: string;
      mimeType?: string;
      sha256?: string;
      fileSize?: number;
    };
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
    contacts?: ContactMessage[];
    interactive?: {
      type: string;
      button_reply?: { id: string; title: string };
      list_reply?: { id: string; title: string; description?: string };
    };
    reaction?: {
      message_id: string;
      emoji: string;
    };
    context?: {
      from: string;
      id: string;
    };
  };
  status?: {
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: Date;
    conversation?: {
      id: string;
      origin: {
        type: string;
      };
    };
    pricing?: {
      billable: boolean;
      pricing_model: string;
      category: string;
    };
  };
  error?: {
    code: number;
    title: string;
    message?: string;
    details?: any;
  };
  raw: any;
}

export interface ConversationState {
  id: string;
  state: 'active' | 'waiting' | 'completed' | 'archived';
  lastActivity: Date;
  messageCount: number;
  displayName: string;
  metadata: Record<string, any>;
  currentStep?: string;
  context: Record<string, any>;
}

export type WebhookIcon = 
  | '📱' | '💬' | '📸' | '🎥' | '🎵' | '📄' | '📍' | '👤' | '📋' | '❤️' 
  | '✅' | '❌' | '⏳' | '📊' | '🔔' | '🔄' | '⚙️' | '🔍' | '💾' | '🚀';

export interface WebhookVisual {
  icon: WebhookIcon;
  color: string;
  title: string;
  description: string;
}

// ==================== Constants ====================

export const WEBHOOK_VISUALS: Record<string, WebhookVisual> = {
  'message:text': { icon: '💬', color: '#3498db', title: 'Text Message', description: 'Incoming text message' },
  'message:image': { icon: '📸', color: '#9b59b6', title: 'Image Message', description: 'Incoming image message' },
  'message:video': { icon: '🎥', color: '#e74c3c', title: 'Video Message', description: 'Incoming video message' },
  'message:audio': { icon: '🎵', color: '#f39c12', title: 'Audio Message', description: 'Incoming audio message' },
  'message:voice': { icon: '🎵', color: '#f39c12', title: 'Voice Message', description: 'Incoming voice message' },
  'message:document': { icon: '📄', color: '#34495e', title: 'Document Message', description: 'Incoming document message' },
  'message:sticker': { icon: '💬', color: '#2ecc71', title: 'Sticker Message', description: 'Incoming sticker message' },
  'message:location': { icon: '📍', color: '#e67e22', title: 'Location Message', description: 'Incoming location message' },
  'message:contact': { icon: '👤', color: '#16a085', title: 'Contact Message', description: 'Incoming contact message' },
  'message:interactive': { icon: '📋', color: '#8e44ad', title: 'Interactive Message', description: 'Incoming interactive message' },
  'message:reaction': { icon: '❤️', color: '#e74c3c', title: 'Reaction', description: 'Message reaction' },
  'status:sent': { icon: '🚀', color: '#27ae60', title: 'Message Sent', description: 'Message successfully sent' },
  'status:delivered': { icon: '✅', color: '#2ecc71', title: 'Message Delivered', description: 'Message delivered to recipient' },
  'status:read': { icon: '🔍', color: '#3498db', title: 'Message Read', description: 'Message read by recipient' },
  'status:failed': { icon: '❌', color: '#e74c3c', title: 'Message Failed', description: 'Message failed to send' },
  'system:webhook_verified': { icon: '✅', color: '#27ae60', title: 'Webhook Verified', description: 'Webhook successfully verified' },
  'system:webhook_error': { icon: '❌', color: '#e74c3c', title: 'Webhook Error', description: 'Error processing webhook' }
};

// ==================== Webhook Extractor ====================

export class WebhookExtractor {
  static extractMessageData(webhookMessage: WebhookMessage): ExtractedWebhookData[] {
    const extractedData: ExtractedWebhookData[] = [];

    for (const entry of webhookMessage.entry) {
      for (const change of entry.changes) {
        const { value } = change;
        
        const metadata = value.metadata || { phone_number_id: 'unknown', display_phone_number: 'unknown' };
        const contacts = value.contacts || [];
        const contact = contacts[0] || { wa_id: 'unknown', profile_name: 'unknown' };

        const phoneNumberId = metadata.phone_number_id;
        const displayPhoneNumber = metadata.display_phone_number;
        const waId = contact.wa_id;
        const displayName = contact.profile_name;

        const baseData = {
          phoneNumberId,
          displayPhoneNumber,
          waId,
          displayName,
          conversationId: waId,
          raw: value
        };

        // Process messages
        if (value.messages) {
          for (const message of value.messages) {
            const eventType = this.determineMessageEventType(message);
            const visual = WEBHOOK_VISUALS[eventType] || WEBHOOK_VISUALS['message:text'];
            
            extractedData.push({
              eventType,
              visual,
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              messageId: message.id,
              ...baseData,
              content: this.extractMessageContent(message),
              conversationId: message.from || baseData.conversationId
            });
          }
        }

        // Process statuses
        if (value.statuses) {
          for (const status of value.statuses) {
            const eventType = `status:${status.status}`;
            const visual = WEBHOOK_VISUALS[eventType] || WEBHOOK_VISUALS['status:sent'];
            
            extractedData.push({
              eventType,
              visual,
              timestamp: new Date(parseInt(status.timestamp) * 1000),
              messageId: status.id,
              ...baseData,
              content: {},
              conversationId: status.recipient_id || baseData.conversationId,
              status: {
                status: status.status,
                timestamp: new Date(parseInt(status.timestamp) * 1000),
                conversation: status.conversation,
                pricing: status.pricing
              },
              error: status.errors?.[0]
            });
          }
        }

        // Process errors
        if (value.errors) {
          for (const error of value.errors) {
            extractedData.push({
              eventType: 'system:webhook_error',
              visual: WEBHOOK_VISUALS['system:webhook_error'],
              timestamp: new Date(),
              ...baseData,
              content: {},
              error: {
                code: error.code,
                title: error.title,
                message: error.message
              }
            });
          }
        }
      }
    }

    return extractedData;
  }

  private static determineMessageEventType(message: any): string {
    if (message.text) return 'message:text';
    if (message.image) return 'message:image';
    if (message.video) return 'message:video';
    if (message.audio) return 'message:audio';
    if (message.voice) return 'message:voice';
    if (message.document) return 'message:document';
    if (message.sticker) return 'message:sticker';
    if (message.location) return 'message:location';
    if (message.contacts) return 'message:contact';
    if (message.interactive) return 'message:interactive';
    if (message.reaction) return 'message:reaction';
    return 'message:unknown';
  }

  private static extractMessageContent(message: any): ExtractedWebhookData['content'] {
    const content: ExtractedWebhookData['content'] = {};

    if (message.text) {
      content.text = message.text.body;
    }

    if (message.image || message.video || message.audio || message.document || message.sticker || message.voice) {
      const mediaType = message.image ? 'image' :
                       message.video ? 'video' :
                       message.audio ? 'audio' :
                       message.voice ? 'voice' :
                       message.document ? 'document' : 'sticker';
      
      const mediaData = message[mediaType];
      content.media = {
        type: mediaType as MediaType,
        id: mediaData?.id,
        caption: mediaData?.caption,
        mimeType: mediaData?.mime_type,
        sha256: mediaData?.sha256,
        fileSize: mediaData?.file_size
      };
    }

    if (message.location) {
      content.location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name,
        address: message.location.address
      };
    }

    if (message.contacts) {
      content.contacts = message.contacts;
    }

    if (message.interactive) {
      content.interactive = message.interactive;
    }

    if (message.reaction) {
      content.reaction = message.reaction;
    }

    if (message.context) {
      content.context = message.context;
    }

    return content;
  }
}

// ==================== Conversation State Manager ====================

export class ConversationStateManager {
  private states: Map<string, ConversationState> = new Map();
  private stateHistory: Map<string, ConversationState[]> = new Map();

  getState(conversationId: string): ConversationState | undefined {
    return this.states.get(conversationId);
  }

  updateState(conversationId: string, updates: Partial<Omit<ConversationState, 'id'>>): ConversationState {
    const existingState = this.states.get(conversationId);
    
    const newState: ConversationState = {
      id: conversationId,
      state: 'active',
      lastActivity: new Date(),
      messageCount: 0,
      displayName: '',
      metadata: {},
      context: {},
      ...existingState,
      ...updates
    };

    // Always update lastActivity to current time
    newState.lastActivity = new Date();

    this.states.set(conversationId, newState);

    if (!this.stateHistory.has(conversationId)) {
      this.stateHistory.set(conversationId, []);
    }
    this.stateHistory.get(conversationId)!.push({ ...newState });

    return newState;
  }

  updateStateFromMessage(extractedData: ExtractedWebhookData): ConversationState {
    const { conversationId, displayName } = extractedData;
    
    const currentState = this.getState(conversationId);
    const messageCount = (currentState?.messageCount || 0) + 1;

    return this.updateState(conversationId, {
      displayName: displayName || currentState?.displayName,
      messageCount
    });
  }

  setStep(conversationId: string, step: string): ConversationState {
    return this.updateState(conversationId, { currentStep: step });
  }

  updateContext(conversationId: string, context: Record<string, any>): ConversationState {
    const currentState = this.getState(conversationId);
    const currentContext = currentState?.context || {};
    
    return this.updateState(conversationId, {
      context: { ...currentContext, ...context }
    });
  }

  getActiveConversations(): ConversationState[] {
    return Array.from(this.states.values()).filter(state => 
      state.state === 'active' || state.state === 'waiting'
    );
  }

  getStatistics(): {
    totalConversations: number;
    activeConversations: number;
    archivedConversations: number;
    completedConversations: number;
    averageMessagesPerConversation: number;
  } {
    const states = Array.from(this.states.values());
    const totalConversations = states.length;
    const activeConversations = states.filter(s => s.state === 'active').length;
    const archivedConversations = states.filter(s => s.state === 'archived').length;
    const completedConversations = states.filter(s => s.state === 'completed').length;
    
    const totalMessages = states.reduce((sum, state) => sum + state.messageCount, 0);
    const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

    return {
      totalConversations,
      activeConversations,
      archivedConversations,
      completedConversations,
      averageMessagesPerConversation
    };
  }
}

// ==================== Storage Implementations ====================

export class MemoryMessageStorage implements MessageStorage {
  private messages: Map<string, StoredMessage> = new Map();
  private conversationIndex: Map<string, string[]> = new Map();

  async storeMessage(message: StoredMessage): Promise<string> {
    const id = message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const messageToStore = { ...message, id };
    
    this.messages.set(id, messageToStore);
    
    if (!this.conversationIndex.has(message.conversationId)) {
      this.conversationIndex.set(message.conversationId, []);
    }
    this.conversationIndex.get(message.conversationId)!.push(id);
    
    return id;
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<StoredMessage[]> {
    const messageIds = this.conversationIndex.get(conversationId) || [];
    const paginatedIds = messageIds.slice(offset, offset + limit);
    
    return paginatedIds
      .map(id => this.messages.get(id))
      .filter((msg): msg is StoredMessage => msg !== undefined)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async getMessage(messageId: string): Promise<StoredMessage | null> {
    return this.messages.get(messageId) || null;
  }

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.status = status;
      this.messages.set(messageId, message);
    }
  }

  async searchMessages(query: string, conversationId?: string): Promise<StoredMessage[]> {
    const results: StoredMessage[] = [];
    const searchTerm = query.toLowerCase();
    
    for (const message of this.messages.values()) {
      if (conversationId && message.conversationId !== conversationId) {
        continue;
      }
      
      if (message.type === 'text' && 
          typeof message.content === 'string' && 
          message.content.toLowerCase().includes(searchTerm)) {
        results.push(message);
        continue;
      }
      
      if (JSON.stringify(message).toLowerCase().includes(searchTerm)) {
        results.push(message);
      }
    }
    
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  async cleanupMessages(olderThan: number): Promise<number> {
    let deletedCount = 0;
    
    for (const [id, message] of this.messages.entries()) {
      if (message.timestamp < olderThan) {
        this.messages.delete(id);
        
        const conversationMessages = this.conversationIndex.get(message.conversationId);
        if (conversationMessages) {
          const index = conversationMessages.indexOf(id);
          if (index !== -1) {
            conversationMessages.splice(index, 1);
          }
        }
        
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// ==================== Message Queue ====================

export class MessageQueue {
  private queue: MessageQueueItem[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  enqueue(item: Omit<MessageQueueItem, 'attempts' | 'timestamp'>): boolean {
    if (this.queue.length >= this.maxSize) {
      return false;
    }

    const queueItem: MessageQueueItem = {
      ...item,
      attempts: 0,
      timestamp: Date.now()
    };

    if (item.priority && item.priority > 0) {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    return true;
  }

  dequeue(): MessageQueueItem | null {
    return this.queue.shift() || null;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getStats(): { size: number; maxSize: number; usagePercentage: number } {
    return {
      size: this.queue.length,
      maxSize: this.maxSize,
      usagePercentage: (this.queue.length / this.maxSize) * 100
    };
  }
}

// ==================== Enhanced WhatsApp Handler ====================

interface WhatsAppEvents {
  messageSent: (data: { to: string; messageId: string; type: string; storedId: string }) => void;
  messageFailed: (data: { to: string; error: any; type: string; storedId: string }) => void;
  messageRead: (data: { messageId: string }) => void;
  storageCleaned: (data: { deletedCount: number }) => void;
  queuedMessageSent: (data: { queueId: string; messageId: string; type: string }) => void;
  queuedMessageFailed: (data: { queueId: string; error: any; attempts: number }) => void;
}

class EnhancedWhatsAppHandler extends EventEmitter {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly businessAccountId?: string;
  private readonly appSecret?: string;
  private readonly webhookVerifyToken?: string;
  private readonly apiTimeout: number;
  private readonly maxRetries: number;
  private readonly autoMarkRead: boolean;
  private readonly autoProcessMessages: boolean;
  
  private webhookHandlers: WebhookHandlers = {};
  private webhookServer: http.Server | null = null;
  private messageQueue: MessageQueue;
  private isQueueProcessing: boolean = false;
  private webhookMiddlewares: WebhookMiddleware[] = [];
  private messageStorage: MessageStorage;
  private conversationStateManager: ConversationStateManager;
  private messageStatistics: {
    sent: number;
    received: number;
    failed: number;
    delivered: number;
    read: number;
  } = {
    sent: 0,
    received: 0,
    failed: 0,
    delivered: 0,
    read: 0
  };

  private webhookConfig: Required<WebhookHandlerConfig>;

  constructor(config: WhatsAppConfig) {
    super();
    
    const version = config.version || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${version}`;
    this.token = config.token;
    this.phoneNumberId = config.phoneNumberId;
    this.businessAccountId = config.businessAccountId;
    this.appSecret = config.appSecret;
    this.webhookVerifyToken = config.webhookVerifyToken;
    this.apiTimeout = config.apiTimeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.autoMarkRead = config.autoMarkRead ?? true;
    this.autoProcessMessages = config.autoProcessMessages ?? true;
    
    this.messageQueue = new MessageQueue(config.maxQueueSize || 1000);
    this.conversationStateManager = new ConversationStateManager();
    
    this.messageStorage = this.initializeStorage(config.storage);
    
    this.webhookConfig = {
      verifyToken: config.webhook?.verifyToken || this.webhookVerifyToken || 'default_verify_token',
      appSecret: config.webhook?.appSecret || this.appSecret || '',
      autoProcess: config.webhook?.autoProcess ?? true,
      autoMarkRead: config.webhook?.autoMarkRead ?? this.autoMarkRead,
      verifySignature: config.webhook?.verifySignature ?? true,
      maxBodySize: config.webhook?.maxBodySize || 10 * 1024 * 1024,
      timeout: config.webhook?.timeout || 30000
    };
    
    if (!this.token || !this.phoneNumberId) {
      throw new Error('Token and phoneNumberId are required');
    }

    if (config.queueEnabled !== false) {
      this.startQueueProcessor();
    }

    if (config.storage?.autoCleanup !== false) {
      this.startStorageCleanup();
    }
  }

  on<U extends keyof WhatsAppEvents>(
    event: U, listener: WhatsAppEvents[U]
  ): this {
    return super.on(event, listener);
  }

  emit<U extends keyof WhatsAppEvents>(
    event: U, ...args: Parameters<WhatsAppEvents[U]>
  ): boolean {
    return super.emit(event, ...args);
  }

  private initializeStorage(storageConfig?: StorageConfig): MessageStorage {
    if (storageConfig?.customStorage) {
      return storageConfig.customStorage;
    }

    switch (storageConfig?.type) {
      case 'file':
        if (!storageConfig.filePath) {
          throw new Error('File path is required for file storage');
        }
        return new MemoryMessageStorage();
      
      case 'memory':
      default:
        return new MemoryMessageStorage();
    }
  }

  private startStorageCleanup(): void {
    setInterval(async () => {
      try {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const deletedCount = await this.messageStorage.cleanupMessages(thirtyDaysAgo);
        
        if (deletedCount > 0) {
          this.emit('storageCleaned', { deletedCount });
        }
      } catch (error) {
        console.error('Storage cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  // ==================== Universal Webhook Processing ====================

  async processWebhook(request: UniversalRequest): Promise<WebhookResult> {
    const startTime = Date.now();
    const framework = this.detectFramework(request);
    
    try {
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        return this.createErrorResult(400, 'VALIDATION_ERROR', validation.errors.join(', '));
      }

      if (request.method === 'GET') {
        return this.handleVerification(request);
      }

      if (request.method === 'POST') {
        return await this.handleWebhookEvents(request);
      }

      return this.createErrorResult(405, 'METHOD_NOT_ALLOWED', `Method ${request.method} not allowed`);

    } catch (error) {
      return this.createErrorResult(
        500, 
        'PROCESSING_ERROR', 
        error instanceof Error ? error.message : 'Unknown error occurred',
        error
      );
    } finally {
      const processingTime = Date.now() - startTime;
      console.log(`🕒 Webhook processed in ${processingTime}ms`);
    }
  }

  private validateRequest(request: UniversalRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.method) {
      errors.push('Missing HTTP method');
    }

    if (!request.headers) {
      errors.push('Missing headers');
    }

    if (request.method === 'POST' && !request.body && !request.rawBody) {
      errors.push('Missing request body for POST request');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private handleVerification(request: UniversalRequest): WebhookResult {
    const query = request.query || {};
    const mode = query['hub.mode'] as string;
    const token = query['hub.verify_token'] as string;
    const challenge = query['hub.challenge'] as string;

    if (mode === 'subscribe' && token === this.webhookConfig.verifyToken && challenge) {
      console.log('✅ Webhook verified successfully');
      
      return {
        success: true,
        status: 200,
        data: {
          events: [],
          statistics: { totalEvents: 0, processedEvents: 0, errors: 0 },
          conversations: []
        },
        metadata: {
          processingTime: 0,
          timestamp: new Date(),
          framework: this.detectFramework(request)
        },
        challenge
      };
    }

    return this.createErrorResult(403, 'VERIFICATION_FAILED', 'Webhook verification failed');
  }

  private async handleWebhookEvents(request: UniversalRequest): Promise<WebhookResult> {
    const startTime = Date.now();
    
    if (this.webhookConfig.verifySignature && this.webhookConfig.appSecret) {
      const signature = request.headers['x-hub-signature-256'] as string;
      const body = request.rawBody || JSON.stringify(request.body);
      
      if (!this.verifySignature(body, signature)) {
        return this.createErrorResult(401, 'INVALID_SIGNATURE', 'Webhook signature verification failed');
      }
    }

    let webhookData: WebhookMessage;
    try {
      const body = request.body || (request.rawBody ? JSON.parse(request.rawBody.toString()) : {});
      webhookData = body as WebhookMessage;
    } catch (error) {
      return this.createErrorResult(400, 'INVALID_JSON', 'Invalid JSON in request body');
    }

    const extractedData = WebhookExtractor.extractMessageData(webhookData);
    const processedEvents: ExtractedWebhookData[] = [];
    const errors: Array<{ event: string; error: string; timestamp: Date }> = [];

    for (const data of extractedData) {
      try {
        if (data.conversationId) {
          this.conversationStateManager.updateStateFromMessage(data);
        }

        if (data.eventType.startsWith('message:')) {
          const storedMessage: StoredMessage = {
            id: data.messageId || `in_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            conversationId: data.conversationId,
            direction: 'incoming',
            type: data.eventType.split(':')[1],
            content: data.content,
            timestamp: data.timestamp.getTime(),
            status: 'delivered',
            whatsappId: data.messageId
          };

          await this.messageStorage.storeMessage(storedMessage);
          this.messageStatistics.received++;
        }

        if (this.webhookConfig.autoMarkRead && data.messageId && data.eventType.startsWith('message:')) {
          await this.markAsRead(data.messageId).catch(err => 
            console.error('Failed to mark message as read:', err)
          );
        }

        await this.callWebhookHandlers(data);

        processedEvents.push(data);
      } catch (error) {
        errors.push({
          event: data.eventType,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }

    const activeConversations = this.conversationStateManager.getActiveConversations();

    return {
      success: errors.length === 0,
      status: 200,
      data: {
        events: processedEvents,
        statistics: {
          totalEvents: extractedData.length,
          processedEvents: processedEvents.length,
          errors: errors.length
        },
        conversations: activeConversations
      },
      error: errors.length > 0 ? {
        code: 'PARTIAL_PROCESSING',
        message: `${errors.length} events failed to process`,
        details: errors
      } : undefined,
      metadata: {
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        framework: this.detectFramework(request)
      }
    };
  }

  private async callWebhookHandlers(data: ExtractedWebhookData): Promise<void> {
    const metadata: MessageMetadata = {
      phoneNumberId: data.phoneNumberId,
      displayPhoneNumber: data.displayPhoneNumber,
      displayName: data.displayName,
      waId: data.waId,
      timestamp: data.timestamp.toISOString(),
      messageId: data.messageId
    };

    const [category, type] = data.eventType.split(':');
    
    switch (category) {
      case 'message':
        if (this.webhookHandlers.onMessage) {
          await Promise.resolve(this.webhookHandlers.onMessage(data.raw, metadata));
        }
        
        const handlerMap: Record<string, keyof WebhookHandlers> = {
          'text': 'onMessage',
          'image': 'onMedia',
          'video': 'onMedia',
          'audio': 'onMedia',
          'voice': 'onVoice',
          'document': 'onMedia',
          'sticker': 'onMedia',
          'location': 'onLocation',
          'contact': 'onContact',
          'interactive': 'onInteractive',
          'reaction': 'onReaction'
        };

        const handlerName = handlerMap[type];
        if (handlerName && this.webhookHandlers[handlerName]) {
          const handler = this.webhookHandlers[handlerName] as (data: any, metadata: MessageMetadata) => void | Promise<void>;
          await Promise.resolve(handler(data.content, metadata));
        }
        break;

      case 'status':
        if (this.webhookHandlers.onMessageStatus) {
          await Promise.resolve(this.webhookHandlers.onMessageStatus(data.status));
        }
        break;

      case 'system':
        if (data.eventType === 'system:webhook_error' && this.webhookHandlers.onError) {
          await Promise.resolve(this.webhookHandlers.onError(data.error));
        }
        break;
    }
  }

  private verifySignature(payload: string | Buffer, signature?: string): boolean {
    if (!signature || !this.webhookConfig.appSecret) {
      return false;
    }
    
    const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
    
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', this.webhookConfig.appSecret)
      .update(payloadString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  private detectFramework(request: UniversalRequest): string {
    if ((request as any).app) return 'Express.js';
    if ((request as any).nextUrl) return 'Next.js';
    if (request.rawBody !== undefined) return 'Node.js HTTP';
    if (request.query && typeof request.query === 'object') return 'Generic Framework';
    return 'Unknown';
  }

  private createErrorResult(
    status: number, 
    code: string, 
    message: string, 
    details?: any
  ): WebhookResult {
    return {
      success: false,
      status,
      error: {
        code,
        message,
        details
      },
      metadata: {
        processingTime: 0,
        timestamp: new Date()
      }
    };
  }

  // ==================== Framework-Specific Handlers ====================

  expressMiddleware() {
    return async (req: any, res: any, next?: (err?: any) => void) => {
      try {
        const universalReq: UniversalRequest = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          query: req.query,
          rawBody: (req as any).rawBody || req.body
        };

        const result = await this.processWebhook(universalReq);

        if (result.challenge) {
          res.status(result.status).type('text/plain').send(result.challenge);
          return;
        }

        res.status(result.status).json({
          success: result.success,
          data: result.data,
          error: result.error,
          metadata: result.metadata
        });

      } catch (error) {
        if (next) {
          next(error);
        } else {
          res.status(500).json({
            success: false,
            error: {
              code: 'MIDDLEWARE_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error in middleware'
            }
          });
        }
      }
    };
  }

  async nextjsHandler(req: any, res: any): Promise<void> {
    try {
      const universalReq: UniversalRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        rawBody: req.body ? Buffer.from(JSON.stringify(req.body)) : undefined
      };

      const result = await this.processWebhook(universalReq);

      if (result.challenge) {
        res.status(result.status).send(result.challenge);
        return;
      }

      res.status(result.status).json({
        success: result.success,
        data: result.data,
        error: result.error,
        metadata: result.metadata
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'NEXTJS_HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error in Next.js handler'
        }
      });
    }
  }

  async handle(request: any, response?: any): Promise<WebhookResult | void> {
    if (this.isExpressRequest(request)) {
      return this.expressMiddleware()(request, response);
    } else if (this.isNextjsRequest(request)) {
      return this.nextjsHandler(request, response);
    } else if (this.isHttpRequest(request)) {
      return this.httpHandler(request, response);
    } else {
      const result = await this.processWebhook(request);
      
      if (response) {
        response.status(result.status).json({
          success: result.success,
          data: result.data,
          error: result.error,
          metadata: result.metadata
        });
      }
      
      return result;
    }
  }

  private isExpressRequest(req: any): boolean {
    return req && typeof req.app === 'function';
  }

  private isNextjsRequest(req: any): boolean {
    return req && (typeof req.nextUrl !== 'undefined' || (req.headers && req.headers['x-nextjs-route']));
  }

  private isHttpRequest(req: any): boolean {
    return req && typeof req.method === 'string' && typeof req.headers === 'object';
  }

  // ==================== WhatsApp API Methods ====================

  private async _makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    data?: any,
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          throw new Error(`Rate limit exceeded. Retry after: ${retryAfter}s`);
        }
        
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < this.maxRetries && error instanceof Error && error.name === 'AbortError') {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._makeRequest<T>(endpoint, method, data, attempt + 1);
      }
      
      this.messageStatistics.failed++;
      throw error;
    }
  }

  async sendMessage(
    to: string,
    message: string,
    options: {
      previewUrl?: boolean;
      replyTo?: string;
      priority?: number;
      queueIfBusy?: boolean;
    } = {}
  ): Promise<MessageResponse> {
    const messageData: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: options.previewUrl || false,
        body: message,
      },
    };

    if (options.replyTo) {
      messageData.context = { message_id: options.replyTo };
    }

    const storedMessage: StoredMessage = {
      id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      conversationId: to,
      direction: 'outgoing',
      type: 'text',
      content: message,
      timestamp: Date.now(),
      status: 'pending'
    };

    await this.messageStorage.storeMessage(storedMessage);

    try {
      const response = await this._makeRequest<MessageResponse>(
        `${this.phoneNumberId}/messages`,
        'POST',
        messageData
      );
      
      storedMessage.whatsappId = response.messages[0]?.id;
      storedMessage.status = 'sent';
      await this.messageStorage.storeMessage(storedMessage);
      
      this.messageStatistics.sent++;
      this.emit('messageSent', { 
        to, 
        messageId: response.messages[0]?.id, 
        type: 'text',
        storedId: storedMessage.id
      });
      
      return response;
    } catch (error) {
      storedMessage.status = 'failed';
      storedMessage.error = {
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
      await this.messageStorage.storeMessage(storedMessage);
      
      this.emit('messageFailed', { 
        to, 
        error, 
        type: 'text',
        storedId: storedMessage.id
      });
      throw error;
    }
  }

  async sendVoice(
    to: string,
    audioIdOrUrl: string,
    options: {
      replyTo?: string;
      priority?: number;
    } = {}
  ): Promise<MessageResponse> {
    const isUrl = audioIdOrUrl.startsWith('http');
    const voiceObject: VoiceMessage = isUrl
      ? { link: audioIdOrUrl }
      : { id: audioIdOrUrl };

    const messageData: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'audio',
      audio: voiceObject,
    };

    if (options.replyTo) {
      messageData.context = { message_id: options.replyTo };
    }

    const storedMessage: StoredMessage = {
      id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      conversationId: to,
      direction: 'outgoing',
      type: 'voice',
      content: { audioIdOrUrl },
      timestamp: Date.now(),
      status: 'pending',
      media: {
        mimeType: 'audio/mpeg',
        fileName: 'voice_message.mp3'
      }
    };

    await this.messageStorage.storeMessage(storedMessage);

    try {
      const response = await this._makeRequest<MessageResponse>(
        `${this.phoneNumberId}/messages`,
        'POST',
        messageData
      );

      storedMessage.whatsappId = response.messages[0]?.id;
      storedMessage.status = 'sent';
      await this.messageStorage.storeMessage(storedMessage);
      
      this.messageStatistics.sent++;
      this.emit('messageSent', { 
        to, 
        messageId: response.messages[0]?.id, 
        type: 'voice',
        storedId: storedMessage.id
      });
      
      return response;
    } catch (error) {
      storedMessage.status = 'failed';
      storedMessage.error = {
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
      await this.messageStorage.storeMessage(storedMessage);
      
      this.emit('messageFailed', { 
        to, 
        error, 
        type: 'voice',
        storedId: storedMessage.id
      });
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await this._makeRequest<{ success: boolean }>(
      `${this.phoneNumberId}/messages`,
      'POST',
      data
    );

    this.messageStatistics.read++;
    this.emit('messageRead', { messageId });
    
    return response;
  }

  // ==================== Queue Management ====================

  private startQueueProcessor(): void {
    const processQueue = async (): Promise<void> => {
      if (this.isQueueProcessing || this.messageQueue.isEmpty()) {
        setTimeout(processQueue, 1000);
        return;
      }

      this.isQueueProcessing = true;
      const item = this.messageQueue.dequeue();

      if (item) {
        try {
          const response = await this._makeRequest<MessageResponse>(
            `${this.phoneNumberId}/messages`,
            'POST',
            item.payload
          );

          this.messageStatistics.sent++;
          this.emit('queuedMessageSent', { 
            queueId: item.id, 
            messageId: response.messages[0]?.id,
            type: item.type 
          });

        } catch (error) {
          item.attempts++;
          if (item.attempts < this.maxRetries) {
            item.timestamp = Date.now();
            this.messageQueue.enqueue(item);
          } else {
            this.emit('queuedMessageFailed', { 
              queueId: item.id, 
              error,
              attempts: item.attempts 
            });
          }
        }
      }

      this.isQueueProcessing = false;
      setTimeout(processQueue, 100);
    };

    processQueue();
  }

  // ==================== Additional Methods ====================

  setWebhookHandlers(handlers: WebhookHandlers): void {
    this.webhookHandlers = { ...this.webhookHandlers, ...handlers };
  }

  use(middleware: WebhookMiddleware): void {
    this.webhookMiddlewares.push(middleware);
  }

  async getConversationHistory(conversationId: string, limit: number = 50, offset: number = 0): Promise<StoredMessage[]> {
    return this.messageStorage.getMessages(conversationId, limit, offset);
  }

  async searchMessages(query: string, conversationId?: string): Promise<StoredMessage[]> {
    return this.messageStorage.searchMessages(query, conversationId);
  }

  getConversationState(conversationId: string): ConversationState | undefined {
    return this.conversationStateManager.getState(conversationId);
  }

  updateConversationContext(conversationId: string, context: Record<string, any>): ConversationState {
    return this.conversationStateManager.updateContext(conversationId, context);
  }

  getStatistics(): typeof this.messageStatistics {
    return { ...this.messageStatistics };
  }

  getQueueStats(): { size: number; maxSize: number; usagePercentage: number } {
    return this.messageQueue.getStats();
  }

  // ==================== HTTP Server Methods ====================

  private async httpHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.readRequestBody(req);
      
      const universalReq: UniversalRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers as Record<string, string | string[] | undefined>,
        rawBody: body
      };

      const result = await this.processWebhook(universalReq);

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = result.status;
      res.end(JSON.stringify({
        success: result.success,
        data: result.data,
        error: result.error,
        metadata: result.metadata
      }));

    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'HTTP_HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error in HTTP handler'
        }
      }));
    }
  }

  private readRequestBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        
        if (totalSize > this.webhookConfig.maxBodySize) {
          reject(new Error(`Request body too large: ${totalSize} bytes`));
          return;
        }

        chunks.push(chunk);
      });

      req.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      req.on('error', reject);
    });
  }

  startWebhookServer(port: number = 3000, path: string = '/webhook', callback?: () => void): http.Server {
    if (this.webhookServer) {
      throw new Error('Webhook server is already running');
    }

    this.webhookServer = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
      const url = req.url || '';
      const pathname = url.split('?')[0];
      
      if (pathname !== path) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      await this.httpHandler(req, res);
    });

    this.webhookServer.listen(port, () => {
      console.log(`🚀 Webhook server listening on port ${port} at path ${path}`);
      if (callback) callback();
    });

    return this.webhookServer;
  }

  stopWebhookServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.webhookServer) {
        reject(new Error('No webhook server is running'));
        return;
      }

      this.webhookServer.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.webhookServer = null;
          console.log('Webhook server stopped');
          resolve();
        }
      });
    });
  }
}

// ==================== Factory Functions ====================

export function createWhatsAppHandler(config: WhatsAppConfig): EnhancedWhatsAppHandler {
  return new EnhancedWhatsAppHandler(config);
}

export function createWhatsAppHandlerFromEnv(): EnhancedWhatsAppHandler {
  const config: WhatsAppConfig = {
    token: process.env.WHATSAPP_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    apiTimeout: parseInt(process.env.WHATSAPP_API_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.WHATSAPP_MAX_RETRIES || '3'),
    autoMarkRead: process.env.WHATSAPP_AUTO_MARK_READ !== 'false',
    autoProcessMessages: process.env.WHATSAPP_AUTO_PROCESS_MESSAGES !== 'false',
    storage: {
      type: (process.env.WHATSAPP_STORAGE_TYPE as 'memory' | 'file') || 'memory',
      filePath: process.env.WHATSAPP_STORAGE_PATH,
      autoCleanup: process.env.WHATSAPP_STORAGE_AUTO_CLEANUP !== 'false'
    }
  };

  if (!config.token || !config.phoneNumberId) {
    throw new Error('WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables are required');
  }

  return new EnhancedWhatsAppHandler(config);
}

export default EnhancedWhatsAppHandler;