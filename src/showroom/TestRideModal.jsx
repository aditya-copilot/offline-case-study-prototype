import { useState } from 'react'
import './TestRideModal.css'

export default function TestRideModal({ bike, showroom, onClose }) {
  const [selectedDate, setSelectedDate] = useState('today')
  const [selectedTime, setSelectedTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState(1)
  const [isBooked, setIsBooked] = useState(false)

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ]

  const handleBook = () => {
    if (name && phone && selectedTime) {
      setIsBooked(true)
      // In real app, this would send notification to showroom staff
    }
  }

  const formatDate = () => {
    const today = new Date()
    if (selectedDate === 'today') return 'Today'
    if (selectedDate === 'tomorrow') return 'Tomorrow'
    const weekend = new Date(today)
    weekend.setDate(today.getDate() + (6 - today.getDay() + 7) % 7 + 1)
    return weekend.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  if (isBooked) {
    return (
      <div className="testride-overlay" onClick={onClose}>
        <div className="testride-modal success" onClick={e => e.stopPropagation()}>
          <div className="testride-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>Booking Confirmed!</h2>
          <p>Your test ride for {bike?.name} has been scheduled.</p>
          <div className="testride-details">
            <div className="testride-detail-item">
              <span>Date</span>
              <strong>{formatDate()}</strong>
            </div>
            <div className="testride-detail-item">
              <span>Time</span>
              <strong>{selectedTime}</strong>
            </div>
            <div className="testride-detail-item">
              <span>Showroom</span>
              <strong>{showroom?.name}</strong>
            </div>
          </div>
          <p className="testride-notify">Showroom staff has been notified. Please arrive 10 minutes early.</p>
          <button className="testride-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="testride-overlay" onClick={onClose}>
      <div className="testride-modal" onClick={e => e.stopPropagation()}>
        <div className="testride-header">
          <h2>Book Test Ride</h2>
          <button className="testride-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="testride-bike">
          <h3>{bike?.name}</h3>
          <p>{showroom?.name}</p>
        </div>

        {step === 1 ? (
          <>
            {/* Date Selection */}
            <div className="testride-section">
              <label>Select Date</label>
              <div className="testride-dates">
                <button
                  className={`testride-date-btn ${selectedDate === 'today' ? 'active' : ''}`}
                  onClick={() => setSelectedDate('today')}
                >
                  <span className="testride-day">Today</span>
                  <span className="testride-slots">8 slots available</span>
                </button>
                <button
                  className={`testride-date-btn ${selectedDate === 'tomorrow' ? 'active' : ''}`}
                  onClick={() => setSelectedDate('tomorrow')}
                >
                  <span className="testride-day">Tomorrow</span>
                  <span className="testride-slots">8 slots available</span>
                </button>
                <button
                  className={`testride-date-btn ${selectedDate === 'weekend' ? 'active' : ''}`}
                  onClick={() => setSelectedDate('weekend')}
                >
                  <span className="testride-day">Weekend</span>
                  <span className="testride-slots">8 slots available</span>
                </button>
              </div>
            </div>

            {/* Time Selection */}
            <div className="testride-section">
              <label>Select Time Slot</label>
              <div className="testride-times">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    className={`testride-time-btn ${selectedTime === time ? 'active' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="testride-next-btn"
              disabled={!selectedTime}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            {/* Personal Details */}
            <div className="testride-section">
              <label>Your Details</label>
              <div className="testride-form">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="testride-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="testride-input"
                  maxLength="10"
                />
              </div>
            </div>

            <div className="testride-summary">
              <p><strong>Date:</strong> {formatDate()}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
            </div>

            <div className="testride-buttons">
              <button className="testride-back-btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button 
                className="testride-book-btn"
                disabled={!name || !phone}
                onClick={handleBook}
              >
                Confirm Booking
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
