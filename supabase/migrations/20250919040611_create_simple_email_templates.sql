-- Simple Email Template System Migration
-- Focuses on: template storage, logo management, and essential variables

-- =====================================================
-- 1. EMAIL TEMPLATE CATEGORIES
-- =====================================================

CREATE TABLE email_template_categories (
  id            SERIAL      PRIMARY KEY,
  name          VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  created_at    TIMESTAMP   DEFAULT NOW()
);
CREATE TABLE email_template_status (
  id            SERIAL      PRIMARY KEY,
  name          VARCHAR(50) NOT NULL UNIQUE,
  description   TEXT,
  created_at    TIMESTAMP   DEFAULT NOW()
);

-- Insert template categories
INSERT INTO email_template_categories (name, description) VALUES
('invitation', 'Initial event invitation emails'),
('reminder', 'Reminder emails for upcoming events'),
('update', 'Event update and change notifications');

INSERT INTO email_template_status (name, description) VALUES
('draft', ''),
('active', ''),
('archive', '');

-- =====================================================
-- 2. EMAIL TEMPLATES
-- =====================================================

CREATE TABLE email_templates (
  id               SERIAL      PRIMARY KEY,
  event_id         INTEGER NOT NULL REFERENCES events(id),
  category_id      INTEGER     NOT NULL REFERENCES email_template_categories(id) DEFAULT 1,
  template_status_id  INTEGER     NOT NULL REFERENCES email_template_status(id) DEFAULT 1,
  name             VARCHAR(100) NOT NULL,
  subject_line     VARCHAR(255) NOT NULL,
  sender_name       TEXT        NOT NULL,
  description      TEXT,
  title            TEXT,
  subtitle         TEXT,
  greeting         TEXT,
  body             TEXT,
  signoff         TEXT,
  reply_to         TEXT,
  is_default       BOOLEAN DEFAULT FALSE,
  primary_color    VARCHAR(7),
  secondary_color  VARCHAR(7),
  font_color       VARCHAR(7),


  created_at       TIMESTAMP   DEFAULT NOW(),
  updated_at       TIMESTAMP   DEFAULT NOW()
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_email_templates_events ON email_templates(event_id);
CREATE INDEX idx_email_templates_category ON email_templates(category_id);
CREATE INDEX idx_email_templates_status ON email_templates(template_status_id);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_timestamp
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();


