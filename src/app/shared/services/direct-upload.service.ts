import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DirectUploadService {
  // Dedicated transport prevents auth interceptors/cookies from reaching a presigned provider URL.
  upload(url: string, file: File, headers: Record<string, string>): Observable<HttpEvent<unknown>> {
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.withCredentials = false;
      xhr.timeout = 300000;
      Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
      xhr.upload.onprogress = event => observer.next({ type: HttpEventType.UploadProgress, loaded: event.loaded, total: event.total });
      xhr.onload = () => {
        // A retry may find the create-once object already present. Completion verifies its exact metadata/content.
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 412) {
          observer.next(new HttpResponse({ status: 200 })); observer.complete();
        } else observer.error(new HttpErrorResponse({ status: xhr.status, statusText: 'Upload failed' }));
      };
      xhr.onerror = xhr.ontimeout = () => observer.error(new HttpErrorResponse({ status: 0, statusText: 'Upload interrupted' }));
      xhr.send(file);
      return () => { xhr.onload = xhr.onerror = xhr.ontimeout = null; xhr.abort(); };
    });
  }
}
