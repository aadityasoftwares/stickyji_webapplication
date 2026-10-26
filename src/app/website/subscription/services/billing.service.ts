import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import type { ApiResponse } from '../../../shared/interfaces/api.interface';

export interface RazorpayCheckoutDetails {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  subscriptionId?: string;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  checkoutDetails: RazorpayCheckoutDetails;
  planName: string;
  userEmail?: string | null;
  userName?: string | null;
}

export interface CheckoutResult {
  status: 'SUCCESS' | 'DISMISSED' | 'FAILED';
  paymentData?: RazorpayPaymentSuccessResponse;
  error?: any;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private scriptLoadingPromise: Promise<boolean> | null = null;

  subscribe(planPriceId: string): Observable<RazorpayCheckoutDetails> {
    return this.http
      .post<ApiResponse<RazorpayCheckoutDetails>>(API_ENDPOINTS.billing.subscribe, {
        planPriceId,
      })
      .pipe(
        map((response) => {
          const data = response?.data ?? (response as unknown as RazorpayCheckoutDetails);
          if (!data || !data.orderId || !data.keyId) {
            throw new Error('Billing order details could not be initialized.');
          }
          return data;
        }),
      );
  }

  verifyPayment(payload: RazorpayPaymentSuccessResponse): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(API_ENDPOINTS.billing.verify, payload);
  }

  loadRazorpayScript(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return Promise.resolve(false);
    }

    if ((window as any).Razorpay) {
      return Promise.resolve(true);
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<boolean>((resolve) => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  async openCheckout(options: RazorpayCheckoutOptions): Promise<CheckoutResult> {
    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded || !(window as any).Razorpay) {
      throw new Error(
        'Payment gateway could not be loaded. Please check your internet connection.',
      );
    }

    return new Promise<CheckoutResult>((resolve) => {
      const { checkoutDetails, planName, userEmail, userName } = options;

      const rzpOptions: Record<string, any> = {
        key: checkoutDetails.keyId,
        amount: checkoutDetails.amount,
        currency: checkoutDetails.currency,
        name: 'Sticky Ji',
        description: `${planName} Subscription`,
        order_id: checkoutDetails.orderId,
        prefill: {
          email: userEmail ?? '',
          name: userName ?? '',
        },
        theme: {
          color: '#111111',
        },
        modal: {
          ondismiss: () => {
            resolve({ status: 'DISMISSED' });
          },
        },
        handler: (response: RazorpayPaymentSuccessResponse) => {
          resolve({
            status: 'SUCCESS',
            paymentData: response,
          });
        },
      };

      const instance = new (window as any).Razorpay(rzpOptions);

      instance.on('payment.failed', (response: any) => {
        resolve({
          status: 'FAILED',
          error: response?.error ?? response,
        });
      });

      instance.open();
    });
  }
}
