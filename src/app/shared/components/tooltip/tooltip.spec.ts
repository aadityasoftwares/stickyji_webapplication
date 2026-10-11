import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
