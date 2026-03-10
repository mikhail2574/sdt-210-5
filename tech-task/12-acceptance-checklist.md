# Acceptance checklist (MVP готовность)

## Executive summary

Этот чеклист — финальное «да/нет» перед демо клиенту и перед первым onboarding.

## Functional (public portal)
- [ ] Wizard работает по шагам для всех MVP forms (hausanschluss/leistungserhöhung/stilllegung/bankdaten).
- [ ] Draft создается после 1-го шага и сохраняется в БД.
- [ ] Autosave на каждом переходе шага.
- [ ] Required блокирует переход, ошибки видны сверху и у поля.
- [ ] Soft_required: предупреждение при переходе, можно skip; подсветка + список полей.
- [ ] Summary перед submit показывает missing (soft + attachments).
- [ ] Consent step: все required чекбоксы обязательны.
- [ ] Submit:
  - [ ] выдает креденшлы (tracking+password)
  - [ ] отправляет email (outbox→sent)
  - [ ] ставит статус SUBMITTED_INCOMPLETE если есть soft_missing
- [ ] Login Endkunde по tracking+password.
- [ ] Endkunde может дозаполнить и довести до SUBMITTED_COMPLETE.
- [ ] PDF download доступен и файл валиден.

## Functional (backoffice)
- [ ] Staff login.
- [ ] Applications list:
  - [ ] фильтры статус/форма/медиа/unread/date
  - [ ] сортировка по дате
- [ ] Notification bell:
  - [ ] показывает unread count
  - [ ] кликабельно ведет к заявке
- [ ] Detail readable view.
- [ ] Edit mode:
  - [ ] сохраняет изменения
  - [ ] пишет audit log
  - [ ] UI показывает «изменено сотрудником»
- [ ] Original vs changed toggle работает.
- [ ] Status transitions работают по правам.
- [ ] Appointment scheduling:
  - [ ] создает appointment
  - [ ] email customer queued/sent
- [ ] Export:
  - [ ] PDF per application
  - [ ] CSV за период

## Non-functional
- [ ] Multi-tenant isolation: тесты подтверждают отсутствие утечек.
- [ ] i18n: de/en/tr/es, смена языка без потери данных.
- [ ] A11y: axe 0 serious/critical на ключевых страницах.
- [ ] Responsive + 200% zoom usable.
- [ ] Retention jobs:
  - [ ] drafts удаляются через 2 дня inactivity
  - [ ] submitted incomplete удаляются через 1 месяц inactivity
  - [ ] completed retention 10 лет (настройка/политика)
- [ ] CI/CD: pipeline green, deploy reproducible.
- [ ] Docker: локальный запуск по инструкции.

## Документация
- [ ] Все 15 md файлов присутствуют в repo.
- [ ] README с local run + env vars.
- [ ] Seed demo tenant + demo users.
