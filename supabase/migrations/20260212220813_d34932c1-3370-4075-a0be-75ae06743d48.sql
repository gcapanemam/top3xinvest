
CREATE OR REPLACE FUNCTION public.finalize_expired_investments(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  v_profit NUMERIC;
  v_daily_grouped RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR inv IN
    SELECT i.id, i.amount, i.robot_id, i.user_id
    FROM investments i
    WHERE i.status = 'active'
      AND i.lock_until < now()
      AND (p_user_id IS NULL OR i.user_id = p_user_id)
    FOR UPDATE OF i
  LOOP
    -- Calculate profit from robot_operations (same logic as frontend)
    v_profit := 0;
    IF inv.robot_id IS NOT NULL THEN
      SELECT COALESCE(SUM(daily_pct), 0) INTO v_profit
      FROM (
        SELECT SUM(ro.profit_percentage) AS daily_pct
        FROM robot_operations ro
        WHERE ro.robot_id = inv.robot_id
          AND ro.profit_percentage IS NOT NULL
        GROUP BY DATE(ro.created_at)
      ) daily_totals;
      
      -- v_profit is total percentage sum, apply to amount
      v_profit := inv.amount * (v_profit / 100);
    END IF;

    -- Update investment status and profit
    UPDATE investments
    SET status = 'completed',
        profit_accumulated = v_profit,
        updated_at = now()
    WHERE id = inv.id;

    -- Credit balance: amount + profit
    UPDATE profiles
    SET balance = balance + inv.amount + v_profit,
        updated_at = now()
    WHERE user_id = inv.user_id;

    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, description, reference_id)
    VALUES (
      inv.user_id,
      'profit',
      inv.amount + v_profit,
      'Investimento finalizado - Capital + Lucro',
      inv.id
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
