import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricsComponent } from './historics.component';

describe('HistoricsComponent', () => {
  let component: HistoricsComponent;
  let fixture: ComponentFixture<HistoricsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistoricsComponent]
    });
    fixture = TestBed.createComponent(HistoricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
