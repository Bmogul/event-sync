'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useEventPermissions from '../../hooks/useEventPermissions';
import Button from '../../../components/ui/Button';
import CollaboratorCard from './CollaboratorCard';
import InviteModal from './InviteModal';
import { toast } from 'react-toastify';
import styles from './ManageTeam.module.css';

const ManageTeam = ({ eventPublicId }) => {
  const { userProfile, supabase } = useAuth();
  const { hasPermission, canManageCollaborators, userRole } = useEventPermissions(eventPublicId);
  
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [eventData, setEventData] = useState(null);

  // Fetch event data and collaborators
  useEffect(() => {
    const fetchEventAndCollaborators = async () => {
      if (!eventPublicId || !supabase || !userProfile?.id) return;

      try {
        setLoading(true);
        setError(null);

        // First get the event data using public_id
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            id,
            public_id,
            title,
            created_by,
            users!events_created_by_fkey(
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('public_id', eventPublicId)
          .single();

        if (eventError) {
          throw eventError;
        }

        setEventData(eventData);
        const eventDatabaseId = eventData.id;

        // Then fetch all collaborators for this event
        const { data: collaboratorData, error: collaboratorError } = await supabase
          .from('event_managers')
          .select(`
            *,
            user:users(
              id,
              first_name,
              last_name,
              email,
              public_id
            ),
            role:event_manage_roles(
              id,
              role_name,
              description,
              display_order
            ),
            status:event_manage_state_lookup(
              id,
              state,
              description,
              display_order
            )
          `)
          .eq('event_id', eventDatabaseId)
          .order('created_at', { ascending: true });

        if (collaboratorError) {
          throw collaboratorError;
        }

        // Transform the data to match component expectations
        const transformedCollaborators = collaboratorData?.map(collab => ({
          id: `${collab.user_id}-${collab.event_id}`, // Composite key
          userId: collab.user_id,
          eventId: collab.event_id,
          user: {
            id: collab.user.id,
            publicId: collab.user.public_id,
            firstName: collab.user.first_name || '',
            lastName: collab.user.last_name || '',
            email: collab.user.email || '',
            fullName: `${collab.user.first_name || ''} ${collab.user.last_name || ''}`.trim() || collab.user.email || 'Unknown User'
          },
          role: {
            id: collab.role.id,
            name: collab.role.role_name,
            description: collab.role.description,
            displayOrder: collab.role.display_order
          },
          status: {
            id: collab.status.id,
            state: collab.status.state,
            description: collab.status.description,
            displayOrder: collab.status.display_order
          },
          invitedAt: collab.invited_at,
          acceptedAt: collab.accepted_at,
          createdAt: collab.created_at,
          updatedAt: collab.updated_at,
          isOwner: false // Will be set below
        })) || [];

        // Add the event owner as a special collaborator if not already in the list
        const ownerInCollaborators = transformedCollaborators.find(c => c.userId === eventData.created_by);
        if (!ownerInCollaborators && eventData.users) {
          const ownerCollaborator = {
            id: `owner-${eventData.created_by}-${eventData.id}`,
            userId: eventData.created_by,
            eventId: eventData.id,
            user: {
              id: eventData.users.id,
              publicId: eventData.users.public_id,
              firstName: eventData.users.first_name || '',
              lastName: eventData.users.last_name || '',
              email: eventData.users.email || '',
              fullName: `${eventData.users.first_name || ''} ${eventData.users.last_name || ''}`.trim() || eventData.users.email || 'Event Owner'
            },
            role: {
              id: 'owner',
              name: 'owner',
              description: 'Event Owner',
              displayOrder: 0
            },
            status: {
              id: 'accepted',
              state: 'accepted',
              description: 'Accepted',
              displayOrder: 2
            },
            invitedAt: eventData.created_at,
            acceptedAt: eventData.created_at,
            createdAt: eventData.created_at,
            updatedAt: eventData.updated_at,
            isOwner: true
          };
          transformedCollaborators.unshift(ownerCollaborator); // Add owner at the beginning
        } else if (ownerInCollaborators) {
          // Mark existing owner entry
          ownerInCollaborators.isOwner = true;
        }

        // Sort by role hierarchy (owner first, then by display order) and acceptance status
        const sortedCollaborators = transformedCollaborators.sort((a, b) => {
          // Owner always first
          if (a.isOwner && !b.isOwner) return -1;
          if (!a.isOwner && b.isOwner) return 1;
          
          // Then by role display order
          if (a.role.displayOrder !== b.role.displayOrder) {
            return a.role.displayOrder - b.role.displayOrder;
          }
          
          // Then by status (accepted before pending)
          if (a.status.state !== b.status.state) {
            if (a.status.state === 'accepted' && b.status.state !== 'accepted') return -1;
            if (a.status.state !== 'accepted' && b.status.state === 'accepted') return 1;
          }
          
          // Finally by creation date
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

        setCollaborators(sortedCollaborators);

      } catch (err) {
        console.error('Error fetching collaborators:', err);
        setError(err.message);
        toast.error('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndCollaborators();
  }, [eventPublicId, supabase, userProfile?.id]);

  // Set up real-time subscription for collaborator changes
  useEffect(() => {
    if (!supabase || !eventData?.id) return;

    console.log('Setting up real-time subscription for event_managers:', eventData.id);

    const collaboratorSubscription = supabase
      .channel('team_management_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_managers',
        filter: `event_id=eq.${eventData.id}`
      }, (payload) => {
        console.log('Real-time collaborator update:', payload);
        handleCollaboratorChange(payload);
      })
      .subscribe();

    return () => {
      console.log('Cleaning up team management subscription');
      collaboratorSubscription.unsubscribe();
    };
  }, [eventData?.id, supabase]);

  // Handle real-time collaborator changes
  const handleCollaboratorChange = async (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    try {
      // For any change, refetch the specific collaborator data to get complete info
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const { data: updatedCollaborator, error } = await supabase
          .from('event_managers')
          .select(`
            *,
            user:users(
              id,
              first_name,
              last_name,
              email,
              public_id
            ),
            role:event_manage_roles(
              id,
              role_name,
              description,
              display_order
            ),
            status:event_manage_state_lookup(
              id,
              state,
              description,
              display_order
            )
          `)
          .eq('user_id', newRecord.user_id)
          .eq('event_id', newRecord.event_id)
          .single();

        if (!error && updatedCollaborator) {
          const transformedCollaborator = {
            id: `${updatedCollaborator.user_id}-${updatedCollaborator.event_id}`,
            userId: updatedCollaborator.user_id,
            eventId: updatedCollaborator.event_id,
            user: {
              id: updatedCollaborator.user.id,
              publicId: updatedCollaborator.user.public_id,
              firstName: updatedCollaborator.user.first_name || '',
              lastName: updatedCollaborator.user.last_name || '',
              email: updatedCollaborator.user.email || '',
              fullName: `${updatedCollaborator.user.first_name || ''} ${updatedCollaborator.user.last_name || ''}`.trim() || updatedCollaborator.user.email || 'Unknown User'
            },
            role: {
              id: updatedCollaborator.role.id,
              name: updatedCollaborator.role.role_name,
              description: updatedCollaborator.role.description,
              displayOrder: updatedCollaborator.role.display_order
            },
            status: {
              id: updatedCollaborator.status.id,
              state: updatedCollaborator.status.state,
              description: updatedCollaborator.status.description,
              displayOrder: updatedCollaborator.status.display_order
            },
            invitedAt: updatedCollaborator.invited_at,
            acceptedAt: updatedCollaborator.accepted_at,
            createdAt: updatedCollaborator.created_at,
            updatedAt: updatedCollaborator.updated_at,
            isOwner: false
          };

          setCollaborators(prev => {
            const filtered = prev.filter(c => c.id !== transformedCollaborator.id);
            const updated = [...filtered, transformedCollaborator];
            
            return updated.sort((a, b) => {
              if (a.isOwner && !b.isOwner) return -1;
              if (!a.isOwner && b.isOwner) return 1;
              if (a.role.displayOrder !== b.role.displayOrder) {
                return a.role.displayOrder - b.role.displayOrder;
              }
              if (a.status.state !== b.status.state) {
                if (a.status.state === 'accepted' && b.status.state !== 'accepted') return -1;
                if (a.status.state !== 'accepted' && b.status.state === 'accepted') return 1;
              }
              return new Date(a.createdAt) - new Date(b.createdAt);
            });
          });

          if (eventType === 'INSERT') {
            toast.success('New team member added');
          } else {
            toast.info('Team member updated');
          }
        }
      } else if (eventType === 'DELETE') {
        const collaboratorId = `${oldRecord.user_id}-${oldRecord.event_id}`;
        setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
        toast.info('Team member removed');
      }
    } catch (err) {
      console.error('Error handling real-time collaborator change:', err);
    }
  };

  const handleInviteSent = (newCollaborator) => {
    // The real-time subscription will handle the update
    setShowInviteModal(false);
    toast.success('Invitation sent successfully');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading team members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.manageTeamContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Team Management</h2>
          <p className={styles.subtitle}>
            Manage collaborators and their permissions for "{eventData?.title}"
          </p>
        </div>
        {canManageCollaborators && (
          <Button 
            onClick={() => setShowInviteModal(true)}
            className={styles.inviteButton}
          >
            Invite Team Member
          </Button>
        )}
      </div>

      {collaborators.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No team members found.</p>
          {canManageCollaborators && (
            <Button onClick={() => setShowInviteModal(true)}>
              Invite Your First Team Member
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.collaboratorsList}>
          {collaborators.map((collaborator) => (
            <CollaboratorCard
              key={collaborator.id}
              collaborator={collaborator}
              eventPublicId={eventPublicId}
              eventDatabaseId={eventData?.id}
              currentUserRole={userRole}
              currentUserId={userProfile?.id}
              canManageCollaborators={canManageCollaborators}
              hasPermission={hasPermission}
            />
          ))}
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          eventPublicId={eventPublicId}
          eventDatabaseId={eventData?.id}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={handleInviteSent}
        />
      )}
    </div>
  );
};

export default ManageTeam;