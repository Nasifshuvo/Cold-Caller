export * from './client';
export * from './types';
export * from './docs';
export * from './config';

import { VapiConfiguration, VapiConfig, Call } from './types';

export class VapiConfigurationImpl implements VapiConfiguration {
  private apiKey?: string;
  private assistantId?: string;

  init(config: VapiConfig): void {
    this.apiKey = config.apiKey;
    this.assistantId = config.assistantId;
  }

  isInitialized(): boolean {
    return !!this.apiKey && !!this.assistantId;
  }

  async listCalls(): Promise<Call[]> {
    if (!this.isInitialized()) {
      throw new Error('VapiConfiguration not initialized');
    }

    const response = await fetch('https://api.vapi.ai/call/list', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  }

  async initialize(config: VapiConfig): Promise<void> {
    this.init(config);
  }

  async getCall(id: string): Promise<Call> {
    if (!this.isInitialized()) {
      throw new Error('VapiConfiguration not initialized');
    }

    const response = await fetch(`https://api.vapi.ai/call/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }
}