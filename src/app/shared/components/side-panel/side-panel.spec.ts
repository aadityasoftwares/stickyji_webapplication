import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { SidePanel } from './side-panel';
import * as menuFunction from '../../functions/menu.function';

describe('SidePanel', () => {
  let component: SidePanel;
  let fixture: ComponentFixture<SidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(SidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls closeAllMatMenus when opened', () => {
    const spy = vi.spyOn(menuFunction, 'closeAllMatMenus');
    component.open = true;
    component.ngOnChanges({
      open: new SimpleChange(false, true, true),
    });
    expect(spy).toHaveBeenCalled();
  });

  it('stays open after outside clicks and still closes through its close button', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    let closeRequests = 0;
    component.closed.subscribe(() => closeRequests++);
    const backdrop = fixture.nativeElement.querySelector('.app-side-panel-backdrop');
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    backdrop.click();
    await fixture.whenStable();
    expect(closeRequests).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    fixture.nativeElement.querySelector('.app-side-panel-header-actions button').click();
    expect(closeRequests).toBe(1);
  });
});
