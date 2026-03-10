# Accessibility compliance spec (WCAG 2.2 + Germany BFSG/BFSGV + EN 301 549)

## Executive summary

Цель: формальная, честная, проверяемая доступность Kundenportal (и ключевых частей backoffice) для немецкого рынка.
Baseline:
- WCAG 2.2 Level AA как целевой уровень.
- EN 301 549 как европейская норма требований к ICT.
- BFSG/BFSGV: обязательность доступности для соответствующих цифровых услуг с 28.06.2025.

MVP обязан:
- проходить автоматические a11y проверки (axe) без critical/serious,
- проходить ручные проверки keyboard-only и screen reader smoke,
- иметь Barrierefreiheitserklärung страницу.

## Deliverables
- чеклист требований по категориям
- таблица WCAG 2.2 критериев (релевантные для форм)
- автоматические тесты (axe)
- ручные тесты (keyboard/screen reader)
- acceptance criteria

## Нормативные опоры (кратко)
- BFSG/BFSGV: требования доступности для продуктов/услуг и дата применения.
- WCAG 2.2: критерии успеха и conformance.
- EN 301 549: технические требования для ICT (web и non-web документы).

## Инженерные требования (MVP)

### Навигация и управление (keyboard)
- все интерактивные элементы доступны с Tab/Shift+Tab
- логический порядок фокуса соответствует визуальному порядку
- нет ловушек фокуса (кроме корректного modal trap)
- stepper доступен: можно перейти к предыдущим шагам, текущий шаг отмечен

### Focus visibility
- контрастный focus ring
- focus не перекрыт фиксированными панелями (учесть WCAG 2.2 Focus Not Obscured)

### Формы
- каждое поле имеет связанную label (не placeholder)
- required/soft_required обозначены не только цветом (иконка + текст)
- ошибки:
  - page-level summary
  - field-level message
  - aria-live для обновления ошибок
- подтверждение email (двойное поле) — ошибка понятная и доступная

### Цвет/контраст/скейл
- контраст текста/иконок минимум AA
- UI корректно работает при browser zoom 200%
- элементы управления достаточного размера (target size)

### File upload
- доступный control (кнопка/label)
- статус загрузки доступен screen reader’у
- ошибки типа/размера сообщаются текстом

### Мультиязычность
- смена языка доступна клавиатурой
- lang атрибут на html обновляется
- направление текста (LTR) — по языку

### Документы PDF
- PDF generation не должен ломать доступность web UI.
(Доступность PDF как tagged PDF — НЕ требуется в MVP, но заложить как future.)

### Barrierefreiheitserklärung
- отдельная страница, описывает:
  - уровень соответствия
  - известные ограничения
  - контакт для жалоб/feedback

## WCAG 2.2 AA: релевантные критерии (MVP checklist)

Таблица: критерий → как реализуем → как тестируем.

| WCAG | Что значит | Реализация | Тест |
|---|---|---|---|
| 1.1.1 | текстовые альтернативы | alt для logo/иконок | axe + manual |
| 1.3.1 | семантика | правильные labels, fieldsets, legends | axe + screen reader smoke |
| 1.3.2 | meaningful sequence | DOM порядок соответствует layout | manual keyboard |
| 1.4.1 | не только цвет | ошибки/soft_required имеют текст | manual |
| 1.4.3 | контраст | palette constraints | automated contrast check + manual |
| 1.4.10 | reflow | responsive layout, no horizontal scroll | manual resize |
| 1.4.12 | text spacing | не ломать при увеличении межстрочных | manual |
| 2.1.1 | keyboard | все доступно | manual |
| 2.4.3 | focus order | шаги и поля | manual |
| 2.4.7 | focus visible | видим всегда | manual |
| 2.4.11 | focus not obscured | фикс header не перекрывает | manual |
| 2.5.8 | target size | кнопки/клики | manual |
| 3.3.1 | error identification | понятные ошибки | manual |
| 3.3.2 | labels/instructions | подсказки, required | manual |
| 3.3.3 | error suggestion | предложения исправления | manual |
| 4.1.2 | name/role/value | корректные компоненты | axe |

## Автоматические тесты (обязательные)

- Playwright + axe:
  - ключевые страницы Kundenportal (каждый шаг, summary, final)
  - backoffice login/list/detail
- Threshold:
  - 0 critical
  - 0 serious
  - minor/moderate допускаются только с ticket и планом исправления (в MVP лучше 0).

## Ручные тесты (обязательные)

### Keyboard-only
- пройти весь wizard:
  - заполнить required
  - получить soft_required warning
  - submit
  - login по креденшлам
- backoffice:
  - login
  - открыть заявку
  - edit mode + save

### Screen reader smoke (NVDA/JAWS/VoiceOver — минимум 1)
- прочитать структуру заголовков
- понять ошибки (summary + поле)
- загрузить файл
- сменить язык

## Acceptance criteria (a11y)
- Все критерии таблицы соблюдены.
- Автотесты проходят.
- Ручные тесты пройдены и задокументированы в 12-acceptance-checklist.md.
