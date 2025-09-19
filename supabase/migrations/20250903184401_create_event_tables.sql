CREATE TABLE event_state_lookup (
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE subevent_state_lookup (
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE event_manage_state_lookup (
  id            SERIAL      PRIMARY KEY,
  state         VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE event_manage_roles (
  id            SERIAL      PRIMARY KEY,
  role_name     VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER     NOT NULL UNIQUE,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE users (
  id            SERIAL      PRIMARY KEY,
  public_id     VARCHAR(20) UNIQUE,
  supa_id       UUID        UNIQUE NOT NULL,
  first_name    VARCHAR(50),
  last_name     VARCHAR(50),
  email         VARCHAR(255),
  phone         VARCHAR(16),  -- E.164 Format
  settings      JSONB       DEFAULT '{}'::jsonb,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE TABLE events (
  id            SERIAL      PRIMARY KEY,
  public_id     VARCHAR(20) UNIQUE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  capacity      INTEGER,
  total_yes     INTEGER     DEFAULT 0,
  status_id     INTEGER     NOT NULL REFERENCES event_state_lookup(id),
  details       JSONB       DEFAULT '{}'::jsonb,
  logo_url      TEXT,
  hero_url      TEXT,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP,
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE TABLE subevents (
  id            SERIAL      PRIMARY KEY,
  event_id      INTEGER     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL DEFAULT 'My Event',
  event_date    DATE        NOT NULL,
  start_time    TIME        NOT NULL,
  end_time      TIME,
  timezone      VARCHAR(50) DEFAULT 'America/New_York',
  venue_address TEXT,
  capacity      INTEGER,
  total_yes     INTEGER     DEFAULT 0,
  status_id     INTEGER     NOT NULL REFERENCES subevent_state_lookup(id),
  details       JSONB       DEFAULT '{}'::jsonb,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP,
  CONSTRAINT valid_times CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE TABLE event_managers (
  user_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id      INTEGER     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role_id       INTEGER     NOT NULL REFERENCES event_manage_roles(id),
  status_id     INTEGER     NOT NULL REFERENCES event_manage_state_lookup(id),
  invited_at    TIMESTAMP   DEFAULT NOW(),
  accepted_at   TIMESTAMP,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW(),
  deleted_at    TIMESTAMP,
  PRIMARY KEY(user_id, event_id)
);

CREATE OR REPLACE FUNCTION generate_public_id(prefix TEXT DEFAULT 'usr')
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || '_' || encode(gen_random_bytes(8), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    supa_id, 
    public_id, 
    email, 
    first_name, 
    last_name
  ) VALUES (
    NEW.id, 
    generate_public_id('usr'), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subevents ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON users
    FOR ALL USING (supa_id = auth.uid());

CREATE POLICY "Users view managed events" ON events
    FOR SELECT USING (
        id IN (
            SELECT event_id FROM event_managers em
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid()
        )
    );

CREATE POLICY "Users view managed subevents" ON subevents
    FOR SELECT USING (
        event_id IN (
            SELECT event_id FROM event_managers em
            JOIN users u ON em.user_id = u.id
            WHERE u.supa_id = auth.uid()
        )
    );

CREATE POLICY "Users view own manager relationships" ON event_managers
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE supa_id = auth.uid()
        )
    );

-- SEED DATA FOR lookups
INSERT INTO event_state_lookup (state, description, display_order) VALUES
('draft', 'Event is being planned and not yet public', 1),
('active', 'Event is live and accepting RSVPs', 2),
('closed', 'Event RSVP period has closed', 3),
('completed', 'Event has finished successfully', 4),
('cancelled', 'Event was cancelled', 5)
ON CONFLICT (state) DO NOTHING; -- Prevents errors if already exists

-- Seed Subevent States  
INSERT INTO subevent_state_lookup (state, description, display_order) VALUES
('draft', 'Subevent is being planned', 1),
('active', 'Subevent is ready and live', 2),
('completed', 'Subevent has finished', 3),
('cancelled', 'Subevent was cancelled', 4)
ON CONFLICT (state) DO NOTHING;

-- Seed Event Manager States
INSERT INTO event_manage_state_lookup (state, description, display_order) VALUES
('pending', 'Invitation sent, awaiting response', 1),
('accepted', 'User accepted the invitation', 2),
('declined', 'User declined the invitation', 3),
('removed', 'User was removed from event management', 4),
('dormant', 'User has not been active on event', 5)
ON CONFLICT (state) DO NOTHING;

-- Seed Event Management Roles
INSERT INTO event_manage_roles (role_name, description, display_order) VALUES
('owner', 'Full control over the event including deletion', 1),
('admin', 'Can manage event details and invite other managers', 2),
('editor', 'Can edit event content but not manage users', 3),
('viewer', 'Can view event details and analytics only', 4)
ON CONFLICT (role_name) DO NOTHING;
