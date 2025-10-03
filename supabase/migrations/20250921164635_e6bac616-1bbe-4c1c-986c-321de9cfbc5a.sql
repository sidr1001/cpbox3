-- Get the user ID for sidr1001@gmail.com
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Get user ID for sidr1001@gmail.com
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'sidr1001@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Insert superadmin role for this user
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_uuid, 'superadmin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Superadmin role assigned to user: %', user_uuid;
    ELSE
        RAISE NOTICE 'User sidr1001@gmail.com not found';
    END IF;
END $$;