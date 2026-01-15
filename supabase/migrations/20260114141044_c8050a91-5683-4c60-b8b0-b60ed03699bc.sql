-- Create player_accounts table to store money and income rate
CREATE TABLE public.player_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
    income_per_second DECIMAL(15, 4) NOT NULL DEFAULT 0.01,
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create upgrades table
CREATE TABLE public.upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(20, 2) NOT NULL,
    income_boost DECIMAL(15, 4) NOT NULL,
    icon TEXT NOT NULL DEFAULT 'trending-up',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchased_upgrades table
CREATE TABLE public.purchased_upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.player_accounts(id) ON DELETE CASCADE NOT NULL,
    upgrade_id UUID REFERENCES public.upgrades(id) ON DELETE CASCADE NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(account_id, upgrade_id)
);

-- Enable RLS (but allow all for this game - no auth needed)
ALTER TABLE public.player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_upgrades ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for player_accounts
CREATE POLICY "Anyone can read player_accounts" ON public.player_accounts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert player_accounts" ON public.player_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update player_accounts" ON public.player_accounts FOR UPDATE USING (true);

-- Public read policy for upgrades
CREATE POLICY "Anyone can read upgrades" ON public.upgrades FOR SELECT USING (true);

-- Public policies for purchased_upgrades
CREATE POLICY "Anyone can read purchased_upgrades" ON public.purchased_upgrades FOR SELECT USING (true);
CREATE POLICY "Anyone can insert purchased_upgrades" ON public.purchased_upgrades FOR INSERT WITH CHECK (true);

-- Insert default upgrades
INSERT INTO public.upgrades (name, description, cost, income_boost, icon, sort_order) VALUES
('Compte Épargne', 'Ouvrir un compte épargne avec intérêts', 100.00, 0.05, 'piggy-bank', 1),
('Actions Tech', 'Investir dans les géants de la tech', 500.00, 0.25, 'trending-up', 2),
('Immobilier', 'Acheter un appartement à louer', 2500.00, 1.50, 'building', 3),
('Crypto Mining', 'Miner des cryptomonnaies', 10000.00, 5.00, 'cpu', 4),
('Startup', 'Lancer votre propre startup', 50000.00, 25.00, 'rocket', 5),
('Hedge Fund', 'Créer un fonds d''investissement', 250000.00, 150.00, 'bar-chart', 6),
('Empire', 'Construire un empire financier', 1000000.00, 750.00, 'crown', 7);

-- Enable realtime for player_accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_accounts;