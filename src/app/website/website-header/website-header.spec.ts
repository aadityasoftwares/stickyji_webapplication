import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WebsiteHeader } from './website-header';

@Component({ template: '' })
class EmptyPage {}

describe('WebsiteHeader navigation', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [WebsiteHeader],
      providers: [provideRouter([{ path: 'home', component: EmptyPage }])],
    });
    await TestBed.inject(Router).navigateByUrl('/home');
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
