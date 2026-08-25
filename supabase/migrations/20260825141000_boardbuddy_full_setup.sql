-- ENUM
CREATE TYPE public.app_role AS ENUM ('owner','admin','student');

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'))
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Student',
  avatar_url text,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_study_date text,
  daily_goal integer NOT NULL DEFAULT 20,
  today_count integer NOT NULL DEFAULT 0,
  today_date text,
  username text,
  recovery_question text,
  recovery_answer_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE UNIQUE INDEX profiles_username_lower_key ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ATTEMPTS
CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL,
  label text NOT NULL,
  subject_id text NOT NULL,
  chapter_id text,
  test_id text,
  total integer NOT NULL,
  correct integer NOT NULL,
  unanswered integer NOT NULL DEFAULT 0,
  seconds integer NOT NULL DEFAULT 0,
  per_question jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts" ON public.attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CHAPTER PROGRESS
CREATE TABLE public.chapter_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chapter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_progress TO authenticated;
GRANT ALL ON public.chapter_progress TO service_role;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own chapter progress" ON public.chapter_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ACHIEVEMENTS
CREATE TABLE public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own achievements" ON public.user_achievements FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text NOT NULL,
  chapter_id text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'review',
  source text,
  content_hash text NOT NULL UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published questions" ON public.questions FOR SELECT TO authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff write questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update questions" ON public.questions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete questions" ON public.questions FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER questions_touch BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MOCK TESTS
CREATE TABLE public.mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject_id text,
  difficulty text NOT NULL DEFAULT 'mixed',
  duration_minutes integer NOT NULL DEFAULT 30,
  question_count integer NOT NULL DEFAULT 20,
  published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published tests" ON public.mock_tests FOR SELECT TO authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "Staff insert tests" ON public.mock_tests FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update tests" ON public.mock_tests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete tests" ON public.mock_tests FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER mock_tests_touch BEFORE UPDATE ON public.mock_tests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- IMPORT BATCHES
CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  imported integer NOT NULL DEFAULT 0,
  duplicates integer NOT NULL DEFAULT 0,
  invalid integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read imports" ON public.import_batches FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff insert imports" ON public.import_batches FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- APP SETTINGS
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read audit" ON public.audit_log FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Signed in write audit" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ERROR LOGS
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL DEFAULT 'client',
  message text NOT NULL,
  stack text,
  route text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.error_logs TO anon, authenticated;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read errors" ON public.error_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Anyone report errors" ON public.error_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- NCERT SOLUTIONS
CREATE TABLE public.ncert_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text NOT NULL,
  chapter_id text NOT NULL,
  question text NOT NULL,
  answer jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'published',
  content_hash text NOT NULL UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ncert_solutions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ncert_solutions TO authenticated;
