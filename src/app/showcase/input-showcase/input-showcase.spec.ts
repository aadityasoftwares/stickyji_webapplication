import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputShowcase } from './input-showcase';

describe('InputShowcase', () => {
  let component: InputShowcase;
  let fixture: ComponentFixture<InputShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(InputShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
