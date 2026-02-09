-- Drop existing SELECT policy for robots
DROP POLICY IF EXISTS "Everyone can view active robots" ON public.robots;

-- Create updated policy: active robots visible to all, inactive robots visible to admins and users with active investments
CREATE POLICY "Everyone can view active robots" 
ON public.robots 
FOR SELECT 
USING (
  is_active = true 
  OR is_admin() 
  OR EXISTS (
    SELECT 1 FROM public.investments 
    WHERE investments.robot_id = robots.id 
    AND investments.user_id = auth.uid() 
    AND investments.status = 'active'
  )
);