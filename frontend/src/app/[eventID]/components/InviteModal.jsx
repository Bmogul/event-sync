'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import RoleSelector from './RoleSelector';
import useEventPermissions from '../../hooks/useEventPermissions';
import { toast } from 'react-toastify';
import styles from './InviteModal.module.css';

const InviteModal = ({ eventPublicId, eventDatabaseId, onClose, onInviteSent }) => {
  const { supabase, userProfile } = useAuth();
  const { userRole } = useEventPermissions(eventPublicId);
  
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [emailError, setEmailError] = useState('');

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      if (!supabase) return;

      try {
        const { data: roles, error } = await supabase
          .from('event_manage_roles')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          throw error;
        }

        // Filter roles based on current user's permissions
        let allowedRoles = roles || [];
        
        if (userRole === 'admin') {
          // Admin can only invite editor/viewer roles
          allowedRoles = roles.filter(role => ['editor', 'viewer'].includes(role.role_name));
        } else if (userRole !== 'owner') {
          // Other roles cannot invite anyone (this shouldn't happen due to UI permissions)
          allowedRoles = [];
        }

        setAvailableRoles(allowedRoles);
        
        // Set default role to the first available role
        if (allowedRoles.length > 0) {
          setSelectedRoleId(allowedRoles[0].id);
        }

      } catch (err) {
        console.error('Error fetching roles:', err);
        toast.error('Failed to load available roles');
      }
    };

    fetchRoles();
  }, [supabase, userRole]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!selectedRoleId) {
      toast.error('Please select a role');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user exists in the system (must be signed up already)
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!existingUser) {
        toast.error('User must sign up for Event-Sync first before being invited to collaborate');
        return;
      }

      const userId = existingUser.id;
        
      // Check if they're already a collaborator
      const { data: existingCollaborator, error: collaboratorCheckError } = await supabase
        .from('event_managers')
        .select('user_id')
        .eq('user_id', userId)
        .eq('event_id', eventDatabaseId)
        .maybeSingle();

      if (collaboratorCheckError) {
        throw collaboratorCheckError;
      }

      if (existingCollaborator) {
        toast.error('This user is already a collaborator on this event');
        return;
      }

      // Get the status ID for 'invited' status
      const { data: invitedStatus, error: statusError } = await supabase
        .from('event_manage_state_lookup')
        .select('id')
        .eq('state', 'pending').single()

      if (statusError) {
        throw statusError;
      }


      // Create the collaboration record
      const { data: collaboration, error: collaborationError } = await supabase
        .from('event_managers')
        .insert([{
          user_id: userId,
          event_id: eventDatabaseId,
          role_id: selectedRoleId,
          status_id: invitedStatus.id,
          invited_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (collaborationError) {
        throw collaborationError;
      }

      // Send invitation email via API
      try {
        const response = await fetch(`/api/${eventPublicId}/collaborators/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            roleId: selectedRoleId,
            userId: userId,
            eventDatabaseId: eventDatabaseId
          }),
        });

        if (!response.ok) {
          console.warn('Failed to send invitation email, but collaboration was created');
          toast.warning('Collaboration created but invitation email failed to send');
        } else {
          toast.success('Invitation sent successfully');
        }
      } catch (emailError) {
        console.warn('Error sending invitation email:', emailError);
        toast.warning('Collaboration created but invitation email failed to send');
      }

      onInviteSent(collaboration);

    } catch (err) {
      console.error('Error sending invitation:', err);
      
      if (err.message?.includes('duplicate') || err.code === '23505') {
        toast.error('This user is already a collaborator on this event');
      } else {
        toast.error('Failed to send invitation. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Invite Team Member</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className={`${styles.input} ${emailError ? styles.inputError : ''}`}
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter email address"
              disabled={isSubmitting}
              required
            />
            {emailError && (
              <span className={styles.errorMessage}>{emailError}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role" className={styles.label}>
              Role
            </label>
            <div className={styles.roleSelector}>
              <RoleSelector
                currentRoleId={selectedRoleId}
                currentUserRole={userRole}
                onRoleChange={setSelectedRoleId}
                availableRoles={availableRoles}
                disabled={isSubmitting}
                showDescription={true}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !email || emailError || !selectedRoleId}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>

        {isSubmitting && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModal;
