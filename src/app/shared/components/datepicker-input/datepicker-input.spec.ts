import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatepickerInput } from './datepicker-input';
import { MatDatepicker } from '@angular/material/datepicker';

describe('DatepickerInput', () => {
  let component: DatepickerInput;
  let fixture: ComponentFixture<DatepickerInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerInput],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formats dates readably without changing the stored calendar day', () => {
    component.writeValue('2026-10-25T00:00:00.000Z');
    expect(component.displayValue).toBe('25 Oct 2026');
    component.handleBlur(new FocusEvent('blur'));
    expect(component.value).toBe('2026-10-25T00:00:00.000Z');
    component.displayFormat = 'DD/MM/YYYY';
    expect(component.displayValue).toBe('25/10/2026');
  });

  it('accepts numeric and named-month dates and rejects impossible dates', () => {
    const input = fixture.nativeElement.querySelector('input');
    for (const value of ['25/10/2026', '25-10-2026', '25 Oct 2026', '2026-10-25']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      expect(component.value).toBe('2026-10-25T00:00:00.000Z');
      expect(component.parseInvalid).toBe(false);
    }
    input.value = '31 Feb 2026';
    input.dispatchEvent(new Event('input'));
    expect(component.parseInvalid).toBe(true);
    expect(component.value).toBeNull();
  });

  it('only publishes a calendar selection after Apply', async () => {
    const values: unknown[] = [];
    component.valueChange.subscribe((value) => values.push(value));
    fixture.nativeElement.querySelector('.app-datepicker-picker-button').click();
    await fixture.whenStable();
    const cell = document.querySelector<HTMLButtonElement>(
      '.app-common-datepicker-panel .mat-calendar-body-cell:not(.mat-calendar-body-disabled)',
    )!;
    cell.click();
    await fixture.whenStable();
    expect(values).toEqual([]);
    document.querySelector<HTMLButtonElement>('.app-calendar-apply')!.click();
    await fixture.whenStable();
    expect(values.length).toBe(1);
    expect(component.value).toBeTruthy();
  });

  it('prevents Today from bypassing date restrictions', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component.minDate = tomorrow;
    expect(component.canSelectToday).toBe(false);
    component.selectToday({ close: () => undefined } as MatDatepicker<Date>);
    expect(component.value).toBeNull();
    component.minDate = null;
    component.dateFilter = () => false;
    expect(component.canSelectToday).toBe(false);
  });
});
