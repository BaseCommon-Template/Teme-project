LOGIN CHANGES README
=====================

Purpose
-------
This file documents the temporary login changes made for local/testing use.
These changes bypass website access checking, CAPTCHA, and the real login API.
Review and remove these changes before production deployment.

1. Website access API bypass
----------------------------
File:
  src/app/app.ts

Change:
  The checkWebsiteAccess() method no longer calls:
  PublicMenu/Public_CheckWebsiteAccess

Current behavior:
  hasWebsiteAccess is set to true directly.
  isCheckingWebsiteAccess is set to false directly.
  The Website Coming Soon page is bypassed.

To restore later:
  Restore the original router URL check and the
  publicMenuService.checkWebsiteAccess().subscribe(...) block.
  The original logic should set access based on response.code === 1
  and show the Coming Soon page on API failure or denied access.

2. CAPTCHA disabled
--------------------
Files:
  src/app/pages/auth/user-login/user-login.ts
  src/app/pages/auth/user-login/user-login.html

Changes:
  - Initial CAPTCHA generation is disabled.
  - CAPTCHA UI was removed from the login form.
  - CAPTCHA required validation was removed.
  - key and captcha were removed from the login payload.
  - generateCaptcha() was changed to a no-op that only clears captchaInput.
  - CAPTCHA API calls are therefore not made by the login page.

To restore later:
  - Restore the CAPTCHA block in user-login.html.
  - Restore the CAPTCHA required validation in onSubmit().
  - Restore key and captcha in loginPayload.
  - Restore the original generateCaptcha() implementation.
  - Restore the generateCaptcha() call in ngOnInit().

3. Direct login bypass
----------------------
File:
  src/app/pages/auth/user-login/user-login.ts

Current behavior:
  After basic User ID and Password validation, onSubmit() calls
  handleDirectLoginBypass() and returns before Users/login is called.
  The real login API is not reached.

The bypass creates a local session with:
  - token: local-development-token
  - user: demo@exploer.com
  - role ID: 13
  - role name: Admin

Then it redirects to:
  /dashboard

Important:
  The current bypass is unconditional after basic validation.
  Any non-empty User ID and password of at least 6 characters can enter
  the local dashboard. This is temporary and must not be deployed to production.

To restore later:
  - Remove the temporary handleDirectLoginBypass() call and return.
  - Restore the loginAPI() request flow in onSubmit().
  - Keep the response decrypt and handleSuccessResponse() logic.
  - Keep the original error and active-session handling if required.
  - The handleDirectLoginBypass() method can then be deleted.

4. Credential information used during testing
----------------------------------------------
Email/User ID:
  demo@exploer.com

Password:
  admin@321

These credentials are for temporary testing only. Do not hardcode real
credentials or commit production passwords into the source repository.

5. Validation and run notes
----------------------------
TypeScript validation used:
  npx tsc -p tsconfig.app.json --noEmit

The TypeScript check completed successfully after the changes.

The Angular dev server did not start because the installed Node.js version
was v24.14.0, while the Angular CLI requires v24.15.0 or newer, or a
compatible v22 version.

After updating Node.js:
  1. Run npm start.
  2. Hard refresh the browser.
  3. Clear old cookies if an old login session remains.
  4. Test the login and dashboard redirect.

Production safety checklist
---------------------------
Before production deployment:
  - Restore the website access API check.
  - Restore CAPTCHA UI, validation, and payload fields.
  - Remove handleDirectLoginBypass().
  - Restore the real Users/login API flow.
  - Remove local-development-token behavior.
  - Remove or archive this temporary change document if it contains
    sensitive project details.
