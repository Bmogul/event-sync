
-- Change public_id column to text
ALTER TABLE public.users
ALTER COLUMN public_id TYPE text;

-- Create generate_public_id function using UUID
CREATE OR REPLACE FUNCTION public.generate_public_id(prefix TEXT DEFAULT 'usr')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN prefix || '_' || replace(gen_random_uuid()::text, '-', '');
END;
$$;

-- Create handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
