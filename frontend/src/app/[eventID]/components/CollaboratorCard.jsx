'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import RoleSelector from './RoleSelector';
import { toast } from 'react-toastify';
import styles from './CollaboratorCard.module.css';

const CollaboratorCard = ({ 
  collaborator, 
  eventPublicId, 
  eventDatabaseId,
  currentUserRole, 
  currentUserId,
  canManageCollaborators,
  hasPermission 
}) => {
  const { supabase } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Determine what actions the current user can perform on this collaborator
  const canChangeRole = () => {
    // Owner can change anyone's role except their own
    if (currentUserRole === 'owner' && !collaborator.isOwner) return true;
    
    // Admin can change editor/viewer roles but not owner/admin
    if (currentUserRole === 'admin' && 
        ['editor', 'viewer'].includes(collaborator.role.name)) return true;
    
    return false;
  };

  const canRemove = () => {
    // Can't remove the owner
    if (collaborator.isOwner) return false;
    
    // Can't remove yourself
    if (collaborator.userId === currentUserId) return false;
    
    // Owner can remove anyone
    if (currentUserRole === 'owner') return true;
    
    // Admin can remove editor/viewer
    if (currentUserRole === 'admin' && 
        ['editor', 'viewer'].includes(collaborator.role.name)) return true;
    
    return false;
  };

  const canResendInvite = () => {
    return canManageCollaborators && collaborator.status.state === 'invited';
  };

  const handleRoleChange = async (newRoleId) => {
    if (!canChangeRole()) {
      toast.error('You do not have permission to change this user\'s role');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('event_managers')
        .update({ 
          role_id: newRoleId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', collaborator.userId)
        .eq('event_id', eventDatabaseId);

      if (error) {
        throw error;
      }

      toast.success('Role updated successfully');
      setShowRoleSelector(false);
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!canRemove()) {
      toast.error('You do not have permission to remove this user');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${collaborator.user.fullName} from this event?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('event_managers')
        .delete()
        .eq('user_id', collaborator.userId)
        .eq('event_id', eventDatabaseId);

      if (error) {
        throw error;
      }

      toast.success('Team member removed successfully');
    } catch (err) {
      console.error('Error removing collaborator:', err);
      toast.error('Failed to remove team member');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendInvite = async () => {
    if (!canResendInvite()) {
      toast.error('Cannot resend invitation');
      return;
    }

    setIsUpdating(true);
    try {
      // Call API to resend invitation email
      const response = await fetch(`/api/${eventPublicId}/collaborators/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: collaborator.userId,
          email: collaborator.user.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      toast.success('Invitation resent successfully');
    } catch (err) {
      console.error('Error resending invite:', err);
      toast.error('Failed to resend invitation');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted':
        return styles.statusAccepted;
      case 'invited':
        return styles.statusInvited;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case 'owner':
        return styles.roleOwner;
      case 'admin':
        return styles.roleAdmin;
      case 'editor':
        return styles.roleEditor;
      case 'viewer':
        return styles.roleViewer;
      default:
        return styles.roleDefault;
    }
  };

  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`${styles.collaboratorCard} ${isUpdating ? styles.updating : ''}`}>
      <div className={styles.collaboratorInfo}>
        <div className={styles.avatar}>
          {getInitials(collaborator.user)}
        </div>
        
        <div className={styles.userDetails}>
          <div className={styles.userName}>
            {collaborator.user.fullName}
            {collaborator.userId === currentUserId && (
              <span className={styles.youLabel}>(You)</span>
            )}
            {collaborator.isOwner && (
              <span className={styles.ownerLabel}>(Owner)</span>
            )}
          </div>
          <div className={styles.userEmail}>{collaborator.user.email}</div>
          <div className={styles.metadata}>
            <span>Invited: {formatDate(collaborator.invitedAt)}</span>
            {collaborator.acceptedAt && (
              <span> • Joined: {formatDate(collaborator.acceptedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.badges}>
        <span className={`${styles.roleBadge} ${getRoleBadgeClass(collaborator.role.name)}`}>
          {collaborator.role.name.charAt(0).toUpperCase() + collaborator.role.name.slice(1)}
        </span>
        <span className={`${styles.statusBadge} ${getStatusBadgeClass(collaborator.status.state)}`}>
          {collaborator.status.state.charAt(0).toUpperCase() + collaborator.status.state.slice(1)}
        </span>
      </div>

      <div className={styles.actions}>
        {canChangeRole() && !showRoleSelector && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowRoleSelector(true)}
            disabled={isUpdating}
          >
            Change Role
          </Button>
        )}

        {canResendInvite() && (
          <Button
            variant="secondary"
            size="small"
            onClick={handleResendInvite}
            disabled={isUpdating}
          >
            Resend Invite
          </Button>
        )}

        {canRemove() && (
          <Button
            variant="secondary"
            size="small"
            onClick={handleRemove}
            disabled={isUpdating}
            className={styles.removeButton}
          >
            Remove
          </Button>
        )}
      </div>

      {showRoleSelector && (
        <div className={styles.roleSelector}>
          <RoleSelector
            currentRoleId={collaborator.role.id}
            currentUserRole={currentUserRole}
            onRoleChange={handleRoleChange}
            onCancel={() => setShowRoleSelector(false)}
            disabled={isUpdating}
          />
        </div>
      )}

      {isUpdating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
    </div>
  );
};

export default CollaboratorCard;