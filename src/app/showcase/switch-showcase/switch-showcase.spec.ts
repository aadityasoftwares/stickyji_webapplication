import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchShowcase } from './switch-showcase';

describe('SwitchShowcase', () => {
  let component: SwitchShowcase;
  let fixture: ComponentFixture<SwitchShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