GRANT ALL ON public.ncert_solutions TO service_role;
ALTER TABLE public.ncert_solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published solutions" ON public.ncert_solutions FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff insert solutions" ON public.ncert_solutions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update solutions" ON public.ncert_solutions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete solutions" ON public.ncert_solutions FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER ncert_solutions_touch BEFORE UPDATE ON public.ncert_solutions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SIGNUP BOOTSTRAP (called by the app right after sign in)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.bootstrap_profile(
  _name text DEFAULT NULL,
  _username text DEFAULT NULL,
  _recovery_question text DEFAULT NULL,
  _recovery_answer_hash text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
DECLARE uname text := nullif(lower(trim(_username)), '');
BEGIN
  IF uid IS NULL THEN RETURN; END IF;

  INSERT INTO public.profiles (id, name, username, recovery_question, recovery_answer_hash)
  VALUES (
    uid,
    COALESCE(nullif(trim(_name), ''), uname, 'Student'),
    uname,
    nullif(trim(_recovery_question), ''),
    nullif(trim(_recovery_answer_hash), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET name = COALESCE(nullif(trim(_name), ''), public.profiles.name),
      username = COALESCE(public.profiles.username, uname),
      recovery_question = COALESCE(nullif(trim(_recovery_question), ''), public.profiles.recovery_question),
      recovery_answer_hash = COALESCE(nullif(trim(_recovery_answer_hash), ''), public.profiles.recovery_answer_hash);

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'student') ON CONFLICT DO NOTHING;
END; $$;

-- PASSWORD RECOVERY VIA SECRET QUESTION
CREATE OR REPLACE FUNCTION public.reset_password_with_answer(
  _username text, _answer_hash text, _new_password text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE uid uuid;
BEGIN
  IF _new_password IS NULL OR length(_new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  SELECT p.id INTO uid
  FROM public.profiles p
  WHERE lower(p.username) = lower(trim(_username))
    AND p.recovery_answer_hash IS NOT NULL
    AND p.recovery_answer_hash = _answer_hash;

  IF uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(uid, 'owner') THEN RETURN false; END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = uid;

  RETURN true;
END; $$;

-- OWNER + LEADERBOARD
CREATE OR REPLACE FUNCTION public.owner_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner')
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
RETURNS TABLE (user_id uuid, name text, avatar_url text, xp integer, streak integer, accuracy numeric, tests integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
         p.name,
         p.avatar_url,
         p.xp,
         p.streak,
         COALESCE(ROUND(100.0 * SUM(a.correct) / NULLIF(SUM(a.total), 0), 1), 0)::numeric AS accuracy,
         COALESCE(COUNT(a.id), 0)::integer AS tests
  FROM public.profiles p
  LEFT JOIN public.attempts a ON a.user_id = p.id
  GROUP BY p.id, p.name, p.avatar_url, p.xp, p.streak
  ORDER BY p.xp DESC, p.streak DESC
  LIMIT COALESCE(_limit, 50)
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owner_exists() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_profile(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_password_with_answer(text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_exists() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text, text, text, text) TO authenticated;

-- ============ PERMANENT OWNER ACCOUNT ============
DO $$
DECLARE
  owner_email text := 'swastikbaniya@boardbuddy.app';
  owner_username text := 'swastikbaniya';
  owner_password text := 'swastik6852';
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = owner_email;

  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, last_sign_in_at, confirmation_token,
      recovery_token, email_change_token_new, email_change,
      email_change_token_current, reauthentication_token, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      owner_email, extensions.crypt(owner_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', 'Swastik Baniya', 'username', owner_username),
      now(), now(), NULL, '', '', '', '', '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', owner_email, 'email_verified', true, 'provider', 'email'),
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(owner_password, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        email_change = COALESCE(email_change, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        updated_at = now()
    WHERE id = uid;
  END IF;

  INSERT INTO public.profiles (id, name, username)
  VALUES (uid, 'Swastik Baniya', owner_username)
  ON CONFLICT (id) DO UPDATE SET name = 'Swastik Baniya', username = owner_username;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'owner') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.claim_owner()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
DECLARE uemail text;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT lower(email) INTO uemail FROM auth.users WHERE id = uid;
  IF uemail NOT IN ('swastikbaniyabhai@gmail.com', 'swastikbaniya@boardbuddy.app') THEN
    RETURN false;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'owner'
      AND ur.user_id <> uid
      AND lower(u.email) NOT IN ('swastikbaniyabhai@gmail.com', 'swastikbaniya@boardbuddy.app')
  ) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'owner') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.claim_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(_username))
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(_username)) || '@boardbuddy.app'
  );
$$;

REVOKE ALL ON FUNCTION public.username_available(text) FROM public;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated, service_role;

-- ============ PLANS ============
CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  tagline text,
  price_paise integer NOT NULL,
  duration_days integer NOT NULL,
  tier text NOT NULL DEFAULT 'pro',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads plans" ON public.plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update plans" ON public.plans FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete plans" ON public.plans FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER plans_touch BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.plans (id, name, tagline, price_paise, duration_days, tier, features, sort) VALUES
('trial3', 'Starter', '3 days full access', 4900, 3, 'pro',
 '["3D models library","Concept videos","Ad-free experience","All mock tests","NCERT solutions"]'::jsonb, 1),
('month1', 'Monthly', '1 month full access', 49900, 30, 'pro',
 '["3D models library","Concept videos","Ad-free experience","All mock tests","NCERT solutions","Progress analytics"]'::jsonb, 2),
('year1', 'Yearly', '1 year — best value', 159900, 365, 'pro',
 '["3D models library","Concept videos","Ad-free experience","All mock tests","NCERT solutions","Progress analytics","Formula sheets"]'::jsonb, 3),
('maxpro', 'Max Pro', 'Everything + AI tutor', 259900, 365, 'max',
 '["Everything in Yearly","AI doubt-solving tutor","Priority support","Blue tick on your name","Early access to new features","Ad-free experience"]'::jsonb, 4);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'pending',
  amount_paise integer NOT NULL DEFAULT 0,
  razorpay_order_id text,
  razorpay_payment_id text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions (user_id, status);
CREATE UNIQUE INDEX subscriptions_order_idx ON public.subscriptions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subscriptions read" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.my_entitlement()
RETURNS TABLE (plan_id text, tier text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.plan_id, p.tier, s.expires_at
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = auth.uid()
    AND s.status = 'active'
    AND s.expires_at > now()
  ORDER BY (p.tier = 'max') DESC, s.expires_at DESC
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.my_entitlement() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_entitlement() TO authenticated;

CREATE OR REPLACE FUNCTION public.verified_users()
RETURNS TABLE (user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT s.user_id
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.status = 'active' AND s.expires_at > now() AND p.tier = 'max'
$$;
REVOKE ALL ON FUNCTION public.verified_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verified_users() TO anon, authenticated;

-- ============ 3D MODELS & VIDEOS ============
CREATE TABLE public.study_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL DEFAULT 'science',
  chapter text,
  description text,
  kind text NOT NULL DEFAULT 'glb',
  src_url text NOT NULL,
  poster_url text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_premium boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_models TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_models TO authenticated;
GRANT ALL ON public.study_models TO service_role;
ALTER TABLE public.study_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff insert models" ON public.study_models FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update models" ON public.study_models FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete models" ON public.study_models FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER study_models_touch BEFORE UPDATE ON public.study_models FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SECURE KEYS (owner panel -> server only) ============
CREATE TABLE public.secure_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.secure_settings TO service_role;
ALTER TABLE public.secure_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_secure_setting(_key text, _value text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RETURN false; END IF;
  IF _key IS NULL OR btrim(_key) = '' THEN RETURN false; END IF;
  IF _value IS NULL OR btrim(_value) = '' THEN
    DELETE FROM public.secure_settings WHERE key = btrim(_key);
    RETURN true;
  END IF;
  INSERT INTO public.secure_settings (key, value, updated_by, updated_at)
  VALUES (btrim(_key), _value, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now();
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.set_secure_setting(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_secure_setting(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.secure_setting_keys()
RETURNS TABLE (key text, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RETURN; END IF;
  RETURN QUERY SELECT s.key, s.updated_at FROM public.secure_settings s ORDER BY s.key;
END; $$;
REVOKE ALL ON FUNCTION public.secure_setting_keys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.secure_setting_keys() TO authenticated;

CREATE OR REPLACE FUNCTION public.payments_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.secure_settings WHERE key = 'razorpay_key_id')
     AND EXISTS (SELECT 1 FROM public.secure_settings WHERE key = 'razorpay_key_secret')
$$;
REVOKE ALL ON FUNCTION public.payments_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payments_ready() TO anon, authenticated;

-- ============ SAMPLE LIBRARY ============
INSERT INTO public.study_models (title, subject, chapter, description, kind, src_url, poster_url, tags, is_premium, sort) VALUES
('Human Heart', 'biology', 'Life Processes', 'Rotate the heart to explore the four chambers, valves and the path of blood flow.', 'embed', 'https://sketchfab.com/models/168b474fba564f688048212e99b4159d/embed?autospin=0.3&preload=1&ui_theme=dark', NULL, '["heart","circulation","organ"]'::jsonb, true, 1),
('DNA Double Helix', 'biology', 'Heredity and Evolution', 'The double helix with base pairs — drag to rotate, scroll to zoom.', 'embed', 'https://sketchfab.com/models/6a1e2c1cd47f4d64b1e3a4a2b3c4d5e6/embed?autospin=0.5&preload=1&ui_theme=dark', NULL, '["dna","genetics","helix"]'::jsonb, true, 2),
('Human Skeleton', 'biology', 'Life Processes', 'Full skeletal system — study bone names and joints in 3D.', 'embed', 'https://sketchfab.com/models/3f1a1d3e0a1c4a6e9c9b4f0e2b5a7c8d/embed?autospin=0.3&preload=1&ui_theme=dark', NULL, '["skeleton","bones"]'::jsonb, true, 3),
('Water Molecule (H₂O)', 'chemistry', 'Chemical Reactions and Equations', 'Bent geometry of water with its 104.5° bond angle.', 'glb', 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb', NULL, '["molecule","bonding"]'::jsonb, true, 4),
('Combustion of Methane', 'chemistry', 'Chemical Reactions and Equations', 'CH₄ + 2O₂ → CO₂ + 2H₂O — watch the bonds break and reform.', 'video', 'https://www.youtube.com/embed/gCDPKQdWLBs', NULL, '["reaction","combustion"]'::jsonb, true, 5),
('Projectile Motion', 'physics', 'Motion', 'How angle, speed and gravity change the trajectory of a projectile.', 'video', 'https://www.youtube.com/embed/BLuI--jaeIY', NULL, '["motion","kinematics"]'::jsonb, true, 6);

CREATE POLICY "Anyone reads published models" ON public.study_models FOR SELECT TO anon USING (published);
CREATE POLICY "Members read models" ON public.study_models FOR SELECT TO authenticated USING (published OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Read published solutions" ON public.ncert_solutions;
CREATE POLICY "Anyone reads published solutions" ON public.ncert_solutions FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Members read solutions" ON public.ncert_solutions FOR SELECT TO authenticated USING (status = 'published' OR public.is_staff(auth.uid()));