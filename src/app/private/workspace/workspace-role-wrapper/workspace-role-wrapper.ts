import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideKey,
  LucideLock,
  LucidePencil,
  LucideShield,
  LucideShieldCheck,
  LucideStar,
  LucideUsers,
  LucideZap,
} from '@lucide/angular';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge, type BadgeVariant } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-workspace-role-wrapper',
  standalone: true,
  imports: [CommonModule, AppIcon, Badge],
  templateUrl: './workspace-role-wrapper.html',
  styleUrl: './workspace-role-wrapper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceRoleWrapper {
  @Input() name = '';
  @Input() description = '';
  @Input() isSystem = false;
  @Input() isDefault = false;
  @Input() isActive = true;
  @Input() permissionCount = '';
  @Input() priorityLabel = '';
  @Input() statusLabel = '';
  @Input() statusVariant?: BadgeVariant;
  @Input() interactive = true;
  @Input() busy = false;

  @Output() readonly opened = new EventEmitter<MouseEvent>();
  @Output() readonly keyboardOpened = new EventEmitter<void>();

  // Expose icons for template
  readonly ShieldCheck = LucideShieldCheck;
  readonly Shield = LucideShield;
  readonly Lock = LucideLock;
  readonly Key = LucideKey;
  readonly Zap = LucideZap;
  readonly Star = LucideStar;
  readonly Pencil = LucidePencil;
  readonly Users = LucideUsers;

  get typeLabel(): string {
    if (this.isDefault) return 'Default role';
    if (this.isSystem) return 'System role';
    return 'Custom role';
  }

  get typeBadgeVariant(): BadgeVariant {
    if (this.isDefault) return 'noteYellow';
    if (this.isSystem) return 'neutral';
    return 'noteGreen';
  }

  get typeIcon() {
    if (this.isSystem) return LucideLock;
    if (this.isDefault) return LucideStar;
    return LucideShield;
  }

  get shieldIcon() {
    if (this.isSystem) return LucideLock;
    if (this.isDefault) return LucideShieldCheck;
    return LucideShield;
  }

  get resolvedStatusVariant(): BadgeVariant {
    if (this.statusVariant) return this.statusVariant;
    return this.isActive ? 'success' : 'warning';
  }

  get displayName(): string {
    return this.name.trim() || 'Role name';
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.interactive || this.busy) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.keyboardOpened.emit();
    }
  }
}
