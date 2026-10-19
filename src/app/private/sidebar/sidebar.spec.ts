import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit logout event and close mobile navigation when requestLogout is called', () => {
    fixture.componentRef.setInput('mobileOpen', true);
    const logoutSpy = vi.fn();
    component.logout.subscribe(logoutSpy);
    const mobileSpy = vi.fn();
    component.mobileClosed.subscribe(mobileSpy);

    component.requestLogout();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mobileSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit logout event if loggingOut is true', () => {
    fixture.componentRef.setInput('loggingOut', true);
    const logoutSpy = vi.fn();
    component.logout.subscribe(logoutSpy);

    component.requestLogout();

    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('should disable logout button and show Logging out... when loggingOut is true', async () => {
    fixture.componentRef.setInput('loggingOut', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const logoutBtn = fixture.debugElement.query(By.css('.logout-item button'));
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn.nativeElement.disabled).toBe(true);
    expect(logoutBtn.nativeElement.textContent).toContain('Logging out...');
  });
});

// Regression coverage for the sidebar's navigation and disclosure controls.
describe('Sidebar navigation', () => {
  let fixture: ComponentFixture<Sidebar>;
  let component: Sidebar;
  const getButton = (label: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('keeps every existing destination available in the compact rail', async () => {
    fixture.componentRef.setInput('collapsed', true);
    await fixture.whenStable();
    const destinations = [
      ['Today', '/app/today'],
      ['Notes', '/app/stickynotes/my'],
      ['Favourites', '/app/stickynotes/favorites'],
      ['Workspaces', '/app/workspaces/my'],
      ['Folders', '/app/workspacefolders/my'],
      ['Members', '/app/workspace/members'],
      ['Roles & permissions', '/app/workspace/roles-permissions'],
      ['Profile', '/app/account/profile'],
      ['Preferences', '/app/account/preferences'],
    ];
    for (const [label, route] of destinations) {
      const link = fixture.nativeElement.querySelector(`a[aria-label="${label}"]`);
      expect(link?.getAttribute('href')).toBe(route);
      expect(link?.closest('[hidden]')).toBeNull();
    }
    const changed = vi.fn();
    component.collapsedChange.subscribe(changed);
    getButton('Expand sidebar').click();
    expect(changed).toHaveBeenCalledWith(false);
  });

  it('collapses sections and restores their choice after using the icon rail', async () => {
    getButton('Collapse Workspace').click();
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('section[aria-label="Workspace"] .nav-list');
    expect(group.hidden).toBe(true);
    expect(getButton('Expand Workspace').getAttribute('aria-expanded')).toBe('false');
    fixture.componentRef.setInput('collapsed', true);
    await fixture.whenStable();
    expect(group.hidden).toBe(false);
    fixture.componentRef.setInput('collapsed', false);
    await fixture.whenStable();
    expect(group.hidden).toBe(true);
    getButton('Expand Workspace').click();
    await fixture.whenStable();
    expect(group.hidden).toBe(false);
  });

  it('switches real workspaces and closes mobile navigation without emitting for disabled or current entries', async () => {
    fixture.componentRef.setInput('workspaces', [
      { value: 'personal', label: 'Personal' },
      { value: 'team', label: 'Team' },
      { value: 'disabled', label: 'Archived', disabled: true },
    ]);
    fixture.componentRef.setInput('workspaceId', 'personal');
    fixture.componentRef.setInput('mobileOpen', true);
    const changed = vi.fn();
    const closed = vi.fn();
    component.workspaceChange.subscribe(changed);
    component.mobileClosed.subscribe(closed);
    await fixture.whenStable();
    expect(getButton('Switch to Personal').getAttribute('aria-pressed')).toBe('true');
    getButton('Switch to Personal').click();
    getButton('Switch to Archived').click();
    expect(changed).not.toHaveBeenCalled();
    getButton('Switch to Team').click();
    expect(changed).toHaveBeenCalledExactlyOnceWith('team');
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('shows loading and empty states without selectable stale workspaces', async () => {
    fixture.componentRef.setInput('workspaces', [{ value: 'team', label: 'Team' }]);
    fixture.componentRef.setInput('loadingWorkspaces', true);
    const changed = vi.fn();
    component.workspaceChange.subscribe(changed);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Loading workspaces',
    );
    expect(fixture.nativeElement.querySelector('.workspace-item')).toBeNull();
    component.onWorkspaceChange('team');
    expect(changed).not.toHaveBeenCalled();
    fixture.componentRef.setInput('loadingWorkspaces', false);
    fixture.componentRef.setInput('workspaces', []);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Your workspaces will appear here.');
    expect(fixture.nativeElement.querySelector('.manage-workspaces').getAttribute('href')).toBe(
      '/app/workspaces/my',
    );
  });

  it('renders the full mobile drawer even when desktop collapse is saved', async () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.componentRef.setInput('mobileOpen', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.sidebar').classList.contains('is-collapsed')).toBe(
      false,
    );
    const closed = vi.fn();
    component.mobileClosed.subscribe(closed);
    getButton('Close navigation').click();
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
