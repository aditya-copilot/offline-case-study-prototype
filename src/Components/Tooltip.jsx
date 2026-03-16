import { useState, useRef, useEffect } from 'react'
import './Tooltip.css'

export function Tooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 300,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef(null)
  const targetRef = useRef(null)
  const timerRef = useRef(null)

  const showTooltip = () => {
    timerRef.current = setTimeout(() => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect()
        let x = 0
        let y = 0

        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2
            y = rect.top - 8
            break
          case 'bottom':
            x = rect.left + rect.width / 2
            y = rect.bottom + 8
            break
          case 'left':
            x = rect.left - 8
            y = rect.top + rect.height / 2
            break
          case 'right':
            x = rect.right + 8
            y = rect.top + rect.height / 2
            break
        }

        setCoords({ x, y })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <>
      <span
        ref={targetRef}
        className={`tooltip-target ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position}`}
          style={{
            left: coords.x,
            top: coords.y
          }}
        >
          {content}
        </div>
      )}
    </>
  )
}

export function HelpTooltip({ title, description, learnMoreLink }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="help-tooltip-container">
      <button 
        className="help-tooltip-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Help"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {isOpen && (
        <div className="help-tooltip-popup">
          <div className="help-tooltip-header">
            <h4>{title}</h4>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <p>{description}</p>
          {learnMoreLink && (
            <a href={learnMoreLink} target="_blank" rel="noopener noreferrer">
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
