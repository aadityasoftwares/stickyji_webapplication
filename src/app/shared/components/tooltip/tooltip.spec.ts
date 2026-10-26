import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Button } from '../button/button';
import { Tooltip } from './tooltip';

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <button type="button" appTooltip="Hover details" [tooltipDelay]="0" [tooltipHideDelay]="0">
      Action
    </button>
  `,
})
class TooltipHost {}

@Component({
  standalone: true,
  imports: [Tooltip, Button],
  template: `
    <button [appTooltip]="details()" [attr.title]="nativeTitle()" [tooltipDelay]="0">
      Dynamic action
    </button>
    <app-button title="Built-in details" ariaLabel="Edit item" [iconOnly]="true" />
    <app-button
      title="Fallback details"
      appTooltip="Explicit details"
      [tooltipDelay]="0"
      ariaLabel="Remove item"
      [iconOnly]="true"
    />
  `,
})
class TooltipCompatibilityHost {
  details = signal<string | null>('Custom details');
  nativeTitle = signal('Native details');
}

describe('Tooltip', () => {
  let fixture: ComponentFixture<TooltipHost>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();
    await fixture.whenStable();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('shows only while hovering and closes immediately when clicked', () => {
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(document.querySelector('.app-tooltip-panel')).toBeNull();

    button.dispatchEvent(new Event('pointerenter'));
    expect(document.querySelector('.app-tooltip-panel')?.textContent).toContain('Hover details');

    button.click();
    expect(document.querySelector('.app-tooltip-panel')).toBeNull();
  });

  it('does not remain visible after pointer leave when the button is focused', () => {
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    button.dispatchEvent(new Event('pointerenter'));
    expect(document.querySelector('.app-tooltip-panel')).toBeTruthy();

    button.dispatchEvent(new Event('pointerleave'));
    expect(document.querySelector('.app-tooltip-ready')).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('Custom tooltip compatibility', () => {
  let fixture: ComponentFixture<TooltipCompatibilityHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipCompatibilityHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TooltipCompatibilityHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  it('removes native titles initially and after reactive updates', async () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.hasAttribute('title')).toBe(false);
    fixture.componentInstance.nativeTitle.set('Updated native details');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.hasAttribute('title')).toBe(false);
    button.dispatchEvent(new Event('pointerenter'));
    expect(document.querySelector('.app-tooltip-panel')?.textContent).toContain('Custom details');
  });

  it('uses the shared button title as a custom tooltip and preserves its accessible label', () => {
    const host = fixture.nativeElement.querySelectorAll('app-button')[0];
    const button = host.querySelector('button');
    const directive = fixture.debugElement
      .queryAll(By.directive(Button))[0]
      .query(By.directive(Tooltip))
      .injector.get(Tooltip);
    directive.tooltipDelay = 0;
    button.dispatchEvent(new Event('pointerenter'));
    expect(document.querySelectorAll('.app-tooltip-panel').length).toBe(1);
    expect(document.querySelector('.app-tooltip-panel')?.textContent).toContain('Built-in details');
    expect(host.hasAttribute('title')).toBe(false);
    expect(button.hasAttribute('title')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Edit item');
  });

  it('shows only the explicit tooltip when a component also supplies a title', async () => {
    const host = fixture.nativeElement.querySelectorAll('app-button')[1];
    const button = host.querySelector('button');
    host.setAttribute('title', 'Reintroduced host title');
    button.setAttribute('title', 'Reintroduced child title');
    await Promise.resolve();
    expect(host.hasAttribute('title')).toBe(false);
    expect(button.hasAttribute('title')).toBe(false);
    button.dispatchEvent(new Event('pointerenter'));
    expect(document.querySelectorAll('.app-tooltip-panel').length).toBe(1);
    expect(document.querySelector('.app-tooltip-panel')?.textContent).toContain('Explicit details');
  });

  it('accepts empty dynamic tooltip values and removes a visible tooltip', async () => {
    const button = fixture.nativeElement.querySelector('button');
    button.dispatchEvent(new Event('pointerenter'));
    fixture.componentInstance.details.set(null);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.debugElement.query(By.directive(Tooltip)).injector.get(Tooltip).text).toBe('');
    expect(document.querySelector('.app-tooltip-panel')).toBeNull();
  });
});
