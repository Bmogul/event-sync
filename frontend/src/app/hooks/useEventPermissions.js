import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Permission matrix defining what each role can do
const PERMISSIONS = {
  owner: {
    guests: ['create', 'read', 'update', 'delete'],
    emails: ['send', 'templates', 'analytics'],
    event: ['read', 'update', 'delete'],
    collaborators: ['invite', 'remove', 'manage_roles'],
    analytics: ['read'],
    settings: ['update']
  },
  admin: {
    guests: ['create', 'read', 'update', 'delete'],
    emails: ['send', 'templates', 'analytics'],
    event: ['read', 'update'], // Cannot delete
    collaborators: ['invite', 'remove'],
    analytics: ['read'],
    settings: ['update']
  },
  editor: {
    guests: ['read', 'update'],
    emails: ['templates'], // Can edit templates
    event: ['read'],
    collaborators: [], // Cannot manage team
    analytics: ['read'],
    settings: []
  },
  viewer: {
    guests: [],
    emails: [],
    event: ['read'],
    collaborators: [],
    analytics: ['read'], // View-only analytics
    settings: []
  }
};

export const useEventPermissions = (eventPublicId) => {
  const { userProfile, supabase } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!eventPublicId || !userProfile?.id || !supabase) {
        setPermissions(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, get the database event ID from public_id
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, created_by')
          .eq('public_id', eventPublicId)
          .single();

        if (eventError) {
          throw eventError;
        }

        const eventDatabaseId = eventData.id;

        // Now try to get the user's role from event_managers using the database ID
        const { data: managerData, error: managerError } = await supabase
          .from('event_managers')
          .select(`
            *,
            role:event_manage_roles(role_name),
            status:event_manage_state_lookup(state)
          `)
          .eq('event_id', eventDatabaseId)
          .eq('user_id', userProfile.id)
          .eq('status_id', 2) // Only accepted collaborations
          .single();

        if (managerError && managerError.code !== 'PGRST116') {
          // PGRST116 is "not found" - that's okay, user might not be a collaborator
          throw managerError;
        }

        let roleName = null;
        
        if (managerData && managerData.role) {
          // User is a collaborator
          console.log('useEventPermissions: User found as collaborator with role:', managerData.role.role_name);
          roleName = managerData.role.role_name;
        } else {
          // Check if user owns the event (we already have the eventData)
          console.log('useEventPermissions: User not found as collaborator, checking ownership');
          console.log('useEventPermissions: Ownership check:', {
            eventCreatedBy: eventData.created_by,
            userProfileId: userProfile.id,
            isOwner: eventData.created_by === userProfile.id
          });

          if (eventData.created_by === userProfile.id) {
            console.log('useEventPermissions: User is owner');
            roleName = 'owner';
          } else {
            console.log('useEventPermissions: User has no access to this event');
          }
        }

        console.log('useEventPermissions: Setting final result:', {
          roleName,
          permissions: roleName ? PERMISSIONS[roleName] : null
        });

        setUserRole(roleName);
        setPermissions(roleName ? PERMISSIONS[roleName] : null);

      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err.message);
        setPermissions(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [eventPublicId, userProfile?.id, supabase]);

  // Helper function to check if user has specific permission
  const hasPermission = (resource, action) => {
    if (!permissions || !permissions[resource]) {
      return false;
    }
    return permissions[resource].includes(action);
  };

  // Helper function to check if user has any permission for a resource
  const hasAnyPermission = (resource) => {
    if (!permissions || !permissions[resource]) {
      return false;
    }
    return permissions[resource].length > 0;
  };

  // Helper function to get all permissions for a resource
  const getResourcePermissions = (resource) => {
    if (!permissions || !permissions[resource]) {
      return [];
    }
    return permissions[resource];
  };

  return {
    permissions,
    userRole,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    getResourcePermissions,
    // Convenience methods for common checks
    canManageGuests: hasPermission('guests', 'create') || hasPermission('guests', 'update'),
    canSendEmails: hasPermission('emails', 'send'),
    canEditTemplates: hasPermission('emails', 'templates'),
    canViewAnalytics: hasPermission('analytics', 'read'),
    canManageCollaborators: hasPermission('collaborators', 'invite'),
    canDeleteEvent: hasPermission('event', 'delete'),
    canEditEvent: hasPermission('event', 'update'),
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin',
    isEditor: userRole === 'editor',
    isViewer: userRole === 'viewer'
  };
};

export default useEventPermissions;