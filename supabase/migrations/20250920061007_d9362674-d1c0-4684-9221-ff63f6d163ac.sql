-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'superadmin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create user management table
CREATE TABLE public.user_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  work_hours_start TIME,
  work_hours_end TIME,
  service_rate DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_management
ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;

-- Create user balance table
CREATE TABLE public.user_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_balance
ALTER TABLE public.user_balance ENABLE ROW LEVEL SECURITY;

-- Create site settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'Social Media Scheduler',
  site_title TEXT NOT NULL DEFAULT 'Social Media Scheduler',
  site_description TEXT,
  seo_keywords TEXT,
  admin_url TEXT DEFAULT '/admin',
  payment_methods JSONB DEFAULT '["card", "bank_transfer"]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Insert default site settings
INSERT INTO public.site_settings (
  site_name, 
  site_title, 
  site_description,
  seo_keywords
) VALUES (
  'Social Media Scheduler',
  'Social Media Scheduler - Автоматизация публикаций',
  'Планируйте и публикуйте контент в социальных сетях автоматически',
  'социальные сети, автопостинг, планировщик, контент'
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Superadmins can manage all roles" ON public.user_roles
FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for user_management
CREATE POLICY "Superadmins can manage all users" ON public.user_management
FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Users can view their own management data" ON public.user_management
FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for user_balance
CREATE POLICY "Users can view their own balance" ON public.user_balance
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all balances" ON public.user_balance
FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

-- RLS Policies for site_settings
CREATE POLICY "Superadmins can manage site settings" ON public.site_settings
FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Everyone can view site settings" ON public.site_settings
FOR SELECT USING (true);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can manage their own transactions" ON public.payment_transactions
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view all transactions" ON public.payment_transactions
FOR SELECT USING (public.get_user_role(auth.uid()) = 'superadmin');

-- Update triggers
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_management_updated_at
BEFORE UPDATE ON public.user_management
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balance_updated_at
BEFORE UPDATE ON public.user_balance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to create user_balance and user_management records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  INSERT INTO public.user_balance (user_id, balance)
  VALUES (new.id, 0.00);

  INSERT INTO public.user_management (user_id)
  VALUES (new.id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;