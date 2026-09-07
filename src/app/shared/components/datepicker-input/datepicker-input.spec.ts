import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatepickerInput } from './datepicker-input';

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
});
