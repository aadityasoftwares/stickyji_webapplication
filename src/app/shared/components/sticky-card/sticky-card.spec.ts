import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyCard } from './sticky-card';

describe('StickyCard', () => {
  let component: StickyCard;
  let fixture: ComponentFixture<StickyCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyCard],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
