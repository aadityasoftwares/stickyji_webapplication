import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckboxdividerShowcase } from './checkboxdivider-showcase';

describe('CheckboxdividerShowcase', () => {
  let component: CheckboxdividerShowcase;
  let fixture: ComponentFixture<CheckboxdividerShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxdividerShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxdividerShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
