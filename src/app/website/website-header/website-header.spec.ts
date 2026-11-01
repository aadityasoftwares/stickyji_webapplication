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
        provideRouter([
          { path: 'home', component: EmptyPage },
          { path: 'pricing', component: EmptyPage },
          { path: 'about-us', component: EmptyPage },
        ]),
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

  it('renders Home as the first nav item matching standard nav styling on non-active and does not include Reviews in top nav', () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    fixture.detectChanges();
    const firstLink = fixture.nativeElement.querySelector('.desktop-navigation a');
    expect(firstLink.textContent).toContain('Home');
    expect(firstLink.classList.contains('nav-link')).toBe(true);

    const reviewsLink = Array.from(
      fixture.nativeElement.querySelectorAll('.desktop-navigation a'),
    ).find((el: any) => el.textContent.includes('Reviews'));
    expect(reviewsLink).toBeUndefined();
  });

  it('renders icons for all navigation items in desktop and mobile header including dropdown menu', () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    fixture.componentInstance.mobileMenuOpen = true;
    fixture.detectChanges();
    const desktopTopIcons = fixture.nativeElement.querySelectorAll(
      '.desktop-navigation .nav-item-icon',
    );
    expect(desktopTopIcons.length).toBe(fixture.componentInstance.navItems.length);

    const mobileTopIcons = fixture.nativeElement.querySelectorAll(
      '.mobile-navigation .mobile-link-start > .nav-item-icon',
    );
    expect(mobileTopIcons.length).toBe(fixture.componentInstance.navItems.length);

    const dropdownItems = fixture.nativeElement.querySelectorAll('.dropdown-item');
    expect(dropdownItems.length).toBe(4);
    expect(dropdownItems[0].textContent).toContain('About us');
    expect(dropdownItems[1].textContent).toContain('Contact us');
    expect(dropdownItems[2].textContent).toContain('Privacy policy');
    expect(dropdownItems[3].textContent).toContain('Terms & conditions');

    const mobileSubnavLinks = fixture.nativeElement.querySelectorAll('.mobile-subnav-link');
    expect(mobileSubnavLinks.length).toBe(4);

    const signInIcon = fixture.nativeElement.querySelector('.header-sign-in app-icon');
    expect(signInIcon).not.toBeNull();

    const startIcon = fixture.nativeElement.querySelector('.header-start app-icon');
    expect(startIcon).not.toBeNull();
  });

  it('marks the current section in desktop and mobile navigation including company child routes', async () => {
    const fixture = TestBed.createComponent(WebsiteHeader);
    await TestBed.inject(Router).navigateByUrl('/pricing');
    fixture.componentInstance.mobileMenuOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a[aria-current="location"]').length).toBe(2);
    expect(fixture.nativeElement.querySelector('a.is-active').textContent).toContain('Pricing');

    // Test More dropdown active state for company pages
    const moreItem = fixture.componentInstance.navItems.find((item) => item.label === 'More')!;
    await TestBed.inject(Router).navigateByUrl('/about-us');
    expect(fixture.componentInstance.isNavActive(moreItem)).toBe(true);
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
