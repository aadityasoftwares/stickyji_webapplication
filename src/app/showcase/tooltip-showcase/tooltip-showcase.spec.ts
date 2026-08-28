import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TooltipShowcase } from './tooltip-showcase';

describe('TooltipShowcase', () => {
  let component: TooltipShowcase;
  let fixture: ComponentFixture<TooltipShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(TooltipShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
