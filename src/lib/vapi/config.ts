import { VapiClient } from './client';
import type { VapiConfig, VapiConfiguration as IVapiConfiguration, Call, ListCallsParams } from './types';

class VapiConfiguration implements IVapiConfiguration {
  private static instance: VapiConfiguration;
  private config: VapiConfig;
  private client: VapiClient | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Initialize with empty config
    this.config = {
      apiKey: '',
      defaultCallSettings: {
        recordingEnabled: true,
        transcriptionEnabled: true,
      },
    };
  }

  public static getInstance(): VapiConfiguration {
    if (!VapiConfiguration.instance) {
      VapiConfiguration.instance = new VapiConfiguration();
    }
    return VapiConfiguration.instance;
  }

  public async initialize(configData: VapiConfig): Promise<void> {
    if (this.initialized) {
      console.warn('Vapi configuration is already initialized');
      return;
    }

    this.config = {
      ...this.config,
      ...configData,
    };

    this.client = new VapiClient(this.config.apiKey, this.config.baseURL);
    this.initialized = true;
  }

  public getClient(): VapiClient {
    if (!this.initialized || !this.client) {
      throw new Error('Vapi configuration not initialized. Call initialize() first.');
    }
    return this.client;
  }

  public getConfig(): VapiConfig {
    if (!this.initialized) {
      throw new Error('Vapi configuration not initialized. Call initialize() first.');
    }
    return { ...this.config };
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  private resetClient(): void {
    this.client = new VapiClient(this.config.apiKey, this.config.baseURL);
  }

  public updateConfig(newConfig: Partial<VapiConfig>): void {
    if (!this.initialized) {
      throw new Error('Vapi configuration not initialized. Call initialize() first.');
    }

    this.config = {
      ...this.config,
      ...newConfig,
    };

    if (newConfig.apiKey || newConfig.baseURL) {
      this.resetClient();
    }
  }

  public getAssistantId(): string | undefined {
    return this.config.assistantId;
  }

  public getPhoneNumberId(): string | undefined {
    return this.config.phoneNumberId;
  }

  public getDefaultCallSettings() {
    return { ...this.config.defaultCallSettings };
  }

  public init(config: VapiConfig): void {
    if (this.initialized) {
      console.warn('Vapi configuration is already initialized');
      return;
    }

    this.config = {
      ...this.config,
      ...config,
    };

    this.client = new VapiClient(this.config.apiKey, this.config.baseURL);
    this.initialized = true;
    
    console.log('Vapi initialized:', {
      apiKey: this.config.apiKey ? 'exists' : 'missing',
      assistantId: this.config.assistantId,
      initialized: this.initialized,
      hasClient: !!this.client
    });
  }

  public async listCalls(params?: ListCallsParams): Promise<Call[]> {
    if (!this.initialized || !this.client) {
      console.error('Vapi client not initialized');
      return [];
    }

    try {
      console.log('Vapi config:', {
        apiKey: this.config.apiKey ? 'exists' : 'missing',
        assistantId: this.config.assistantId,
        initialized: this.initialized
      });
      
      const calls = await this.client.listCalls(params);
      console.log('Raw Vapi response:', calls);
      return calls;
    } catch (error) {
      console.error('Failed to fetch Vapi calls:', error);
      return [];
    }
  }
}

// Create a helper function for easier access
export const getVapiConfig = () => VapiConfiguration.getInstance();

// Export the types
export type { VapiConfig }; 