import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaymentProvider, PaymentRecord } from '@/types';

export interface InitiatePaymentPayload {
  order_id: string;
  provider?: PaymentProvider;
  gateway?: PaymentProvider;
}

export interface InitiatePaymentResponse extends PaymentRecord {
  gateway_payload?: {
    key_id: string;
    amount_subunits: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
  };
}

export interface VerifyPaymentPayload {
  order_id: string;
  payment_id?: string;
  provider: PaymentProvider;
  provider_transaction_id?: string;
  gateway_order_id?: string;
  payment_signature?: string;
  payment_method_details?: Record<string, any>;
  simulate_status?: 'PAID' | 'FAILED';
}

export interface VerifyPaymentResult {
  order_id: string;
  order_number?: string;
  payment: PaymentRecord;
}

export const paymentService = {
  async initiatePayment(payload: InitiatePaymentPayload): Promise<ApiResponse<InitiatePaymentResponse>> {
    const response = await apiClient.post<ApiResponse<InitiatePaymentResponse>>('/payments/initiate/', payload);
    return response.data;
  },

  async verifyPayment(payload: VerifyPaymentPayload): Promise<ApiResponse<VerifyPaymentResult>> {
    const response = await apiClient.post<ApiResponse<VerifyPaymentResult>>('/payments/verify/', payload);
    return response.data;
  },

  async confirmPaymentMock(paymentId: string): Promise<ApiResponse<PaymentRecord>> {
    const response = await apiClient.post<ApiResponse<PaymentRecord>>(`/payments/${paymentId}/confirm/`);
    return response.data;
  },
};
