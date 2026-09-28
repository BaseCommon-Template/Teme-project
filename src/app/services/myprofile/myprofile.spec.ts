import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MyProfileService } from './myprofile';

describe('MyProfileService', () => {
  let service: MyProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MyProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
