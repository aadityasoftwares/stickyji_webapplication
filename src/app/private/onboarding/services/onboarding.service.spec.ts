import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OnboardingService } from './onboarding.service';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OnboardingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('checks onboarding status and sets modal open when onboarding is required', () => {
    service.checkStatus().subscribe((status) => {
      expect(status?.requiresOnboarding).toBe(true);
      expect(status?.hasWorkspaces).toBe(false);
      expect(status?.hasFolders).toBe(false);
    });

    const req = httpMock.expectOne(API_ENDPOINTS.onboarding.status);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      message: 'Onboarding status retrieved successfully.',
      data: {
        hasWorkspaces: false,
        hasFolders: false,
        requiresOnboarding: true,
      },
    });

    expect(service.status()?.requiresOnboarding).toBe(true);
    expect(service.showModal()).toBe(true);
  });

  it('keeps modal closed when onboarding is not required', () => {
    service.checkStatus().subscribe((status) => {
      expect(status?.requiresOnboarding).toBe(false);
      expect(status?.hasWorkspaces).toBe(true);
      expect(status?.hasFolders).toBe(true);
    });

    const req = httpMock.expectOne(API_ENDPOINTS.onboarding.status);
    req.flush({
      success: true,
      data: {
        hasWorkspaces: true,
        hasFolders: true,
        requiresOnboarding: false,
      },
    });

    expect(service.status()?.requiresOnboarding).toBe(false);
    expect(service.showModal()).toBe(false);
  });

  it('submits initial setup and updates onboarding status on success', () => {
    const payload = {
      workspaceTitle: 'Personal',
      folderTitle: 'My Notes',
    };

    service.initialSetup(payload).subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data.workspace.name).toBe('Personal');
      expect(response.data.folder.name).toBe('My Notes');
    });

    const req = httpMock.expectOne(API_ENDPOINTS.onboarding.initialSetup);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      success: true,
      message: 'Initial onboarding setup completed successfully.',
      data: {
        workspace: { id: 'ws-1', name: 'Personal' },
        folder: { id: 'fld-1', name: 'My Notes' },
      },
    });

    expect(service.status()?.requiresOnboarding).toBe(false);
    expect(service.showModal()).toBe(false);
    expect(service.completed()).toBe(true);
  });

  it('resets state on reset()', () => {
    service.openModal();
    expect(service.showModal()).toBe(true);

    service.reset();
    expect(service.showModal()).toBe(false);
    expect(service.status()).toBeNull();
    expect(service.completed()).toBe(false);
  });
});

