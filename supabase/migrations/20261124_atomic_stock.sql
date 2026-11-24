-- Атомарное изменение остатков.
-- Клиент больше не присылает абсолютное quantity при продаже/долге/приходе —
-- только дельту. Сервер применяет её к текущему значению в одной транзакции,
-- поэтому устаревшая вкладка не может «вернуть» старый остаток.
-- Выполнить один раз: Supabase → SQL Editor → вставить → Run.

create or replace function public.adjust_product_stock(p_moves jsonb)
returns setof public.products
language plpgsql
as $$
declare
  m jsonb;
  d integer;
  r public.products;
begin
  for m in select * from jsonb_array_elements(p_moves) loop
    d := (m->>'delta')::integer;

    update public.products p
       set quantity = p.quantity + d,
           status = case
                      when p.quantity + d <= 0 then 'out-of-stock'
                      when p.quantity + d < 20 then 'low-stock'
                      else 'in-stock'
                    end,
           history = case
                       when m ? 'entry' and m->'entry' <> 'null'::jsonb
                         then jsonb_build_array(m->'entry') || coalesce(p.history, '[]'::jsonb)
                       else p.history
                     end
     where p.id = (m->>'id')::uuid
       and p.quantity + d >= 0
     returning p.* into r;

    if not found then
      -- откатывает всю транзакцию, включая уже применённые движения из p_moves
      raise exception 'insufficient_stock:%', m->>'id' using errcode = 'P0001';
    end if;

    return next r;
  end loop;
end;
$$;

grant execute on function public.adjust_product_stock(jsonb) to anon, authenticated;
