// Configuration
const CONFIG = {
    APP_URL: 'https://www.anphabe.com/aapi-lead/v2',
    CRM_API_URL: 'http://localhost:8080/api/public/leads/submit',
    CRM_API_KEY: 'lpk_0b3ebdae8414234fae840c4be204a8028bfffe71367d341b964cb24b1e5bac3a', // TODO: Set your API key here (lpk_xxx)
    MAUTIC_TIMEOUT: 5000,
    GTM_TIMEOUT: 2000
};

// https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation
// https://getbootstrap.com/docs/5.0/forms/validation/

/**
 * Toggle visibility of "other" input based on select value
 */
function show_other(select_id, otherbox_id) {
    const selectElement = document.getElementById(select_id);
    const otherboxElement = document.getElementById(otherbox_id);
    
    if (!selectElement || !otherboxElement) return;
    
    otherboxElement.style.display = selectElement.value === 'other' ? 'block' : 'none';
}

// Hide allow_contact_me element immediately
const allowContactMe = document.getElementById('allow_contact_me');
if (allowContactMe) {
    allowContactMe.style.display = 'none';
}

let checkboxesExpanded = false;

/**
 * Toggle checkboxes dropdown visibility
 */
function showCheckboxes() {
    const checkboxes = document.getElementById('checkboxes');
    if (!checkboxes) return;
    
    checkboxes.style.display = checkboxesExpanded ? 'none' : 'block';
    checkboxesExpanded = !checkboxesExpanded;
}

/**
 * Remove white label next to copyright
 */
function removeWhiteLabel() {
    const copyright = document.getElementById('copyright');
    copyright?.nextElementSibling?.remove();
}

/**
 * Poll for Mautic form submission completion
 */
function mautic_form_submit_finished(startTime) {
    if (document.querySelector('.mauticform-post-success') || Date.now() - startTime > CONFIG.MAUTIC_TIMEOUT) {
        form_redirect();
        return;
    }
    
    setTimeout(() => mautic_form_submit_finished(startTime), 100);
}

/**
 * Populate and submit Mautic form
 */
function mautic_form_submit(formData) {
    const mauticForm = document.querySelector('.mauticform_wrapper form');
    if (!mauticForm) return false;
    
    // Populate Mautic form fields
    for (const [key, value] of formData) {
        const input = mauticForm.querySelector(`[name='mauticform[${key}]']`);
        if (input) input.value = value;
    }
    
    // Trigger submit
    mauticForm.querySelector('[type="submit"]')?.click();
    
    // Start polling for completion
    setTimeout(() => mautic_form_submit_finished(Date.now()), 100);
    return true;
}

/**
 * Redirect to destination or thankyou page
 * TEMPORARILY DISABLED FOR DEBUGGING
 */
function form_redirect() {
    const destination = document.getElementById('destination');
    const redirectUrl = destination?.href || 'thankyou.html';
    
    // DEBUG: Log instead of redirect
    console.log('🔍 [DEBUG] Would redirect to:', redirectUrl);
    console.log('🔍 [DEBUG] Redirect DISABLED for debugging');
    
    // Uncomment below to enable redirect:
    // window.location.href = redirectUrl;
}

/**
 * Submit lead to CRM API v4
 * 
 * IMPORTANT: This sends TRANSFORMED data to the NEW CRM API
 * - Converts form field names to CRM schema (e.g., 'companyname' → 'companyName')
 * - Normalizes company size text to enum values
 * - Sends as JSON with X-API-Key header
 * - Runs INDEPENDENTLY from old API submission
 */
function crm_api_submit(formData) {
    console.log('📤 [CRM API] Starting submission...');
    
    if (!CONFIG.CRM_API_KEY) {
        console.warn('⚠️ [CRM API] API key not configured');
        return;
    }

    try {
        // Build transformed payload for NEW CRM API (different format than old API)
        const payload = buildCrmPayload(formData);
        console.log('📦 [CRM API] Payload:', JSON.stringify(payload, null, 2));
        
        fetch(CONFIG.CRM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': CONFIG.CRM_API_KEY
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            console.log('📥 [CRM API] Response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ [CRM API] Success:', data);
        })
        .catch(err => {
            console.error('❌ [CRM API] Error:', err);
        });
    } catch (e) {
        console.error('💥 [CRM API] Submit failed:', e);
    }
}

/**
 * Build CRM API payload from form data
 * 
 * IMPORTANT: This creates a DIFFERENT format than what's sent to the old API!
 * 
 * OLD API receives: Raw FormData with original field names
 *   - companyname, position, company-size, nhucautuvan, etc.
 * 
 * NEW CRM API receives: Transformed JSON with mapped field names
 *   - companyName, jobTitle, companySize (enum), needs, etc.
 */
