/**
 * Vapi SDK Documentation
 * 
 * This SDK provides a type-safe interface to interact with the Vapi.ai API.
 * 
 * Basic usage:
 * ```typescript
 * import { VapiClient } from '@/lib/vapi';
 * 
 * const client = new VapiClient('your-api-key');
 * ```
 */

export const VapiDocs = {
  /**
   * Call Management
   * 
   * Methods for managing calls in the Vapi system
   */
  calls: {
    /**
     * Create a new call
     * 
     * @example
     * ```typescript
     * const call = await client.createCall({
     *   // call details
     * });
     * ```
     */
    create: 'createCall(data: CreateCallDTO): Promise<Call>',

    /**
     * List all calls with optional filtering
     * 
     * @param params.limit - Maximum number of items to return (default: 100)
     * @param params.id - Filter by call ID
     * @param params.assistantId - Filter by assistant ID
     * @param params.phoneNumberId - Filter by phone number ID
     * 
     * @example
     * ```typescript
     * const calls = await client.listCalls({
     *   limit: 10,
     *   assistantId: 'asst_123'
     * });
     * ```
     */
    list: 'listCalls(params?: ListCallsParams): Promise<Call[]>',

    /**
     * Get details of a specific call
     * 
     * @param id - The ID of the call to retrieve
     * 
     * @example
     * ```typescript
     * const call = await client.getCall('call_123');
     * ```
     */
    get: 'getCall(id: string): Promise<Call>',

    /**
     * Update an existing call
     * 
     * @param id - The ID of the call to update
     * @param data - The data to update
     * 
     * @example
     * ```typescript
     * const updatedCall = await client.updateCall('call_123', {
     *   // update details
     * });
     * ```
     */
    update: 'updateCall(id: string, data: UpdateCallDTO): Promise<Call>',

    /**
     * Delete call data
     * 
     * @param id - The ID of the call to delete
     * 
     * @example
     * ```typescript
     * const deletedCall = await client.deleteCallData('call_123');
     * ```
     */
    delete: 'deleteCallData(id: string): Promise<Call>'
  },

  /**
   * Assistant Management
   * 
   * Methods for managing AI assistants
   */
  assistants: {
    /**
     * Create a new assistant
     * 
     * @example
     * ```typescript
     * const assistant = await client.createAssistant({
     *   // assistant details
     * });
     * ```
     */
    create: 'createAssistant(data: CreateAssistantDTO): Promise<Assistant>',

    /**
     * List all assistants with optional filtering
     * 
     * @param params.limit - Maximum number of items to return (default: 100)
     * 
     * @example
     * ```typescript
     * const assistants = await client.listAssistants({
     *   limit: 10
     * });
     * ```
     */
    list: 'listAssistants(params?: ListAssistantsParams): Promise<Assistant[]>',

    /**
     * Get details of a specific assistant
     * 
     * @param id - The ID of the assistant to retrieve
     * 
     * @example
     * ```typescript
     * const assistant = await client.getAssistant('asst_123');
     * ```
     */
    get: 'getAssistant(id: string): Promise<Assistant>',

    /**
     * Update an existing assistant
     * 
     * @param id - The ID of the assistant to update
     * @param data - The data to update
     * 
     * @example
     * ```typescript
     * const updatedAssistant = await client.updateAssistant('asst_123', {
     *   // update details
     * });
     * ```
     */
    update: 'updateAssistant(id: string, data: UpdateAssistantDTO): Promise<Assistant>',

    /**
     * Delete an assistant
     * 
     * @param id - The ID of the assistant to delete
     * 
     * @example
     * ```typescript
     * const deletedAssistant = await client.deleteAssistant('asst_123');
     * ```
     */
    delete: 'deleteAssistant(id: string): Promise<Assistant>'
  },

  /**
   * Phone Number Management
   * 
   * Methods for managing phone numbers
   */
  phoneNumbers: {
    /**
     * Create a new phone number
     * 
     * @example
     * ```typescript
     * const phoneNumber = await client.createPhoneNumber({
     *   // phone number details
     * });
     * ```
     */
    create: 'createPhoneNumber(data: CreatePhoneNumberDTO): Promise<PhoneNumber>',

    /**
     * List all phone numbers with optional filtering
     * 
     * @param params.limit - Maximum number of items to return (default: 100)
     * 
     * @example
     * ```typescript
     * const phoneNumbers = await client.listPhoneNumbers({
     *   limit: 10
     * });
     * ```
     */
    list: 'listPhoneNumbers(params?: ListPhoneNumbersParams): Promise<PhoneNumber[]>',

    /**
     * Get details of a specific phone number
     * 
     * @param id - The ID of the phone number to retrieve
     * 
     * @example
     * ```typescript
     * const phoneNumber = await client.getPhoneNumber('pn_123');
     * ```
     */
    get: 'getPhoneNumber(id: string): Promise<PhoneNumber>',

    /**
     * Update an existing phone number
     * 
     * @param id - The ID of the phone number to update
     * @param data - The data to update
     * 
     * @example
     * ```typescript
     * const updatedPhoneNumber = await client.updatePhoneNumber('pn_123', {
     *   // update details
     * });
     * ```
     */
    update: 'updatePhoneNumber(id: string, data: UpdatePhoneNumberDTO): Promise<PhoneNumber>',

    /**
     * Delete a phone number
     * 
     * @param id - The ID of the phone number to delete
     * 
     * @example
     * ```typescript
     * const deletedPhoneNumber = await client.deletePhoneNumber('pn_123');
     * ```
     */
    delete: 'deletePhoneNumber(id: string): Promise<PhoneNumber>'
  }
};

export type VapiDocsType = typeof VapiDocs; 