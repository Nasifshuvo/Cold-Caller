import axios, { AxiosInstance } from 'axios';
import { 
    CreateCallDTO, 
    ListCallsParams, 
    Call, 
    CreateAssistantDTO, 
    Assistant, 
    CreatePhoneNumberDTO, 
    PhoneNumber, 
    UpdatePhoneNumberDTO, 
    UpdateAssistantDTO, 
    UpdateCallDTO, 
    ListAssistantsParams, 
    ListPhoneNumbersParams 
} from './types';
export class VapiClient {
  private client: AxiosInstance;
  
  constructor(apiKey: string, baseURL: string = 'https://api.vapi.ai') {
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Calls
  async createCall(data: CreateCallDTO): Promise<Call> {
    const response = await this.client.post('/call', data);
    return response.data;
  }

  async listCalls(params?: ListCallsParams): Promise<Call[]> {
    const response = await this.client.get('/call', { params });
    return response.data;
  }

  async getCall(id: string): Promise<Call> {
    const response = await this.client.get(`/call/${id}`);
    return response.data;
  }

  async updateCall(id: string, data: UpdateCallDTO): Promise<Call> {
    const response = await this.client.patch(`/call/${id}`, data);
    return response.data;
  }

  async deleteCallData(id: string): Promise<Call> {
    const response = await this.client.delete(`/call/${id}`);
    return response.data;
  }

  // Assistants
  async createAssistant(data: CreateAssistantDTO): Promise<Assistant> {
    const response = await this.client.post('/assistant', data);
    return response.data;
  }

  async listAssistants(params?: ListAssistantsParams): Promise<Assistant[]> {
    const response = await this.client.get('/assistant', { params });
    return response.data;
  }

  async getAssistant(id: string): Promise<Assistant> {
    const response = await this.client.get(`/assistant/${id}`);
    return response.data;
  }

  async updateAssistant(id: string, data: UpdateAssistantDTO): Promise<Assistant> {
    const response = await this.client.patch(`/assistant/${id}`, data);
    return response.data;
  }

  async deleteAssistant(id: string): Promise<Assistant> {
    const response = await this.client.delete(`/assistant/${id}`);
    return response.data;
  }

  // Phone Numbers
  async createPhoneNumber(data: CreatePhoneNumberDTO): Promise<PhoneNumber> {
    const response = await this.client.post('/phone-number', data);
    return response.data;
  }

  async listPhoneNumbers(params?: ListPhoneNumbersParams): Promise<PhoneNumber[]> {
    const response = await this.client.get('/phone-number', { params });
    return response.data;
  }

  async getPhoneNumber(id: string): Promise<PhoneNumber> {
    const response = await this.client.get(`/phone-number/${id}`);
    return response.data;
  }

  async updatePhoneNumber(id: string, data: UpdatePhoneNumberDTO): Promise<PhoneNumber> {
    const response = await this.client.patch(`/phone-number/${id}`, data);
    return response.data;
  }

  async deletePhoneNumber(id: string): Promise<PhoneNumber> {
    const response = await this.client.delete(`/phone-number/${id}`);
    return response.data;
  }
} 