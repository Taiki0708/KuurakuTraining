-- ServeUp Training catalog unification.
-- Non-destructive: original course rows and all related history remain in place.
begin;

do $unify$
begin
  if to_regclass('public.courses') is null then
    raise notice 'Legacy course catalog is not installed; unified training tables remain the source of training courses.';
    return;
  end if;

  execute $catalog$
    insert into public.courses (id, sort_order, is_active)
    values
      ('restaurant-orientation', 1, true),
      ('hygiene-food-safety', 2, true),
      ('guest-service-basics', 3, true),
      ('workplace-communication', 4, true),
      ('allergies-dietary', 5, true),
      ('safety-emergency', 6, true),
      ('order-serving-payment', 7, true),
      ('complaints-difficult', 8, true)
    on conflict (id) do update set
      sort_order = excluded.sort_order,
      is_active = true
  $catalog$;

  -- Keep original rows for foreign-key compatibility and historical reporting,
  -- but do not present them as separate learner courses after unification.
  execute $catalog$
    update public.courses
    set is_active = false
    where id in ('customer-service', 'food-safety', 'japanese-hospitality', 'restaurant-basics')
  $catalog$;
end;
$unify$;

commit;
