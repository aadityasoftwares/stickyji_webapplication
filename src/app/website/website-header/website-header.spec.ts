import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WebsiteHeader } from './website-header';
import { AuthStore } from '../../public/auth/state/auth.store';

@Component({ template: '' })
class EmptyPage {}

describe('WebsiteHeader navigation', () => {
  const isAuthenticated = signal(false);
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(async () => {
    isAuthenticated.set(false);
    TestBed.configureTestingModule({
      imports: [WebsiteHeader],
      providers: [
        provideRouter([{ path: 'home', component: EmptyPage }]),
        { provide: AuthStore, useValue: { isAuthenticated } },
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/home');
  });

  it('offers continued app access on desktop and mobile for a restored session', () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    fixture.componentInstance.mobileMenuOpen = true;
    isAuthenticated.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header-sign-in')).toBeNull();
    expect(fixture.nativeElement.querySelector('.header-start').textContent).toContain(
      'Continue to app',
    );
    expect(fixture.nativeElement.querySelector('.mobile-actions').textContent).toContain(
      'Continue to app',
    );
    expect(fixture.nativeElement.querySelectorAll('.mobile-actions app-button').length).toBe(1);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const signup = vi.spyOn(fixture.componentInstance.primaryActionClick, 'emit');
    fixture.componentInstance.onPrimaryAction();
    expect(navigate).toHaveBeenCalledWith('/app');
    expect(signup).not.toHaveBeenCalled();
    expect(fixture.componentInstance.mobileMenuOpen).toBe(false);
    isAuthenticated.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header-sign-in')).not.toBeNull();
    fixture.componentInstance.onPrimaryAction();
    expect(signup).toHaveBeenCalled();
  });

  it('marks the current section in desktop and mobile navigation', () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    fixture.detectChanges();
    fixture.componentInstance.activeSection.set('pricing');
    fixture.componentInstance.mobileMenuOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a[aria-current="location"]').length).toBe(2);
    expect(fixture.nativeElement.querySelector('a.is-active').textContent).toContain('Pricing');
  });

  it('hides on downward scroll and returns on upward scroll or near the top', () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    fixture.detectChanges();
    const moveTo = (y: number) => {
      vi.stubGlobal('scrollY', y);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
    };
    moveTo(200);
    expect(fixture.nativeElement.classList.contains('header-hidden')).toBe(true);
    moveTo(198);
    expect(fixture.nativeElement.classList.contains('header-hidden')).toBe(true);
    moveTo(180);
    expect(fixture.nativeElement.classList.contains('header-hidden')).toBe(false);
    moveTo(300);
    moveTo(0);
    expect(fixture.nativeElement.classList.contains('header-hidden')).toBe(false);
    fixture.componentInstance.mobileMenuOpen = true;
    moveTo(400);
    expect(fixture.nativeElement.classList.contains('header-hidden')).toBe(false);
  });

  it('uses router navigation and preserves modified clicks', () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const event = new MouseEvent('click', { cancelable: true });
    fixture.componentInstance.onNavSelected({ label: 'Pricing', href: '/home#pricing' }, event);
    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/home#pricing');
    navigate.mockClear();
    const modified = new MouseEvent('click', { ctrlKey: true, cancelable: true });
    fixture.componentInstance.onNavSelected({ label: 'Pricing', href: '/home#pricing' }, modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
