import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tape } from './tape';

describe('Tape', () => {
  let component: Tape;
  let fixture: ComponentFixture<Tape>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tape],
    }).compileComponents();

    fixture = TestBed.createComponent(Tape);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
