-- Renomear campo existente para min
ALTER TABLE robots RENAME COLUMN profit_percentage TO profit_percentage_min;

-- Adicionar campo max (inicialmente igual ao min)
ALTER TABLE robots 
ADD COLUMN profit_percentage_max NUMERIC NOT NULL DEFAULT 0;

-- Atualizar valores existentes (max = min para robos existentes)
UPDATE robots SET profit_percentage_max = profit_percentage_min;