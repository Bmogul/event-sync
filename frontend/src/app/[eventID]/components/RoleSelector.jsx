'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import { toast } from 'react-toastify';
import styles from './RoleSelector.module.css';

const RoleSelector = ({ 
  currentRoleId, 
  currentUserRole, 
  onRoleChange, 
  onCancel,
  availableRoles = null, // If provided, use these roles instead of fetching
  disabled = false,
  showDescription = false,
  inline = false // For inline vs dropdown display
}) => {
  const { supabase } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);
  const [loading, setLoading] = useState(false);

  // Fetch roles if not provided
  useEffect(() => {
    const fetchRoles = async () => {
      if (availableRoles) {
        setRoles(availableRoles);
        return;
      }

      if (!supabase) return;

      setLoading(true);
      try {
        const { data: rolesData, error } = await supabase
          .from('event_manage_roles')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          throw error;
        }

        // Filter roles based on current user's permissions
        let allowedRoles = rolesData || [];
        
        if (currentUserRole === 'admin') {
          // Admin can assign editor/viewer roles and admin role (to downgrade themselves)
          allowedRoles = rolesData.filter(role => 
            ['admin', 'editor', 'viewer'].includes(role.role_name)
          );
        } else if (currentUserRole === 'owner') {
          // Owner can assign any role except owner (can't change ownership)
          allowedRoles = rolesData.filter(role => 
            role.role_name !== 'owner'
          );
        } else {
          // Other roles shouldn't be able to change roles
          allowedRoles = [];
        }

        setRoles(allowedRoles);

      } catch (err) {
        console.error('Error fetching roles:', err);
        toast.error('Failed to load available roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [supabase, currentUserRole, availableRoles]);

  const handleConfirm = () => {
    if (selectedRoleId && selectedRoleId !== currentRoleId) {
      onRoleChange(selectedRoleId);
    } else if (onCancel) {
      onCancel();
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'owner':
        return '#8B5CF6'; // Purple
      case 'admin':
        return '#EF4444'; // Red
      case 'editor':
        return '#F59E0B'; // Orange
      case 'viewer':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'owner':
        return '👑';
      case 'admin':
        return '🛡️';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <span>Loading roles...</span>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className={styles.noRoles}>
        No roles available for assignment
      </div>
    );
  }

  if (inline) {
    // Inline dropdown selector
    return (
      <div className={styles.inlineSelector}>
        <select
          value={selectedRoleId || ''}
          onChange={(e) => {
            setSelectedRoleId(parseInt(e.target.value));
            if (onRoleChange) {
              onRoleChange(parseInt(e.target.value));
            }
          }}
          disabled={disabled}
          className={styles.select}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {getRoleIcon(role.role_name)} {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Full role selector with cards
  return (
    <div className={styles.roleSelector}>
      <div className={styles.roleOptions}>
        {roles.map((role) => (
          <div
            key={role.id}
            className={`${styles.roleOption} ${
              selectedRoleId === role.id ? styles.selected : ''
            } ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && setSelectedRoleId(role.id)}
            style={selectedRoleId === role.id ? {
              borderColor: getRoleColor(role.role_name),
              backgroundColor: `${getRoleColor(role.role_name)}10`
            } : {}}
          >
            <div className={styles.roleHeader}>
              <span className={styles.roleIcon}>
                {getRoleIcon(role.role_name)}
              </span>
              <span 
                className={styles.roleName}
                style={selectedRoleId === role.id ? {
                  color: getRoleColor(role.role_name)
                } : {}}
              >
                {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
              </span>
              {selectedRoleId === role.id && (
                <span className={styles.checkmark}>✓</span>
              )}
            </div>
            
            {showDescription && role.description && (
              <div className={styles.roleDescription}>
                {role.description}
              </div>
            )}

            {/* Role permissions preview */}
            <div className={styles.rolePermissions}>
              {role.role_name === 'admin' && (
                <span className={styles.permission}>Full management access</span>
              )}
              {role.role_name === 'editor' && (
                <span className={styles.permission}>Edit guests & templates</span>
              )}
              {role.role_name === 'viewer' && (
                <span className={styles.permission}>View-only access</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {onCancel && (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="small"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            size="small"
            onClick={handleConfirm}
            disabled={disabled || selectedRoleId === currentRoleId}
          >
            {selectedRoleId === currentRoleId ? 'No Change' : 'Confirm'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;