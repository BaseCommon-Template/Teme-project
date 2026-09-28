import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Newnotification } from './newnotification';

describe('Newnotification', () => {
  let component: Newnotification;
  let fixture: ComponentFixture<Newnotification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Newnotification, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Newnotification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
