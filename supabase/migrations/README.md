# Database migration history

Production project `rirgsoufkldfcogfjwwy` is represented locally by:

1. [`../baseline/production_schema.sql`](../baseline/production_schema.sql), a complete schema baseline generated from the live Postgres catalog on 2026-08-06.
2. Timestamped migrations created after that baseline.
3. This manifest of the production migration ledger.

The historical migration bodies before the baseline are intentionally squashed into the baseline. Do not replay the historical ledger and the baseline together.

## Recreate a database

1. Create or start a fresh Supabase project.
2. Apply `supabase/baseline/production_schema.sql` with `psql -v ON_ERROR_STOP=1`.
3. Apply every migration whose timestamp is later than the baseline generation point.
4. Configure Auth providers, Edge Function secrets, Realtime settings, and deploy the functions; these are not database schema objects.
5. Run `supabase/baseline/verify_schema.sql`.

## Production migration ledger

| Version        | Name                                                                |
| -------------- | ------------------------------------------------------------------- |
| 20250610020544 | `create_templates_system`                                           |
| 20250612110952 | `add_total_and_currency_to_templates`                               |
| 20250701032554 | `add_name_to_template_categories`                                   |
| 20250702022355 | `expense_system_rename`                                             |
| 20250729031958 | `add_unique_category_constraint`                                    |
| 20250729033212 | `remove_system_categories_complete`                                 |
| 20250804013354 | `create_plans_system`                                               |
| 20250804024730 | `fix_plans_rls_recursion`                                           |
| 20250804024752 | `fix_plan_items_rls_policies`                                       |
| 20250804025023 | `fix_rls_recursion_complete`                                        |
| 20250804025057 | `fix_remaining_recursion`                                           |
| 20250804025105 | `create_ownership_function`                                         |
| 20250812033854 | `convert_categories_schema_part1`                                   |
| 20250812033906 | `drop_expense_categories_rls_policies`                              |
| 20250812033912 | `remove_owner_id_and_setup_global_categories`                       |
| 20250812033919 | `setup_categories_read_only_policies`                               |
| 20250812033931 | `populate_predefined_categories`                                    |
| 20250812095108 | `critical_security_fixes`                                           |
| 20250812095245 | `performance_optimizations`                                         |
| 20250812095354 | `audit_logging_and_cleanup`                                         |
| 20250812095437 | `fix_view_security_definer`                                         |
| 20250812101133 | `20250812_security_rls_hardening_and_rpc`                           |
| 20250812101232 | `20250812_add_rpcs_for_shared_users_lists`                          |
| 20250812103059 | `20250812_remove_audit_log_triggers_and_objects`                    |
| 20250812103356 | `20250812_rls_auth_uid_select_wrapping`                             |
| 20250812103854 | `20250812_expense_categories_split_policies_and_plan_shares_unique` |
| 20250818031016 | `add_icon_column_to_expense_categories`                             |
| 20250826025603 | `create_expenses_table`                                             |
| 20250826025613 | `create_expense_summary_function`                                   |
| 20250826040916 | `fix_plans_rls_policies`                                            |
| 20250826040930 | `update_plans_update_policy`                                        |
| 20250826040936 | `update_plans_delete_policy`                                        |
| 20250826040956 | `fix_plan_items_rls_policies`                                       |
| 20250827010023 | `add_plan_status_auto_calculation`                                  |
| 20250913054306 | `remove_expense_description_column`                                 |
| 20250923020832 | `add_is_completed_to_plan_items`                                    |
| 20250923115135 | `add_plan_item_id_to_expenses`                                      |
| 20250923115232 | `add_plan_item_tracking_functions`                                  |
| 20250923121031 | `create_plan_items_tracking_view`                                   |
| 20250930122948 | `remove_unique_expense_name_constraint`                             |
| 20251004071513 | `convert_darkmode_to_theme_preference`                              |
| 20251004085806 | `allow_delete_update_expenses_in_shared_plans`                      |
| 20251016124859 | `add_currency_fields_to_expenses`                                   |
| 20251124113942 | `fix_template_shares_cascade_delete`                                |
| 20260107160959 | `add_notifications`                                                 |
| 20260108155555 | `remove_notifications`                                              |
| 20260220150203 | `migrate_eva_icons_to_ionicons`                                     |
| 20260220150725 | `revert_ionicons_to_eva_icons`                                      |
| 20260406133938 | `reintroduce_notifications_system`                                  |
| 20260411084025 | `fix_notifications_soft_delete_rls`                                 |
| 20260411093714 | `harden_supabase_permissions`                                       |
| 20260411094031 | `fix_search_users_for_sharing_ambiguity`                            |
| 20260417080544 | `security_review_hardening`                                         |
| 20260502140405 | `add_legacy_search_users_for_sharing_overload`                      |
| 20260711145641 | `add_atomic_entity_and_expense_transactions`                        |
| 20260711145736 | `add_bounded_expense_overviews`                                     |
| 20260711145930 | `restrict_new_rpc_execution_to_authenticated`                       |
| 20260806172018 | `architecture_hardening`                                            |
| 20260806172029 | `atomic_domain_workflows`                                           |
| 20260806173839 | `advisor_index_cleanup`                                             |
