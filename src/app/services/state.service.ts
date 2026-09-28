import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CryptoHelper } from '../helpers/crypto-helper';

export interface PoliceStationPayload {
  ps_cd?: number;
  ps_name: string;
  is_draft?: boolean;
  is_active?: boolean;
}

export interface DistrictPayload {
  district_cd?: number;
  district_name: string;
  is_draft?: boolean;
  is_active?: boolean;
  police_stations?: PoliceStationPayload[];
}

export interface StatePayload {
  state_cd?: number;
  state_name: string;
  is_draft?: boolean;
  is_active?: boolean;
  districts?: DistrictPayload[];
}

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    accept: '*/*',
  });

  private handleError(error: any) {
    console.error('State API Error:', error);
    return throwError(() => error);
  }

  // =====================================================
  // GET ALL STATES
  // Payload sent: { page_number: pageNumber, record_per_page: recordPerPage }
  // record_per_page MUST be 50
  // =====================================================
  getAllState(pageNumber: number = 1, recordPerPage: number = 50): Observable<any> {
    const payload = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('========== STATE GET ALL ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}State/GetAll`);

    return this.http
      .post<any>(`${this.baseUrl}State/GetAll`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }
  getAllStateNew(pageNumber: number = 1, recordPerPage: number = 50): Observable<any> {
    const payload = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('========== STATE GET ALL ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}State/GetAll`);

    return this.http
      .post<any>(`${this.baseUrl}State/GetAllState`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET STATE BY ID
  // =====================================================
  getStateById(autostate_id: number | string): Observable<any> {
    const payload = {
      autostate_id: autostate_id,
      id: autostate_id,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/GetById`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // ADD STATE
  // Payload sent:
  // {
  //   "state_cd": 40,
  //   "state_name": "NEW STATE",
  //   "is_draft": false,
  //   "districts": [...]
  // }
  // =====================================================
  addState(
    payloadOrName: StatePayload | string,
    state_cd?: number,
    is_draft: boolean = false,
    districts: DistrictPayload[] = [],
  ): Observable<any> {
    let stateObj: StatePayload;
    if (typeof payloadOrName === 'string') {
      stateObj = {
        state_name: payloadOrName,
        state_cd: state_cd,
        is_draft: is_draft,
        districts: districts,
      };
    } else {
      stateObj = payloadOrName;
    }

    const payload = {
      state_cd: Number(stateObj.state_cd) || 0,
      state_name: stateObj.state_name || '',
      is_draft: !!stateObj.is_draft,
      districts: stateObj.districts || [],
    };

    // console.log('========== STATE ADD ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/Add`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // UPDATE STATE
  // Payload sent:
  // {
  //   "state_cd": 40,
  //   "state_name": "UPDATED STATE",
  //   "is_draft": false,
  //   "districts": [...]
  // }
  // =====================================================
  updateState(
    payloadOrId: StatePayload | number | string,
    state_name?: string,
    state_cd?: number,
    is_draft: boolean = false,
    districts: DistrictPayload[] = [],
  ): Observable<any> {
    let stateObj: StatePayload;
    if (typeof payloadOrId === 'object' && payloadOrId !== null) {
      stateObj = payloadOrId;
    } else {
      stateObj = {
        state_cd: state_cd,
        state_name: state_name || '',
        is_draft: is_draft,
        districts: districts,
      };
    }

    const payload = {
      state_cd: Number(stateObj.state_cd) || 0,
      state_name: stateObj.state_name || '',
      is_draft: !!stateObj.is_draft,
      districts: stateObj.districts || [],
    };

    // console.log('========== STATE UPDATE ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/Update`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DELETE STATE
  // Payload sent:
  // {
  //   "state_cd": 40
  // }
  // =====================================================
  // =====================================================
  // DELETE STATE
  // Payload sent:
  // {
  //   "state_cd": 40
  // }
  // =====================================================
  deleteState(state_cd: number | string): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
    };

    // console.log('========== STATE DELETE ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/Delete`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET DISTRICTS BY STATE CODE
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "page_number": 1,
  //   "record_per_page": 20
  // }
  // =====================================================
  getDistrictsByStateCode(
    state_cd: number | string,
    pageNumber: number = 1,
    recordPerPage: number = 20,
  ): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('========== GET DISTRICTS BY STATE CODE ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}State/GetDistrictsByStateCode`);

    return this.http
      .post<any>(`${this.baseUrl}State/GetDistrictsByStateCode`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // ADD DISTRICT
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district": {
  //     "district_cd": 39036,
  //     "district_name": "New District",
  //     "is_draft": false,
  //     "police_stations": [...]
  //   }
  // }
  // =====================================================
  addDistrict(state_cd: number | string, district: any): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district: {
        district_cd: Number(district.district_cd) || 0,
        district_name: district.district_name || '',
        is_draft: !!district.is_draft,
        police_stations: (district.police_stations || []).map((ps: any) => ({
          ps_cd: Number(ps.ps_cd) || 0,
          ps_name: ps.ps_name || '',
          is_draft: !!ps.is_draft,
        })),
      },
    };

    // console.log('========== ADD DISTRICT ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/AddDistrict`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // UPDATE DISTRICT
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district_cd": 39001,
  //   "district_name": "Delhi Updated",
  //   "is_draft": false,
  //   "police_stations": [...]
  // }
  // =====================================================
  updateDistrict(
    state_cd: number | string,
    district_cd: number | string,
    district_name: string,
    is_draft: boolean = false,
    isActive: boolean,
    police_stations: any[] = [],
  ): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district_cd: Number(district_cd) || 0,
      district_name: district_name || '',
      is_draft: !!is_draft,
      is_active: isActive,
      police_stations: (police_stations || []).map((ps: any) => ({
        ps_cd: Number(ps.ps_cd) || 0,
        ps_name: ps.ps_name || '',
        is_draft: !!ps.is_draft,
      })),
    };

    // console.log('========== UPDATE DISTRICT ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/UpdateDistrict`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DELETE DISTRICT
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district_cd": 39001
  // }
  // =====================================================
  deleteDistrict(state_cd: number | string, district_cd: number | string): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district_cd: Number(district_cd) || 0,
    };

    // console.log('========== DELETE DISTRICT ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/DeleteDistrict`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET POLICE STATIONS BY STATE CODE AND DISTRICT CODE
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district_cd": 39001,
  //   "page_number": 1,
  //   "record_per_page": 20
  // }
  // =====================================================
  getPoliceStationsByStateCodeAndDistrictCode(
    state_cd: number | string,
    district_cd: number | string,
    pageNumber: number = 1,
    recordPerPage: number = 20,
  ): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district_cd: Number(district_cd) || 0,
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('========== GET POLICE STATIONS BY STATE & DISTRICT CODE ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}State/GetPoliceStationsByStateCodeAndDistrictCode`);

    return this.http
      .post<any>(
        `${this.baseUrl}State/GetPoliceStationsByStateCodeAndDistrictCode`,
        JSON.stringify(encryptedPayload),
        { headers: this.headers },
      )
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // ADD POLICE STATION
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district_cd": 39001,
  //   "police_station": {
  //     "ps_cd": 3900102,
  //     "ps_name": "New Delhi Police Station",
  //     "is_draft": false
  //   }
  // }
  // =====================================================
  addPoliceStation(
    state_cd: number | string,
    district_cd: number | string,
    police_station: any,
  ): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district_cd: Number(district_cd) || 0,
      police_station: {
        ps_cd: Number(police_station.ps_cd) || 0,
        ps_name: police_station.ps_name || '',
        is_draft: !!police_station.is_draft,
      },
    };

    // console.log('========== ADD POLICE STATION ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/AddPoliceStation`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // UPDATE POLICE STATION
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district_cd": 39001,
  //   "ps_cd": 3900101,
  //   "ps_name": "Delhi Zonal Police Unit",
  //   "is_draft": false
  // }
  // =====================================================
  updatePoliceStation(
    state_cd: number | string,
    district_cd: number | string,
    ps_cd: number | string,
    ps_name: string,
    is_draft: boolean = false,
    is_active: boolean = true,
  ): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district_cd: Number(district_cd) || 0,
      ps_cd: Number(ps_cd) || 0,
      ps_name: ps_name || '',
      is_draft: !!is_draft,
      is_active: !!is_active,
    };

    // console.log('========== UPDATE POLICE STATION ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/UpdatePoliceStation`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DELETE POLICE STATION
  // Payload sent:
  // {
  //   "state_cd": 39,
  //   "district_cd": 39001,
  //   "ps_cd": 3900101
  // }
  // =====================================================
  deletePoliceStation(
    state_cd: number | string,
    district_cd: number | string,
    ps_cd: number | string,
  ): Observable<any> {
    const payload = {
      state_cd: Number(state_cd) || 0,
      district_cd: Number(district_cd) || 0,
      ps_cd: Number(ps_cd) || 0,
    };

    // console.log('========== DELETE POLICE STATION ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}State/DeletePoliceStation`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DECRYPT RESPONSE HELPER
  // =====================================================
  decryptResponse(encryptedData: string): any {
    if (!encryptedData) {
      throw new Error('Encrypted response is empty');
    }

    const decryptedText = CryptoHelper.decrypt(encryptedData);

    if (!decryptedText) {
      throw new Error('Unable to decrypt API response');
    }

    return typeof decryptedText === 'string' ? JSON.parse(decryptedText) : decryptedText;
  }
}
