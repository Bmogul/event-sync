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
  supa_id       TEXT        UNIQUE,
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
