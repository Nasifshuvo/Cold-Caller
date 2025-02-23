export * from './client';
export * from './types';
export * from './docs';
export * from './config';

import { VapiConfiguration, VapiConfig, Call } from './types';

export class VapiConfigurationImpl implements VapiConfiguration {
  private apiKey?: string;
  private assistantId?: string;
  private phoneNumberId?: string;
  private baseURL: string = 'https://api.vapi.ai';
  private defaultCallSettings: {
    recordingEnabled: boolean;
    transcriptionEnabled: boolean;
  } = {
    recordingEnabled: true,
    transcriptionEnabled: true,
  };

  public init(config: VapiConfig): void {
    this.apiKey = config.apiKey;
    this.assistantId = config.assistantId;
    this.phoneNumberId = config.phoneNumberId;
    this.baseURL = config.baseURL || this.baseURL;
    if (config.defaultCallSettings) {
      this.defaultCallSettings = {
        ...this.defaultCallSettings,
        ...config.defaultCallSettings,
      };
    }
  }

  public async initialize(config: VapiConfig): Promise<void> {
    this.init(config);
  }

  public isInitialized(): boolean {
    return !!this.apiKey && !!this.assistantId;
  }

  public getConfig(): VapiConfig {
    return {
      apiKey: this.apiKey || '',
      assistantId: this.assistantId,
      phoneNumberId: this.phoneNumberId,
      baseURL: this.baseURL,
      defaultCallSettings: this.defaultCallSettings
    };
  }

  public updateConfig(newConfig: Partial<VapiConfig>): void {
    if (newConfig.apiKey) this.apiKey = newConfig.apiKey;
    if (newConfig.assistantId) this.assistantId = newConfig.assistantId;
    if (newConfig.phoneNumberId) this.phoneNumberId = newConfig.phoneNumberId;
    if (newConfig.baseURL) this.baseURL = newConfig.baseURL;
    if (newConfig.defaultCallSettings) {
      this.defaultCallSettings = {
        ...this.defaultCallSettings,
        ...newConfig.defaultCallSettings,
      };
    }
  }

  public async listCalls(): Promise<Call[]> {
    if (!this.isInitialized()) {
      throw new Error('VAPI configuration not initialized');
    }

    const response = await fetch(`${this.baseURL}/call`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list calls');
    }

    return response.json();
  }

  public async getCall(id: string): Promise<Call> {
    if (!this.isInitialized()) {
      throw new Error('VAPI configuration not initialized');
    }

    const response = await fetch(`${this.baseURL}/call/${id}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get call');
    }

    return response.json();
  }
}