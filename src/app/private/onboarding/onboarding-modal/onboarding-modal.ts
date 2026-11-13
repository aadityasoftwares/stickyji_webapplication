import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideFolderOpen,
  LucidePanelsTopLeft,
  LucideSparkles,
  LucideStickyNote,
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput } from '../../../shared/components/input/input';
import { Modal } from '../../../shared/components/modal/modal';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Badge } from '../../../shared/components/badge/badge';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { OnboardingService } from '../services/onboarding.service';
import type { InitialSetupResult } from '../interfaces/onboarding.interface';

@Component({
  selector: 'app-onboarding-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppIcon,
    Button,
    AppInput,
    Modal,
    StickyCard,
    Badge,
  ],
  templateUrl: './onboarding-modal.html',
  styleUrl: './onboarding-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingModal {
  private readonly onboardingService = inject(OnboardingService);
  private readonly toastService = inject(ToastService);

  @Input() open = false;
  @Output() readonly setupComplete = new EventEmitter<InitialSetupResult>();

  // Lucide Icons
  readonly LucideSparkles = LucideSparkles;
  readonly LucideCheck = LucideCheck;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucideStickyNote = LucideStickyNote;

  // Form State
  readonly currentStep = signal<1 | 2>(1);
  readonly workspaceTitle = signal<string>('');
  readonly folderTitle = signal<string>('');
  readonly workspaceTouched = signal<boolean>(false);
  readonly folderTouched = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Suggestions for quick selection
  readonly workspaceSuggestions = [
    'Personal',
    'Work',
    'Startup',
    'My Projects',
    'Study',
  ];

  readonly folderSuggestions = [
    'My Notes',
    'Daily Tasks',
    'Sprint 1',
    'Project Ideas',
    'Quick Drafts',
  ];

  readonly isWorkspaceValid = computed(() => {
    const title = this.workspaceTitle().trim();
    return title.length >= 1 && title.length <= 255;
  });

  readonly isFolderValid = computed(() => {
    const title = this.folderTitle().trim();
    return title.length >= 1 && title.length <= 255;
  });

  readonly workspaceError = computed(() => {
    if (!this.workspaceTouched()) return '';
    const title = this.workspaceTitle().trim();
    if (!title) return 'Workspace name is required.';
    if (title.length > 255) return 'Workspace name cannot exceed 255 characters.';
    return '';
  });

  readonly folderError = computed(() => {
    if (!this.folderTouched()) return '';
    const title = this.folderTitle().trim();
    if (!title) return 'Folder name is required.';
    if (title.length > 255) return 'Folder name cannot exceed 255 characters.';
    return '';
  });

  selectWorkspaceSuggestion(name: string): void {
    this.workspaceTitle.set(name);
    this.workspaceTouched.set(true);
    this.errorMessage.set(null);
  }

  selectFolderSuggestion(name: string): void {
    this.folderTitle.set(name);
    this.folderTouched.set(true);
    this.errorMessage.set(null);
  }

  onWorkspaceInput(value: string): void {
    this.workspaceTitle.set(value);
    this.errorMessage.set(null);
  }

  onFolderInput(value: string): void {
    this.folderTitle.set(value);
    this.errorMessage.set(null);
  }

  onWorkspaceKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.nextStep();
    }
  }

  onFolderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitSetup();
    }
  }

  nextStep(): void {
    this.workspaceTouched.set(true);
    if (!this.isWorkspaceValid()) {
      return;
    }
    this.errorMessage.set(null);
    this.currentStep.set(2);
  }

  prevStep(): void {
    this.errorMessage.set(null);
    this.currentStep.set(1);
  }

  submitSetup(): void {
    this.folderTouched.set(true);
    if (!this.isFolderValid() || !this.isWorkspaceValid()) {
      return;
    }

    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      workspaceTitle: this.workspaceTitle().trim(),
      folderTitle: this.folderTitle().trim(),
    };

    this.onboardingService.initialSetup(payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toastService.success(
          response.message || 'Workspace and folder created successfully!',
          { title: 'Welcome to Sticky Ji!' },
        );
        this.setupComplete.emit(response.data);
      },
      error: (error) => {
        this.submitting.set(false);
        const message =
          error?.error?.message ||
          error?.message ||
          'Failed to complete setup. Please check your connection and try again.';
        this.errorMessage.set(message);
        this.toastService.error(message, { title: 'Setup Failed' });
      },
    });
  }
}

