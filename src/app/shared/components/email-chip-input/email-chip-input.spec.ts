import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailChipInput } from './email-chip-input';

describe('EmailChipInput', () => {
  let component: EmailChipInput;
  let fixture: ComponentFixture<EmailChipInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailChipInput],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailChipInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
