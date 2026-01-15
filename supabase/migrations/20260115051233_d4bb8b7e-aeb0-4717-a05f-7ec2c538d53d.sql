-- Ajouter la politique RLS pour permettre les mises à jour sur purchased_upgrades
CREATE POLICY "Anyone can update purchased_upgrades"
ON public.purchased_upgrades
FOR UPDATE
USING (true)
WITH CHECK (true);