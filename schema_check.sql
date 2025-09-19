

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."generate_public_id"("prefix" "text" DEFAULT 'usr'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN prefix || '_' || replace(gen_random_uuid()::text, '-', '');
END;
$$;


ALTER FUNCTION "public"."generate_public_id"("prefix" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (
    supa_id,
    public_id,
    email,
    first_name
  ) VALUES (
    NEW.id,
    public.generate_public_id('usr'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (supa_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_landing_config_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Set published_at when status becomes published
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_landing_config_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_manage_roles" (
    "id" integer NOT NULL,
    "role_name" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."event_manage_roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_manage_roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_manage_roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_manage_roles_id_seq" OWNED BY "public"."event_manage_roles"."id";



CREATE TABLE IF NOT EXISTS "public"."event_manage_state_lookup" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."event_manage_state_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_manage_state_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_manage_state_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_manage_state_lookup_id_seq" OWNED BY "public"."event_manage_state_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."event_managers" (
    "user_id" integer NOT NULL,
    "event_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "status_id" integer NOT NULL,
    "invited_at" timestamp without time zone DEFAULT "now"(),
    "accepted_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."event_managers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_state_lookup" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."event_state_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_state_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_state_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_state_lookup_id_seq" OWNED BY "public"."event_state_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" integer NOT NULL,
    "public_id" "text",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "capacity" integer,
    "total_yes" integer DEFAULT 0,
    "status_id" integer NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "logo_url" "text",
    "hero_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    CONSTRAINT "valid_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."events_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."events_id_seq" OWNED BY "public"."events"."id";



CREATE TABLE IF NOT EXISTS "public"."group_status" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."group_status" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."group_status_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."group_status_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."group_status_id_seq" OWNED BY "public"."group_status"."id";



CREATE TABLE IF NOT EXISTS "public"."guest_age_group" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."guest_age_group" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."guest_age_group_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."guest_age_group_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."guest_age_group_id_seq" OWNED BY "public"."guest_age_group"."id";



CREATE TABLE IF NOT EXISTS "public"."guest_gender" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."guest_gender" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."guest_gender_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."guest_gender_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."guest_gender_id_seq" OWNED BY "public"."guest_gender"."id";



CREATE TABLE IF NOT EXISTS "public"."guest_groups" (
    "id" integer NOT NULL,
    "event_id" integer NOT NULL,
    "title" "text" NOT NULL,
    "size_limit" integer DEFAULT '-1'::integer,
    "invite_sent_at" timestamp without time zone,
    "invite_sent_by" integer,
    "status_id" integer DEFAULT 1 NOT NULL,
    "point_of_contact_id" integer,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "color" "text",
    "description" "text"
);


ALTER TABLE "public"."guest_groups" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."guest_groups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."guest_groups_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."guest_groups_id_seq" OWNED BY "public"."guest_groups"."id";



CREATE TABLE IF NOT EXISTS "public"."guests" (
    "id" integer NOT NULL,
    "group_id" integer NOT NULL,
    "user_id" integer,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "tag" "text",
    "gender_id" integer,
    "age_group_id" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    CONSTRAINT "guest_contact_required" CHECK ((("email" IS NOT NULL) OR ("phone" IS NOT NULL)))
);


ALTER TABLE "public"."guests" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."guests_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."guests_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."guests_id_seq" OWNED BY "public"."guests"."id";



CREATE TABLE IF NOT EXISTS "public"."landing_page_configs" (
    "id" integer NOT NULL,
    "event_id" integer NOT NULL,
    "title" "text" NOT NULL,
    "landing_page_url" "text",
    "logo" "text",
    "cards" "jsonb" DEFAULT '{}'::"jsonb",
    "greeting_config" "jsonb" DEFAULT '{}'::"jsonb",
    "rsvp_config" "jsonb" DEFAULT '{}'::"jsonb",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "custom_css" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "published_at" timestamp without time zone,
    "deleted_at" timestamp without time zone,
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."landing_page_configs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."landing_page_configs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."landing_page_configs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."landing_page_configs_id_seq" OWNED BY "public"."landing_page_configs"."id";



CREATE TABLE IF NOT EXISTS "public"."rsvp_status" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."rsvp_status" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rsvp_status_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rsvp_status_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rsvp_status_id_seq" OWNED BY "public"."rsvp_status"."id";



CREATE TABLE IF NOT EXISTS "public"."rsvps" (
    "guest_id" integer NOT NULL,
    "subevent_id" integer NOT NULL,
    "status_id" integer DEFAULT 1 NOT NULL,
    "response" integer,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "responded_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subevent_state_lookup" (
    "id" integer NOT NULL,
    "state" character varying(50) NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."subevent_state_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subevent_state_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subevent_state_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subevent_state_lookup_id_seq" OWNED BY "public"."subevent_state_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."subevents" (
    "id" integer NOT NULL,
    "event_id" integer NOT NULL,
    "title" character varying(255) DEFAULT 'My Event'::character varying NOT NULL,
    "event_date" "date",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "timezone" character varying(50) DEFAULT 'America/New_York'::character varying,
    "venue_address" "text",
    "capacity" integer,
    "total_yes" integer DEFAULT 0,
    "status_id" integer NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    CONSTRAINT "valid_times" CHECK ((("end_time" IS NULL) OR ("end_time" > "start_time")))
);


ALTER TABLE "public"."subevents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subevents_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subevents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subevents_id_seq" OWNED BY "public"."subevents"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" integer NOT NULL,
    "public_id" "text",
    "supa_id" "uuid" NOT NULL,
    "first_name" character varying(50),
    "last_name" character varying(50),
    "email" character varying(255),
    "phone" character varying(16),
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "last_login" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



ALTER TABLE ONLY "public"."event_manage_roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_manage_roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."event_manage_state_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_manage_state_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."event_state_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_state_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."group_status" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."group_status_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guest_age_group" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."guest_age_group_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guest_gender" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."guest_gender_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guest_groups" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."guest_groups_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guests" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."guests_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."landing_page_configs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."landing_page_configs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rsvp_status" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rsvp_status_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subevent_state_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subevent_state_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subevents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subevents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."event_manage_roles"
    ADD CONSTRAINT "event_manage_roles_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."event_manage_roles"
    ADD CONSTRAINT "event_manage_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_manage_roles"
    ADD CONSTRAINT "event_manage_roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."event_manage_state_lookup"
    ADD CONSTRAINT "event_manage_state_lookup_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."event_manage_state_lookup"
    ADD CONSTRAINT "event_manage_state_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_manage_state_lookup"
    ADD CONSTRAINT "event_manage_state_lookup_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."event_managers"
    ADD CONSTRAINT "event_managers_pkey" PRIMARY KEY ("user_id", "event_id");



ALTER TABLE ONLY "public"."event_state_lookup"
    ADD CONSTRAINT "event_state_lookup_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."event_state_lookup"
    ADD CONSTRAINT "event_state_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_state_lookup"
    ADD CONSTRAINT "event_state_lookup_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_public_id_key" UNIQUE ("public_id");



ALTER TABLE ONLY "public"."group_status"
    ADD CONSTRAINT "group_status_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."group_status"
    ADD CONSTRAINT "group_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_status"
    ADD CONSTRAINT "group_status_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."guest_age_group"
    ADD CONSTRAINT "guest_age_group_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."guest_age_group"
    ADD CONSTRAINT "guest_age_group_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_age_group"
    ADD CONSTRAINT "guest_age_group_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."guest_gender"
    ADD CONSTRAINT "guest_gender_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."guest_gender"
    ADD CONSTRAINT "guest_gender_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_gender"
    ADD CONSTRAINT "guest_gender_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."guest_groups"
    ADD CONSTRAINT "guest_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landing_page_configs"
    ADD CONSTRAINT "landing_page_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rsvp_status"
    ADD CONSTRAINT "rsvp_status_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."rsvp_status"
    ADD CONSTRAINT "rsvp_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rsvp_status"
    ADD CONSTRAINT "rsvp_status_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."rsvps"
    ADD CONSTRAINT "rsvps_pkey" PRIMARY KEY ("guest_id", "subevent_id");



ALTER TABLE ONLY "public"."subevent_state_lookup"
    ADD CONSTRAINT "subevent_state_lookup_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."subevent_state_lookup"
    ADD CONSTRAINT "subevent_state_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subevent_state_lookup"
    ADD CONSTRAINT "subevent_state_lookup_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."subevents"
    ADD CONSTRAINT "subevents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landing_page_configs"
    ADD CONSTRAINT "unique_event_config" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_public_id_key" UNIQUE ("public_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_supa_id_key" UNIQUE ("supa_id");



CREATE INDEX "idx_guest_groups_event_id" ON "public"."guest_groups" USING "btree" ("event_id");



CREATE INDEX "idx_guest_groups_status" ON "public"."guest_groups" USING "btree" ("status_id");



CREATE INDEX "idx_guests_email" ON "public"."guests" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_guests_group_id" ON "public"."guests" USING "btree" ("group_id");



CREATE INDEX "idx_guests_user_id" ON "public"."guests" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_landing_configs_event_id" ON "public"."landing_page_configs" USING "btree" ("event_id");



CREATE INDEX "idx_landing_configs_status" ON "public"."landing_page_configs" USING "btree" ("status");



CREATE INDEX "idx_rsvps_status" ON "public"."rsvps" USING "btree" ("status_id");



CREATE INDEX "idx_rsvps_subevent_id" ON "public"."rsvps" USING "btree" ("subevent_id");



CREATE OR REPLACE TRIGGER "trigger_update_landing_config_timestamp" BEFORE UPDATE ON "public"."landing_page_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_landing_config_timestamp"();



ALTER TABLE ONLY "public"."event_managers"
    ADD CONSTRAINT "event_managers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_managers"
    ADD CONSTRAINT "event_managers_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."event_manage_roles"("id");



ALTER TABLE ONLY "public"."event_managers"
    ADD CONSTRAINT "event_managers_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."event_manage_state_lookup"("id");



ALTER TABLE ONLY "public"."event_managers"
    ADD CONSTRAINT "event_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."event_state_lookup"("id");



ALTER TABLE ONLY "public"."guest_groups"
    ADD CONSTRAINT "guest_groups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guest_groups"
    ADD CONSTRAINT "guest_groups_invite_sent_by_fkey" FOREIGN KEY ("invite_sent_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."guest_groups"
    ADD CONSTRAINT "guest_groups_point_of_contact_fkey" FOREIGN KEY ("point_of_contact_id") REFERENCES "public"."guests"("id");



ALTER TABLE ONLY "public"."guest_groups"
    ADD CONSTRAINT "guest_groups_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."group_status"("id");



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_age_group_id_fkey" FOREIGN KEY ("age_group_id") REFERENCES "public"."guest_age_group"("id");



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "public"."guest_gender"("id");



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."guest_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."landing_page_configs"
    ADD CONSTRAINT "landing_page_configs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rsvps"
    ADD CONSTRAINT "rsvps_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rsvps"
    ADD CONSTRAINT "rsvps_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."rsvp_status"("id");



ALTER TABLE ONLY "public"."rsvps"
    ADD CONSTRAINT "rsvps_subevent_id_fkey" FOREIGN KEY ("subevent_id") REFERENCES "public"."subevents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subevents"
    ADD CONSTRAINT "subevents_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subevents"
    ADD CONSTRAINT "subevents_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."subevent_state_lookup"("id");



CREATE POLICY "Anonymous users can manage RSVPs" ON "public"."rsvps" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anonymous users can update RSVPs" ON "public"."rsvps" FOR UPDATE USING (true);



CREATE POLICY "Authenticated users can create events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Public read access to RSVPs" ON "public"."rsvps" FOR SELECT USING (true);



CREATE POLICY "Public read access to guest groups" ON "public"."guest_groups" FOR SELECT USING (true);



CREATE POLICY "Public read access to guests" ON "public"."guests" FOR SELECT USING (true);



CREATE POLICY "Public read access to published landing configs" ON "public"."landing_page_configs" FOR SELECT USING ((("status")::"text" = 'published'::"text"));



CREATE POLICY "Registered users can update their own RSVPs" ON "public"."rsvps" FOR UPDATE USING (("guest_id" IN ( SELECT "guests"."id"
   FROM "public"."guests"
  WHERE ("guests"."user_id" IN ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."supa_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete owned events" ON "public"."events" FOR DELETE USING (("id" IN ( SELECT "em"."event_id"
   FROM ("public"."event_managers" "em"
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE (("u"."supa_id" = "auth"."uid"()) AND ("em"."role_id" = 1)))));



CREATE POLICY "Users can manage groups for their events" ON "public"."guest_groups" USING (("event_id" IN ( SELECT "em"."event_id"
   FROM ("public"."event_managers" "em"
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage guests in their event groups" ON "public"."guests" USING (("group_id" IN ( SELECT "gg"."id"
   FROM (("public"."guest_groups" "gg"
     JOIN "public"."event_managers" "em" ON (("gg"."event_id" = "em"."event_id")))
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage landing configs for their events" ON "public"."landing_page_configs" USING (("event_id" IN ( SELECT "em"."event_id"
   FROM ("public"."event_managers" "em"
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users can update managed events" ON "public"."events" FOR UPDATE USING (("id" IN ( SELECT "em"."event_id"
   FROM ("public"."event_managers" "em"
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users can view RSVPs for their events" ON "public"."rsvps" FOR SELECT USING (("subevent_id" IN ( SELECT "s"."id"
   FROM (("public"."subevents" "s"
     JOIN "public"."event_managers" "em" ON (("s"."event_id" = "em"."event_id")))
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users manage own profile" ON "public"."users" USING (("supa_id" = "auth"."uid"()));



CREATE POLICY "Users view managed events" ON "public"."events" FOR SELECT USING (("id" IN ( SELECT "em"."event_id"
   FROM ("public"."event_managers" "em"
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users view managed subevents" ON "public"."subevents" FOR SELECT USING (("event_id" IN ( SELECT "em"."event_id"
   FROM ("public"."event_managers" "em"
     JOIN "public"."users" "u" ON (("em"."user_id" = "u"."id")))
  WHERE ("u"."supa_id" = "auth"."uid"()))));



CREATE POLICY "Users view own manager relationships" ON "public"."event_managers" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."supa_id" = "auth"."uid"()))));



ALTER TABLE "public"."rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_public_id"("prefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_public_id"("prefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_public_id"("prefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_landing_config_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_landing_config_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_landing_config_timestamp"() TO "service_role";



GRANT ALL ON TABLE "public"."event_manage_roles" TO "anon";
GRANT ALL ON TABLE "public"."event_manage_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."event_manage_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_manage_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_manage_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_manage_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_manage_state_lookup" TO "anon";
GRANT ALL ON TABLE "public"."event_manage_state_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."event_manage_state_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_manage_state_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_manage_state_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_manage_state_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_managers" TO "anon";
GRANT ALL ON TABLE "public"."event_managers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_managers" TO "service_role";



GRANT ALL ON TABLE "public"."event_state_lookup" TO "anon";
GRANT ALL ON TABLE "public"."event_state_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."event_state_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_state_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_state_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_state_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."group_status" TO "anon";
GRANT ALL ON TABLE "public"."group_status" TO "authenticated";
GRANT ALL ON TABLE "public"."group_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."group_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."guest_age_group" TO "anon";
GRANT ALL ON TABLE "public"."guest_age_group" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_age_group" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guest_age_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guest_age_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guest_age_group_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."guest_gender" TO "anon";
GRANT ALL ON TABLE "public"."guest_gender" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_gender" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guest_gender_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guest_gender_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guest_gender_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."guest_groups" TO "anon";
GRANT ALL ON TABLE "public"."guest_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guest_groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guest_groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guest_groups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."guests" TO "anon";
GRANT ALL ON TABLE "public"."guests" TO "authenticated";
GRANT ALL ON TABLE "public"."guests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."landing_page_configs" TO "anon";
GRANT ALL ON TABLE "public"."landing_page_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."landing_page_configs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."landing_page_configs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."landing_page_configs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."landing_page_configs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rsvp_status" TO "anon";
GRANT ALL ON TABLE "public"."rsvp_status" TO "authenticated";
GRANT ALL ON TABLE "public"."rsvp_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rsvp_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rsvp_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rsvp_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rsvps" TO "anon";
GRANT ALL ON TABLE "public"."rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."subevent_state_lookup" TO "anon";
GRANT ALL ON TABLE "public"."subevent_state_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."subevent_state_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subevent_state_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subevent_state_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subevent_state_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subevents" TO "anon";
GRANT ALL ON TABLE "public"."subevents" TO "authenticated";
GRANT ALL ON TABLE "public"."subevents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subevents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subevents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subevents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
