import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { MyProfileService } from '../../services/myprofile/myprofile';
import { AuthService } from '../../services/auth';
import { CommonService } from '../../services/common-service';
import { CryptoHelper } from '../../helpers/crypto-helper';

@Component({
  selector: 'app-update-name',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './update-name.html',
  styleUrl: './update-name.css',
})
export class UpdateNameComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly myProfileService = inject(MyProfileService);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);

  // Form Groups
  searchForm!: FormGroup;
  updateForm!: FormGroup;

  // State signals
  readonly isSearched = signal<boolean>(false);
  readonly isSearching = signal<boolean>(false);
  readonly isUpdating = signal<boolean>(false);
  readonly searchError = signal<string | null>(null);
  readonly foundAgniveerData = signal<any>(null);
  readonly submittedUpdate = signal<boolean>(false);

  // Regex pattern for Name: Only alphabetic characters (A-Z, a-z) and spaces. No numbers or special characters.
  readonly namePattern = '^[a-zA-Z]+(?:[ ][a-zA-Z]+)*$';

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    // 1. Search Form
    this.searchForm = this.fb.group({
      agniveerId: ['', [Validators.required, Validators.minLength(1)]],
    });

    // Reset revealed data automatically if search ID is edited
    this.searchForm.get('agniveerId')?.valueChanges.subscribe(() => {
      this.onAgniveerIdChange();
    });

    // 2. Update Form
    this.updateForm = this.fb.group({
      currentName: [{ value: '', disabled: true }, [Validators.required]],
      newName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          Validators.pattern(this.namePattern),
        ],
      ],
    });
  }

  /**
   * Clears revealed search result data and error messages when user edits the search ID field
   */
  onAgniveerIdChange(): void {
    if (this.searchError()) {
      this.searchError.set(null);
    }
    if (this.isSearched()) {
      this.isSearched.set(false);
      this.updateForm.reset();
      this.foundAgniveerData.set(null);
      this.submittedUpdate.set(false);
    }
  }

  get searchControls() {
    return this.searchForm.controls;
  }

  get updateControls() {
    return this.updateForm.controls;
  }

  /**
   * Prevents numbers and special characters from being typed in New Name input
   */
  preventInvalidNameChars(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
      'Enter',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Allow single space (only if character before is not a space)
    if (event.key === ' ') {
      const target = event.target as HTMLInputElement;
      if (!target.value || target.value.endsWith(' ')) {
        event.preventDefault();
      }
      return;
    }

    // Block integers and special characters — allow only letters
    const isLetter = /^[a-zA-Z]$/.test(event.key);
    if (!isLetter) {
      event.preventDefault();
    }
  }

  /**
   * Sanitizes New Name value on input event
   */
  sanitizeNewName(): void {
    const control = this.updateForm.get('newName');
    if (!control) return;

    let val = control.value || '';
    // Remove numbers and special characters
    val = val.replace(/[^a-zA-Z ]/g, '');
    // Replace multiple consecutive spaces with a single space
    val = val.replace(/ +/g, ' ');

    if (val !== control.value) {
      control.setValue(val, { emitEvent: false });
    }
  }

  /**
   * Search Agniveer by ID using POST /api/ProfileUpdate/SearchAgniveerById
   * Payload: { "agniveer_id_no": agniveerIdVal, "Agniveer_Id_No": agniveerIdVal }
   * Response: { "Agniveer_Id_No": "AGN000001", "Name": "Dummy Candidate 1" }
   */
  onSearchAgniveer(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const agniveerIdVal = this.searchForm.value.agniveerId.trim();
    if (!agniveerIdVal) return;

    this.isSearching.set(true);
    this.searchError.set(null);
    this.isSearched.set(false);
    this.submittedUpdate.set(false);
    this.updateForm.reset();

    const payload = {
      agniveer_id_no: agniveerIdVal,
      Agniveer_Id_No: agniveerIdVal,
    };

    this.myProfileService.searchAgniveerById(payload).subscribe({
      next: (response: any) => {
        this.isSearching.set(false);
        let decryptedData: any = null;

        if (response?.data) {
          try {
            const rawDecrypted = CryptoHelper.decrypt(response.data);
            decryptedData =
              typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
            if (typeof decryptedData === 'string') {
              decryptedData = JSON.parse(decryptedData);
            }
          } catch (e) {
            decryptedData = response.data;
          }
        } else if (typeof response === 'string') {
          try {
            const rawDecrypted = CryptoHelper.decrypt(response);
            decryptedData =
              typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
            if (typeof decryptedData === 'string') {
              decryptedData = JSON.parse(decryptedData);
            }
          } catch (e) {
            decryptedData = response;
          }
        } else {
          decryptedData = response;
        }

        // Unwrap nested objects
        let unwrapped = decryptedData;
        for (let i = 0; i < 6 && unwrapped; i++) {
          if (Array.isArray(unwrapped) && unwrapped.length > 0) {
            unwrapped = unwrapped[0];
            continue;
          }
          if (unwrapped.Agniveer && typeof unwrapped.Agniveer === 'object') {
            unwrapped = Array.isArray(unwrapped.Agniveer)
              ? unwrapped.Agniveer[0]
              : unwrapped.Agniveer;
            continue;
          }
          if (unwrapped.agniveer && typeof unwrapped.agniveer === 'object') {
            unwrapped = Array.isArray(unwrapped.agniveer)
              ? unwrapped.agniveer[0]
              : unwrapped.agniveer;
            continue;
          }
          if (unwrapped.records && typeof unwrapped.records === 'object') {
            unwrapped = Array.isArray(unwrapped.records)
              ? unwrapped.records[0]
              : unwrapped.records;
            continue;
          }
          if (
            unwrapped.data &&
            !unwrapped.Name &&
            !unwrapped.name &&
            typeof unwrapped.data === 'object'
          ) {
            unwrapped = Array.isArray(unwrapped.data) ? unwrapped.data[0] : unwrapped.data;
            continue;
          }
          if (unwrapped.Table && Array.isArray(unwrapped.Table) && unwrapped.Table.length > 0) {
            unwrapped = unwrapped.Table[0];
            continue;
          }
          break;
        }

        // Check if API response indicates failure
        const isApiFailure =
          unwrapped?.status === false ||
          unwrapped?.isSuccess === false ||
          unwrapped?.success === false ||
          (unwrapped?.statusCode && unwrapped.statusCode >= 400);

        const foundName =
          unwrapped?.Name ||
          unwrapped?.name ||
          unwrapped?.candidate_name ||
          unwrapped?.CandidateName ||
          unwrapped?.full_name ||
          unwrapped?.AgniveerName ||
          '';

        if (!isApiFailure && foundName) {
          this.foundAgniveerData.set(unwrapped);
          this.updateForm.patchValue({
            currentName: foundName,
            newName: '',
          });
          this.isSearched.set(true);
          this.searchError.set(null);

          Swal.fire({
            icon: 'success',
            title: 'Agniveer Found',
            text: `Agniveer profile found for ID: ${agniveerIdVal}`,
            timer: 1800,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          });
        } else {
          this.isSearched.set(false);
          this.foundAgniveerData.set(null);
          const errMsg =
            unwrapped?.message ||
            unwrapped?.error ||
            `No Agniveer record found for ID: ${agniveerIdVal}`;

          this.searchError.set(errMsg);

          Swal.fire({
            icon: 'error',
            title: 'Record Not Found',
            text: errMsg,
            confirmButtonColor: '#1C4587',
          });
        }
      },
      error: (error: any) => {
        this.isSearching.set(false);
        this.isSearched.set(false);
        this.foundAgniveerData.set(null);
        console.error('Error searching Agniveer details:', error);

        let errMsg = 'Failed to fetch Agniveer details. Please try again.';
        if (typeof error === 'string') {
          errMsg = error;
        } else if (error?.error?.message) {
          errMsg = error.error.message;
        } else if (error?.message) {
          errMsg = error.message;
        } else if (error?.statusText) {
          errMsg = `Server Error (${error.status}: ${error.statusText})`;
        }

        if (error?.status === 302 || String(errMsg).includes('302')) {
          errMsg =
            'API Authorization Redirect (HTTP 302 Found). Please verify your API login session/token.';
        }

        this.searchError.set(errMsg);

        Swal.fire({
          icon: 'error',
          title: 'Search Error',
          text: errMsg,
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  /**
   * Update Name Submission using POST /api/ProfileUpdate/UpdateAgniveerName
   * Payload: { "agniveer_id_no": agniveerIdVal, "Agniveer_Id_No": agniveerIdVal, "Name": newName }
   */
  onUpdateName(): void {
    this.submittedUpdate.set(true);

    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const currentName = this.updateForm.getRawValue().currentName;
    const newName = this.updateForm.value.newName.trim();
    const agniveerIdVal = this.searchForm.value.agniveerId.trim();

    if (currentName.toLowerCase() === newName.toLowerCase()) {
      Swal.fire({
        icon: 'warning',
        title: 'Same Name Entered',
        text: 'The new name is identical to the current name. Please enter a different name.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }

    this.isUpdating.set(true);

    const updatePayload = {
      agniveer_id_no: agniveerIdVal,
      Agniveer_Id_No: agniveerIdVal,
      Name: newName,
    };

    this.myProfileService.updateAgniveerName(updatePayload).subscribe({
      next: (response: any) => {
        this.isUpdating.set(false);

        let decryptedData: any = null;
        if (response?.data) {
          try {
            const rawDecrypted = CryptoHelper.decrypt(response.data);
            decryptedData =
              typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
          } catch (e) {
            decryptedData = response.data;
          }
        } else {
          decryptedData = response;
        }

        const isApiFailure =
          decryptedData?.status === false ||
          decryptedData?.isSuccess === false ||
          decryptedData?.success === false ||
          (decryptedData?.statusCode && decryptedData.statusCode >= 400);

        if (isApiFailure) {
          const errMsg =
            decryptedData?.message || decryptedData?.error || 'Failed to update Agniveer name.';
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: errMsg,
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Name Updated Successfully!',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6;">
              <p><strong>Agniveer ID:</strong> ${agniveerIdVal}</p>
              <p><strong>Previous Name:</strong> <span style="color: #dc2626;">${currentName}</span></p>
              <p><strong>Updated Name:</strong> <span style="color: #16a34a; font-weight: bold;">${newName}</span></p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#1C4587',
        }).then(() => {
          // Reset the entire form after successful update
          this.onResetSearch();
        });
      },
      error: (error: any) => {
        this.isUpdating.set(false);
        console.error('Error updating Agniveer name:', error);

        let errMsg = 'Failed to update Agniveer name. Please try again.';
        if (typeof error === 'string') {
          errMsg = error;
        } else if (error?.error?.message) {
          errMsg = error.error.message;
        } else if (error?.message) {
          errMsg = error.message;
        } else if (error?.statusText) {
          errMsg = `Server Error (${error.status}: ${error.statusText})`;
        }

        if (error?.status === 302 || String(errMsg).includes('302')) {
          errMsg =
            'API Authorization Redirect (HTTP 302 Found). Please verify your login session.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: errMsg,
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  /**
   * Reset form state
   */
  onResetSearch(): void {
    this.searchForm.reset();
    this.updateForm.reset();
    this.isSearched.set(false);
    this.searchError.set(null);
    this.submittedUpdate.set(false);
    this.foundAgniveerData.set(null);
  }
}
