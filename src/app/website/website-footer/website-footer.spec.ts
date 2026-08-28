import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebsiteFooter } from './website-footer';

describe('WebsiteFooter', () => {
  let component: WebsiteFooter;
  let fixture: ComponentFixture<WebsiteFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(WebsiteFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
