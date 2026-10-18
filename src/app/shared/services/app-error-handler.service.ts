import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (this.isBrowserPolicyNoise(error)) {
      return;
    }

    if (error !== null && typeof error === 'object' && !(error instanceof Error)) {
      console.error('ERROR', this.errorText(error), error);
      return;
    }

    console.error('ERROR', error);
  }

  private isBrowserPolicyNoise(error: unknown): boolean {
    const text = this.errorText(error).toLowerCase();

    return text.includes('permissions policy') && text.includes('unload');
  }

  private errorText(error: unknown): string {
    if (!error) {
      return '';
    }

    if (typeof error === 'string') {
      return error;
    }

    const value = error as any;
    const pieces = [
      value?.name,
      value?.message,
      value?.reason,
      value?.error,
      value?.featureId,
      value?.feature,
      value?.body?.featureId,
      value?.body?.message,
      value?.cause?.message,
      value?.cause?.featureId,
      value?.cause?.body?.featureId,
      value?.cause?.body?.message,
      error,
    ];

    return pieces
      .filter((item) => item !== undefined && item !== null)
      .map((item) => {
        try {
          return typeof item === 'string' ? item : JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .join(' ');
  }
}
