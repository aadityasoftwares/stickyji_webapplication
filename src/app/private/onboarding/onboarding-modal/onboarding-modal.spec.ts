import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { OnboardingModal } from './onboarding-modal';
import { OnboardingService } from '../services/onboarding.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

describe('OnboardingModal', () => {
  let component: OnboardingModal;
  let fixture: ComponentFixture<OnboardingModal>;
  let onboardingService: OnboardingService;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingModal],
      providers: [
        OnboardingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn(),
            info: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingModal);
    component = fixture.componentInstance;
    onboardingService = TestBed.inject(OnboardingService);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('initializes on Step 1 with empty inputs', () => {
    expect(component.currentStep()).toBe(1);
    expect(component.workspaceTitle()).toBe('');
    expect(component.folderTitle()).toBe('');
    expect(component.isWorkspaceValid()).toBe(false);
  });

  it('selects workspace suggestion and validates', () => {
    component.selectWorkspaceSuggestion('Personal');
    expect(component.workspaceTitle()).toBe('Personal');
    expect(component.isWorkspaceValid()).toBe(true);
    expect(component.workspaceError()).toBe('');
  });

  it('does not advance to Step 2 if workspace name is empty', () => {
    component.workspaceTitle.set('   ');
    component.nextStep();
    expect(component.currentStep()).toBe(1);
    expect(component.workspaceError()).toBe('Workspace name is required.');
  });

  it('advances to Step 2 when workspace name is valid', () => {
    component.workspaceTitle.set('Work Team');
    component.nextStep();
    expect(component.currentStep()).toBe(2);
  });

  it('allows going back from Step 2 to Step 1', () => {
    component.workspaceTitle.set('Work Team');
    component.nextStep();
    expect(component.currentStep()).toBe(2);

    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  it('selects folder suggestion on Step 2', () => {
    component.currentStep.set(2);
    component.selectFolderSuggestion('Daily Tasks');
    expect(component.folderTitle()).toBe('Daily Tasks');
    expect(component.isFolderValid()).toBe(true);
  });

  it('submits initial setup successfully and emits setupComplete', () => {
    const mockResult = {
      workspace: { id: 'ws-123', name: 'Work Team' },
      folder: { id: 'fld-456', name: 'Sprint 1' },
    };

    vi.spyOn(onboardingService, 'initialSetup').mockReturnValue(
      of({
        success: true,
        message: 'Setup complete',
        data: mockResult,
      }),
    );

    const emitSpy = vi.spyOn(component.setupComplete, 'emit');

    component.workspaceTitle.set('Work Team');
    component.folderTitle.set('Sprint 1');
    component.currentStep.set(2);

    component.submitSetup();

    expect(onboardingService.initialSetup).toHaveBeenCalledWith({
      workspaceTitle: 'Work Team',
      folderTitle: 'Sprint 1',
    });
    expect(emitSpy).toHaveBeenCalledWith(mockResult);
    expect(toastService.success).toHaveBeenCalled();
  });

  it('handles error response during submitSetup', () => {
    vi.spyOn(onboardingService, 'initialSetup').mockReturnValue(
      throwError(() => ({ error: { message: 'Workspace already exists' } })),
    );

    component.workspaceTitle.set('Work Team');
    component.folderTitle.set('Sprint 1');
    component.currentStep.set(2);

    component.submitSetup();

    expect(component.submitting()).toBe(false);
    expect(component.errorMessage()).toBe('Workspace already exists');
    expect(toastService.error).toHaveBeenCalled();
  });
});

