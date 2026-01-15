-- Add level column to track upgrade levels (infinite upgrades)
ALTER TABLE public.purchased_upgrades 
ADD COLUMN level integer NOT NULL DEFAULT 1;

-- Add cost_multiplier and income_multiplier to upgrades table for scaling
ALTER TABLE public.upgrades 
ADD COLUMN cost_multiplier numeric NOT NULL DEFAULT 1.5,
ADD COLUMN income_multiplier numeric NOT NULL DEFAULT 1.2;