function buildCrmPayload(formData) {
    console.log('🔧 [Payload Builder] Processing form data for NEW CRM API...');
    
    const getField = (names) => {
        for (const name of names) {
            const value = formData.get(name);
            if (value) {
                console.log(`  ✓ Found '${name}':`, value);
                return value;
            }
        }
        console.log(`  ✗ Not found: [${names.join(', ')}]`);
        return '';
    };
    
    const companySizeRaw = formData.get('company-size');
    console.log('📏 [Company Size] Raw value:', companySizeRaw);
    
    // Map form fields to NEW CRM API schema
    const payload = {
        fullName: getField(['fullname']),                    // fullname → fullName
        email: getField(['email']),                          // email → email (same)
        companyName: getField(['companyname', 'company_name', 'organization']),  // companyname → companyName
        phone: getField(['phone']),                          // phone → phone (same)
        jobTitle: getField(['position', 'job_title']),       // position → jobTitle
        companySize: normalizeCompanySize(companySizeRaw),   // "Từ 500 - 800" → FROM_500_800
        interestedProducts: getField(['product_name']),      // product_name → interestedProducts
        needs: getField(['nhucautuvan', 'needs', 'requirement']),  // nhucautuvan → needs
        needDetail: getField(['nhucautuvan-detail', 'need_detail']), // nhucautuvan-detail → needDetail
        hiringCount: undefined,                              // Not in this form
        landingPageUrl: getField(['landingpage', 'landing_page_url']), // landingpage → landingPageUrl
        utmSource: getField(['utm_source']),                 // utm_source → utmSource
        utmMedium: getField(['utm_medium']),                 // utm_medium → utmMedium
        utmCampaign: getField(['utm_campaign']),             // utm_campaign → utmCampaign
        utmTerm: getField(['utm_term']),                     // utm_term → utmTerm
        utmContent: getField(['utm_content']),               // utm_content → utmContent
        allowContact: true                                   // Always true
    };
    
    console.log('📊 [Payload] Before filtering:', payload);
    
    // Remove empty/undefined values
    const filtered = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    
    console.log('📊 [Payload] After filtering:', filtered);
    console.log('📊 [Payload] Field count:', Object.keys(filtered).length);
    
    return filtered;
}

/**
 * Normalize company size text to CRM enum values
 */
