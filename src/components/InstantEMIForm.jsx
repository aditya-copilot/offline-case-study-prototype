import { useState } from 'react'
import './InstantEMIForm.css'

const JusPayLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.2)" />
    <path d="M8 10h6v8a3 3 0 01-6 0v-1h2v1a1 1 0 002 0v-6H8v-2z" fill="white" />
    <path d="M17 10h7l-4 6h4v2h-7l4-6h-4v-2z" fill="white" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const CardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

function validatePAN(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

function validateDOB(dob) {
  if (!dob) return false
  const today = new Date()
  const birth = new Date(dob)
  const age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  const actualAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age
  return actualAge >= 18 && actualAge <= 75
}

export default function InstantEMIForm() {
  const [form, setForm] = useState({
    name: '',
    pan: '',
    dob: '',
    address: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = (fields = form) => {
    const e = {}
    if (!fields.name.trim()) e.name = 'Full name is required'
    else if (fields.name.trim().length < 3) e.name = 'Enter a valid full name'

    if (!fields.pan) e.pan = 'PAN number is required'
    else if (!validatePAN(fields.pan.toUpperCase())) e.pan = 'Enter a valid PAN (e.g. ABCDE1234F)'

    if (!fields.dob) e.dob = 'Date of birth is required'
    else if (!validateDOB(fields.dob)) e.dob = 'Age must be between 18 and 75 years'

    if (!fields.address.trim()) e.address = 'Address is required'
    else if (fields.address.trim().length < 10) e.address = 'Please enter a complete address'

    if (!fields.phone) e.phone = 'Phone number is required'
    else if (!validatePhone(fields.phone)) e.phone = 'Enter a valid 10-digit mobile number'

    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = {
      ...form,
      [name]: name === 'pan' ? value.toUpperCase() : value,
    }
    setForm(updated)
    if (touched[name]) {
      const errs = validate(updated)
      setErrors(prev => ({ ...prev, [name]: errs[name] }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const errs = validate()
    setErrors(prev => ({ ...prev, [name]: errs[name] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allTouched = { name: true, pan: true, dob: true, address: true, phone: true }
    setTouched(allTouched)
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    // Simulate JusPay API call
    await new Promise(r => setTimeout(r, 1800))
    setLoading(false)
    setSubmitted(true)
  }

  const maxDOB = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split('T')[0]
  })()

  const minDOB = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 75)
    return d.toISOString().split('T')[0]
  })()

  if (submitted) {
    return (
      <div className="emi-page">
        <header className="emi-header">
          <div className="emi-header-inner">
            <div className="emi-brand">
              <JusPayLogo />
              <span>EMI</span>
            </div>
          </div>
        </header>
        <main className="emi-main">
          <div className="emi-success-card">
            <div className="emi-success-icon">
              <CheckIcon />
            </div>
            <h2>Application Submitted!</h2>
            <p className="emi-success-sub">
              Your instant EMI request has been received. We'll verify your details and send an OTP to <strong>+91 {form.phone}</strong> shortly.
            </p>
            <div className="emi-success-details">
              <div className="emi-detail-row">
                <span>Name</span>
                <strong>{form.name}</strong>
              </div>
              <div className="emi-detail-row">
                <span>PAN</span>
                <strong>{form.pan}</strong>
              </div>
              <div className="emi-detail-row">
                <span>Mobile</span>
                <strong>+91 {form.phone}</strong>
              </div>
            </div>
            <button className="emi-btn-secondary" onClick={() => { setSubmitted(false); setForm({ name: '', pan: '', dob: '', address: '', phone: '' }); setTouched({}); setErrors({}) }}>
              Start New Application
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="emi-page">
      <header className="emi-header">
        <div className="emi-header-inner">
          <div className="emi-brand">
            <JusPayLogo />
            <span>JusPay</span>
          </div>
          <div className="emi-secure-badge">
            <ShieldIcon />
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </header>

      <main className="emi-main">
        <div className="emi-hero">
          <div className="emi-hero-tag">Instant Approval</div>
          <h1 className="emi-hero-title">Apply for Instant EMI</h1>
          <p className="emi-hero-sub">Get approved in minutes. No paperwork, zero hassle.</p>
        </div>

        <div className="emi-layout">
          <form className="emi-form-card" onSubmit={handleSubmit} noValidate>
            <div className="emi-section-label">
              <UserIcon />
              Personal Details
            </div>

            {/* Name */}
            <div className={`emi-field ${touched.name && errors.name ? 'emi-field--error' : touched.name && !errors.name ? 'emi-field--valid' : ''}`}>
              <label htmlFor="name">Full Name</label>
              <div className="emi-input-wrap">
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="As per your Aadhaar / PAN card"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="name"
                />
              </div>
              {touched.name && errors.name && <span className="emi-error-msg">{errors.name}</span>}
            </div>

            {/* PAN */}
            <div className={`emi-field ${touched.pan && errors.pan ? 'emi-field--error' : touched.pan && !errors.pan ? 'emi-field--valid' : ''}`}>
              <label htmlFor="pan">
                PAN Number
                <span className="emi-label-hint">
                  <CardIcon /> Used for credit check
                </span>
              </label>
              <div className="emi-input-wrap">
                <input
                  id="pan"
                  name="pan"
                  type="text"
                  placeholder="ABCDE1234F"
                  value={form.pan}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  autoComplete="off"
                  style={{ letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '15px' }}
                />
              </div>
              {touched.pan && errors.pan && <span className="emi-error-msg">{errors.pan}</span>}
            </div>

            <div className="emi-row">
              {/* DOB */}
              <div className={`emi-field ${touched.dob && errors.dob ? 'emi-field--error' : touched.dob && !errors.dob ? 'emi-field--valid' : ''}`}>
                <label htmlFor="dob">
                  Date of Birth
                  <span className="emi-label-hint"><CalendarIcon /> Must be 18–75 yrs</span>
                </label>
                <div className="emi-input-wrap">
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    max={maxDOB}
                    min={minDOB}
                  />
                </div>
                {touched.dob && errors.dob && <span className="emi-error-msg">{errors.dob}</span>}
              </div>

              {/* Phone */}
              <div className={`emi-field ${touched.phone && errors.phone ? 'emi-field--error' : touched.phone && !errors.phone ? 'emi-field--valid' : ''}`}>
                <label htmlFor="phone">Mobile Number</label>
                <div className="emi-input-wrap emi-phone-wrap">
                  <span className="emi-phone-prefix">+91</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
                {touched.phone && errors.phone && <span className="emi-error-msg">{errors.phone}</span>}
              </div>
            </div>

            <div className="emi-section-label" style={{ marginTop: '8px' }}>
              <MapPinIcon />
              Address Details
            </div>

            {/* Address */}
            <div className={`emi-field ${touched.address && errors.address ? 'emi-field--error' : touched.address && !errors.address ? 'emi-field--valid' : ''}`}>
              <label htmlFor="address">Current Residential Address</label>
              <div className="emi-input-wrap">
                <textarea
                  id="address"
                  name="address"
                  placeholder="Flat/House no., Street, Locality, City, State, PIN code"
                  value={form.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={3}
                  autoComplete="street-address"
                />
              </div>
              {touched.address && errors.address && <span className="emi-error-msg">{errors.address}</span>}
            </div>

            <button type="submit" className="emi-submit-btn" disabled={loading}>
              {loading ? (
                <span className="emi-spinner-row">
                  <span className="emi-spinner" />
                  Verifying with JusPay...
                </span>
              ) : (
                <span className="emi-btn-row">
                  <LockIcon />
                  Apply for Instant EMI
                </span>
              )}
            </button>

            <p className="emi-consent">
              By submitting, you consent to JusPay fetching your credit information from credit bureaus for EMI eligibility. Your data is encrypted and never shared.
            </p>
          </form>

          <aside className="emi-sidebar">
            <div className="emi-info-card">
              <div className="emi-info-header">
                <span className="emi-info-icon">⚡</span>
                <span>Instant EMI Benefits</span>
              </div>
              <ul className="emi-benefits">
                <li>
                  <span className="emi-check-dot" />
                  Approval in under 2 minutes
                </li>
                <li>
                  <span className="emi-check-dot" />
                  Zero processing fee on select plans
                </li>
                <li>
                  <span className="emi-check-dot" />
                  Flexible 3–24 month tenures
                </li>
                <li>
                  <span className="emi-check-dot" />
                  Starting at 0% interest rate
                </li>
                <li>
                  <span className="emi-check-dot" />
                  No physical documentation
                </li>
              </ul>
            </div>

            <div className="emi-info-card emi-steps-card">
              <div className="emi-info-header">
                <span className="emi-info-icon">📋</span>
                <span>How it Works</span>
              </div>
              <ol className="emi-steps">
                <li>
                  <span className="emi-step-num">1</span>
                  <div>
                    <strong>Fill Details</strong>
                    <p>Enter your personal & identity info</p>
                  </div>
                </li>
                <li>
                  <span className="emi-step-num">2</span>
                  <div>
                    <strong>OTP Verification</strong>
                    <p>Verify your mobile number</p>
                  </div>
                </li>
                <li>
                  <span className="emi-step-num">3</span>
                  <div>
                    <strong>Get Approved</strong>
                    <p>Instant limit activated on your account</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="emi-trust-badges">
              <div className="emi-badge">
                <ShieldIcon />
                <span>RBI Regulated</span>
              </div>
              <div className="emi-badge">
                <LockIcon />
                <span>SSL Secured</span>
              </div>
              <div className="emi-badge">
                <span>🏦</span>
                <span>Bank Grade</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
