import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  LucideArchive,
  LucideArrowRight,
  LucideCheck,
  LucideChevronDown,
  LucideCloud,
  LucideDownload,
  LucideEllipsis,
  LucideFlame,
  LucideFolderPlus,
  LucideHeart,
  LucideInfo,
  LucideLayers,
  LucideLeaf,
  LucideLock,
  LucideLogIn,
  LucidePalette,
  LucidePencil,
  LucidePin,
  LucidePlus,
  LucideSave,
  LucideSettings,
  LucideSparkles,
  LucideStar,
  LucideStickyNote,
  LucideTrash2,
  LucideTriangleAlert,
  LucideUsers,
} from '@lucide/angular';

import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-buttons-showcase',
  standalone: true,
  imports: [Button, AppIcon],
  templateUrl: './buttons-showcase.html',
  styleUrl: './buttons-showcase.scss',
})
export class ButtonsShowcase {
  protected readonly title = signal('mystickynotes_webapp');

  protected readonly icons = {
    archive: LucideArchive,
    arrowRight: LucideArrowRight,
    check: LucideCheck,
    chevronDown: LucideChevronDown,
    cloud: LucideCloud,
    download: LucideDownload,
    ellipsis: LucideEllipsis,
    flame: LucideFlame,
    folderPlus: LucideFolderPlus,
    heart: LucideHeart,
    info: LucideInfo,
    layers: LucideLayers,
    leaf: LucideLeaf,
    lock: LucideLock,
    login: LucideLogIn,
    palette: LucidePalette,
    pencil: LucidePencil,
    pin: LucidePin,
    plus: LucidePlus,
    save: LucideSave,
    settings: LucideSettings,
    sparkles: LucideSparkles,
    star: LucideStar,
    stickyNote: LucideStickyNote,
    trash: LucideTrash2,
    warning: LucideTriangleAlert,
    users: LucideUsers,
  } as const;

  protected isSaving = false;
  protected isPinning = false;
  protected isFavorite = false;

  protected splitMenuOpen = false;
  protected tapeSplitMenuOpen = false;

  protected createNote(): void {
    console.log('Create note clicked');
  }

  protected saveNote(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;

    setTimeout(() => {
      this.isSaving = false;
    }, 1500);
  }

  protected pinMeIn(): void {
    if (this.isPinning) {
      return;
    }

    this.isPinning = true;

    setTimeout(() => {
      this.isPinning = false;
    }, 1500);
  }

  protected deleteNote(): void {
    console.log('Delete note clicked');
  }

  protected toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }

  protected toggleSplitMenu(): void {
    this.splitMenuOpen = !this.splitMenuOpen;
  }

  protected toggleTapeSplitMenu(): void {
    this.tapeSplitMenuOpen = !this.tapeSplitMenuOpen;
  }
}
