"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/portal.module.css";

const GuestListModal = ({ isOpen, onClose, guests, category, subeventTitle, onSendEmail }) => {
  const modalRef = useRef(null);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSendEmailClick = () => {
    if (onSendEmail) {
      onSendEmail(category, subeventTitle, guests);
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'attending':
        return '#10b981';
      case 'not_attending':
        return '#ef4444';
      case 'maybe':
        return '#f59e0b';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'attending':
        return 'Attending';
      case 'not_attending':
        return 'Not Attending';
      case 'maybe':
        return 'Maybe';
      case 'pending':
        return 'No Response';
      default:
        return 'Guests';
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'attending':
        return '✅';
      case 'not_attending':
        return '❌';
      case 'maybe':
        return '❓';
      case 'pending':
        return '⏳';
      default:
        return '👥';
    }
  };

  const formatGuestInfo = (guest) => {
    const parts = [];
    if (guest.email) parts.push(guest.email);
    if (guest.phone) parts.push(guest.phone);
    if (guest.tag) parts.push(`Side: ${guest.tag}`);
    return parts.join(' • ');
  };

  const getGuestResponse = (guest) => {
    if (!guest.rsvp_status || !subeventTitle) return null;
    const rsvp = guest.rsvp_status[subeventTitle];
    if (!rsvp) return null;
    
    const response = parseInt(rsvp.response) || 0;
    if (response > 1) {
      return `+${response - 1}`;
    }
    return null;
  };

  return (
    <div className={styles.guestFormOverlay} onClick={handleBackdropClick}>
      <div 
        className={styles.guestFormModal}
        ref={modalRef}
        style={{ maxWidth: '800px', maxHeight: '80vh' }}
      >
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{getCategoryIcon()}</span>
            <div>
              <h3 className={styles.modalTitle}>
                {getCategoryLabel()} ({guests.length})
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#6b7280',
                fontWeight: 'normal'
              }}>
                {subeventTitle}
              </p>
            </div>
          </div>
          <button className={styles.closeModal} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalContent} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {guests.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6b7280' 
            }}>
              No guests in this category
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = getCategoryColor();
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '16px', 
                          fontWeight: 600, 
                          color: '#111827' 
                        }}>
                          {guest.name}
                        </h4>
                        {guest.point_of_contact && (
                          <span style={{
                            background: '#7c3aed',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            POC
                          </span>
                        )}
                        {getGuestResponse(guest) && (
                          <span style={{
                            background: getCategoryColor(),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {getGuestResponse(guest)}
                          </span>
                        )}
                      </div>
                      
                      {formatGuestInfo(guest) && (
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          {formatGuestInfo(guest)}
                        </p>
                      )}

                      {/* Demographics */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        fontSize: '12px', 
                        color: '#9ca3af' 
                      }}>
                        {guest.gender && (
                          <span>
                            {guest.gender === 'male' ? '♂️' : guest.gender === 'female' ? '♀️' : '⚧️'} 
                            {guest.gender.charAt(0).toUpperCase() + guest.gender.slice(1)}
                          </span>
                        )}
                        {guest.ageGroup && (
                          <span>
                            🎂 {guest.ageGroup.charAt(0).toUpperCase() + guest.ageGroup.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      background: getCategoryColor(), 
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                      textAlign: 'center',
                      minWidth: '80px'
                    }}>
                      {getCategoryLabel()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {onSendEmail && guests.length > 0 && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSendEmailClick}
              style={{ 
                background: getCategoryColor(),
                borderColor: getCategoryColor(),
                marginRight: 'auto'
              }}
            >
              📧 Go to Email ({guests.length} {getCategoryLabel()})
            </button>
          )}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
            style={{ marginLeft: onSendEmail && guests.length > 0 ? '16px' : 'auto' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestListModal;
