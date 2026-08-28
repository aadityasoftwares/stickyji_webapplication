import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadioShowcase } from './radio-showcase';

describe('RadioShowcase', () => {
  let component: RadioShowcase;
  let fixture: ComponentFixture<RadioShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(RadioShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
