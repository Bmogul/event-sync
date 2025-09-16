CREATE TABLE group_status(
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE guest_gender(
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE rsvp_status(
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE guest_age_group(
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE guest_groups(
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  size_limit INTEGER DEFAULT -1,
  invite_sent_at TIMESTAMP,
  invite_sent_by INTEGER REFERENCES users(id),
  status_id INTEGER NOT NULL REFERENCES group_status(id) DEFAULT 1,
  point_of_contact_id INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
CREATE TABLE guests(
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tag TEXT,
  gender_id INTEGER REFERENCES guest_gender(id),
  age_group_id INTEGER REFERENCES guest_age_group(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT guest_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE rsvps(
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  subevent_id INTEGER NOT NULL REFERENCES subevents(id) ON DELETE CASCADE,
  status_id INTEGER NOT NULL REFERENCES rsvp_status(id) DEFAULT 1,
  response INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT rsvps_pkey PRIMARY KEY(guest_id, subevent_id)
);

-- Add foreign key constraint for point_of_contact after guests table is created
ALTER TABLE guest_groups 
ADD CONSTRAINT guest_groups_point_of_contact_fkey 
FOREIGN KEY (point_of_contact_id) REFERENCES guests(id);

-- Add indexes for better performance
CREATE INDEX idx_guest_groups_event_id ON guest_groups(event_id);
CREATE INDEX idx_guest_groups_status ON guest_groups(status_id);
CREATE INDEX idx_guests_group_id ON guests(group_id);
CREATE INDEX idx_guests_email ON guests(email) WHERE email IS NOT NULL;
CREATE INDEX idx_guests_user_id ON guests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_rsvps_subevent_id ON rsvps(subevent_id);
CREATE INDEX idx_rsvps_status ON rsvps(status_id);

-- Seed lookup tables
INSERT INTO group_status (state, description, display_order) VALUES
('draft', 'Group is being created', 1),
('pending', 'Invitations ready to send', 2),
('invited', 'Invitations have been sent', 3),
('responded', 'Some responses received', 4),
('completed', 'All responses received', 5),
('cancelled', 'Group invitation cancelled', 6)
ON CONFLICT (state) DO NOTHING;

INSERT INTO guest_gender (state, description, display_order) VALUES
('male', 'Male', 1),
('female', 'Female', 2),
('other', 'Other/Prefer not to say', 3),
('unknown', 'Not specified', 4)
ON CONFLICT (state) DO NOTHING;

INSERT INTO guest_age_group (state, description, display_order) VALUES
('infant', 'Infant (0-2 years)', 1),
('child', 'Child (3-12 years)', 2),
('teen', 'Teenager (13-17 years)', 3),
('adult', 'Adult (18-64 years)', 4),
('senior', 'Senior (65+ years)', 5),
('unknown', 'Age not specified', 6)
ON CONFLICT (state) DO NOTHING;

INSERT INTO rsvp_status (state, description, display_order) VALUES
('pending', 'Invitation sent, awaiting response', 1),
('opened', 'Invitation opened/viewed', 2),
('attending', 'Confirmed attending', 3),
('not_attending', 'Confirmed not attending', 4),
('maybe', 'Maybe attending', 5),
('no_response', 'No response received', 6)
ON CONFLICT (state) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- RLS policies for guest_groups
CREATE POLICY "Users can manage groups for their events" ON guest_groups
    FOR ALL USING (
        event_id IN (
            SELECT event_id FROM event_managers em
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid()
        )
    );

-- Allow public read access to guest_groups for RSVP pages
CREATE POLICY "Public read access to guest groups" ON guest_groups
    FOR SELECT USING (true);

-- RLS policies for guests
CREATE POLICY "Users can manage guests in their event groups" ON guests
    FOR ALL USING (
        group_id IN (
            SELECT gg.id FROM guest_groups gg
            JOIN event_managers em ON gg.event_id = em.event_id
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid()
        )
    );

-- Allow public read access to guests for RSVP pages
CREATE POLICY "Public read access to guests" ON guests
    FOR SELECT USING (true);

-- RLS policies for RSVPs
CREATE POLICY "Users can view RSVPs for their events" ON rsvps
    FOR SELECT USING (
        subevent_id IN (
            SELECT s.id FROM subevents s
            JOIN event_managers em ON s.event_id = em.event_id
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid()
        )
    );

-- Allow public read access to RSVPs for RSVP pages
CREATE POLICY "Public read access to RSVPs" ON rsvps
    FOR SELECT USING (true);

-- Registered users can update their own RSVPs
CREATE POLICY "Registered users can update their own RSVPs" ON rsvps
    FOR UPDATE USING (
        guest_id IN (
            SELECT id FROM guests 
            WHERE user_id IN (
                SELECT id FROM users WHERE supa_id = auth.uid()
            )
        )
    );

-- Allow anonymous users to insert/update RSVPs (for public RSVP forms)
CREATE POLICY "Anonymous users can manage RSVPs" ON rsvps
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous users can update RSVPs" ON rsvps
    FOR UPDATE USING (true);

