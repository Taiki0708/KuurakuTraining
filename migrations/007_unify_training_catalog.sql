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
    insert into public.courses (id, title, description, sort_order, is_active)
    values
      ('restaurant-orientation', 'Restaurant Orientation', 'Store basics, appearance, attendance and everyday work rules.', 1, true),
      ('hygiene-food-safety', 'Hygiene & Food Safety', 'Personal hygiene, food storage, cross-contamination and cleaning.', 2, true),
      ('guest-service-basics', 'Guest Service Basics', 'Greetings, guest guidance, serving and thoughtful hospitality.', 3, true),
      ('workplace-communication', 'Workplace Communication', 'Reporting, confirming instructions, asking questions and teamwork.', 4, true),
      ('allergies-dietary', 'Allergies & Dietary Requirements', 'Safe escalation of allergy, dietary and religious requirements.', 5, true),
      ('safety-emergency', 'Safety & Emergency', 'Fire, injury, burns, falls, earthquakes and emergency reporting.', 6, true),
      ('order-serving-payment', 'Order, Serving & Payment', 'Orders, table checks, serving, clearing and payment.', 7, true),
      ('complaints-difficult', 'Complaints & Difficult Situations', 'Delays, mistakes, complaints, escalation and apologies.', 8, true)
    on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
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