function normalizeCompanySize(sizeText) {
    if (!sizeText) {
        console.log('⚠️ [Company Size] No value provided');
        return undefined;
    }
    
    // Strip thousands-separator dots (Vietnamese: "1.000" → "1000") before matching
    const text = sizeText.toLowerCase().trim().replace(/\./g, '');
    console.log('🔍 [Company Size] Normalizing:', `"${sizeText}"`);
    
    // Size range mappings
    const sizeMappings = [
        { pattern: [/dưới 200/, /under 200/, /<200/], value: 'UNDER_200' },
        { pattern: [/200.*500/, /200-500/], value: 'FROM_200_500' },
        { pattern: [/500.*800/, /500-800/], value: 'FROM_500_800' },
        { pattern: [/800.*1000/, /800-1000/], value: 'FROM_800_1000' },
        { pattern: [/1000.*2500/, /1000-2500/], value: 'FROM_1000_2500' },
        { pattern: [/2500.*5000/, /2500-5000/], value: 'FROM_2500_5000' },
        { pattern: [/trên 5000/, /over 5000/, />5000/], value: 'OVER_5000' }
    ];
    
    for (const { pattern, value } of sizeMappings) {
        if (pattern.some(regex => regex.test(text))) {
            console.log(`✅ [Company Size] Matched: ${value}`);
            return value;
        }
    }
    
    console.log('❌ [Company Size] No match found, returning undefined');
    return undefined;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const startTime = Date.now();

    /**
     * Auto-populate UTM parameters from URL
     */
    function updateUtmInput() {
        const searchParams = new URLSearchParams(window.location.search);
        
        // Set UTM fields
        ['utm_campaign', 'utm_source', 'utm_medium', 'utm_term', 'utm_content'].forEach(field => {
            const value = searchParams.get(field);
            if (value) {
                const input = document.querySelector(`[name="${field}"]`);
                if (input) input.value = value;
            }
        });
        
        // Set landing page
        const landingPageInput = document.querySelector('[name="landingpage"]');
        if (landingPageInput) {
            landingPageInput.value = window.location.origin + window.location.pathname;
        }
    }

    /**
     * Toggle submit button state
     */
    function setSubmitState(form, disabled) {
        form.querySelectorAll('[type="submit"]').forEach(btn => {
            btn.classList.toggle('disabled', disabled);
            btn.disabled = disabled;
        });
    }

    /**
     * Build GTM tracking object
     */
    function buildTrackingObject(formData) {
        return {
            event: 'contact_form_submit',
            'ContactForm.landingpage': formData.get('landingpage'),
            'ContactForm.product_name': formData.get('product_name'),
            'ContactForm.fullname': formData.get('fullname'),
            'ContactForm.email': formData.get('email'),
            'ContactForm.phone': formData.get('phone')
        };
    }

    /**
     * Handle successful API response
     */
    function handleSuccess(form, formData, trackingObj) {
        console.log('✅ [Old API] Submission successful');
        
        const onGtmSuccess = () => {
            console.log('🎯 [GTM] Callback triggered');
            if (document.querySelector('.mauticform_wrapper form')) {
                console.log('📧 [Mautic] Submitting to Mautic...');
                mautic_form_submit(formData);
            } else {
                console.log('🔄 [Redirect] No Mautic form, would redirect');
                form_redirect();
            }
        };

        trackingObj.eventCallback = onGtmSuccess;
        trackingObj.eventTimeout = CONFIG.GTM_TIMEOUT;

        console.log('📊 [GTM] Tracking object:', trackingObj);
        
        // Push to Google Tag Manager
        if (window.dataLayer) {
            window.dataLayer.push(trackingObj);
            console.log('✅ [GTM] Pushed to dataLayer');
        } else {
            console.warn('⚠️ [GTM] dataLayer not found');
        }

        // CRM API already submitted independently at form submit time
    }

    /**
     * Handle API error
     */
    function handleError(form, error) {
        console.error('❌ [Old API] Error occurred:', error);
        // Show inline error instead of blocking alert
        let errEl = form.querySelector('.form-error-msg');
        if (!errEl) {
            errEl = document.createElement('div');
            errEl.className = 'form-error-msg';
            errEl.style.cssText = 'color:#c0392b;margin:8px 0;font-size:14px;';
            form.appendChild(errEl);
        }
        errEl.textContent = 'Đã có lỗi xảy ra, vui lòng thử lại!';
        setSubmitState(form, false);
    }

    /**
     * Setup form submission handler
     */
    function setupFormHandler(form) {
        console.log('🔧 [Form Handler] Setting up form:', form);
        
        form.addEventListener('submit', async (e) => {
            console.log('📝 [Form] Submit event triggered');
            e.preventDefault();

            if (!form.checkValidity()) {
                console.warn('⚠️ [Validation] Form is invalid');
                e.stopPropagation();
            } else {
                console.log('✅ [Validation] Form is valid');
                
                // Disable submit buttons
                setSubmitState(form, true);
                console.log('🔒 [UI] Submit buttons disabled');

                // Prepare form data
                const formData = new FormData(form);
                const duration = Math.round((Date.now() - startTime) / 1000);
                formData.append('duration', duration);
                
                console.log('⏱️ [Duration]:', duration, 'seconds');
                console.log('📋 [FormData] All fields:');
                for (const [key, value] of formData) {
                    console.log(`   ${key}:`, value);
                }

                // Build tracking object
                const trackingObj = buildTrackingObject(formData);
                console.log('📊 [Tracking]', trackingObj);

                // ============================================================
                // SUBMIT TO BOTH APIs (INDEPENDENT OF EACH OTHER)
                // ============================================================
                
                // 1️⃣ Submit to NEW CRM API (with field mapping/transformation)
                //    - Uses buildCrmPayload() to transform field names
                //    - Sends JSON with X-API-Key header
                //    - Non-blocking (fire-and-forget)
                console.log('🚀 [CRM API v4] Submitting transformed payload...');
                crm_api_submit(formData);

                // 2️⃣ Submit to OLD API (raw FormData, no transformation)
                //    - Sends original form field names as-is
                //    - multipart/form-data format
                //    - Controls redirect/Mautic flow on success
                console.log('🚀 [Old API] Submitting raw FormData to:', CONFIG.APP_URL);
                fetch(CONFIG.APP_URL, {
                    method: 'POST',
                    body: formData
                })
                .then(res => {
                    console.log('📥 [Old API] Response status:', res.status);
                    return res.json();
                })
                .then(data => {
                    console.log('📦 [Old API] Response data:', data);
                    if (data.response) {
                        handleSuccess(form, formData, trackingObj);
                    } else {
                        handleError(form, new Error('Invalid response'));
                    }
                })
                .catch(error => handleError(form, error));
            }
            
            form.classList.add('was-validated');
            return false;
        });
    }

    // Initialize
    updateUtmInput();
    removeWhiteLabel();
    
    // Setup all lead forms
    document.querySelectorAll('.mbr-form.anphabe-lead').forEach(setupFormHandler);
});
