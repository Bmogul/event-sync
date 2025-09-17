-- Fix RLS policies for events table to allow INSERT operations

-- Add policy to allow authenticated users to insert events
CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy to allow users to update events they manage
CREATE POLICY "Users can update managed events" ON events
    FOR UPDATE USING (
        id IN (
            SELECT event_id FROM event_managers em
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid()
        )
    );

-- Add policy to allow users to delete events they own
CREATE POLICY "Users can delete owned events" ON events
    FOR DELETE USING (
        id IN (
            SELECT event_id FROM event_managers em
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid() AND em.role_id = 1 -- owner role
        )
    );
