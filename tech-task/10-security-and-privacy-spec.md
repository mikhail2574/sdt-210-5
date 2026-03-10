# Security & privacy spec (MVP)

## Executive summary

MVP обрабатывает чувствительные данные (PII + bank details + attachments). Требования:
- строгая multi-tenant изоляция
- безопасное хранение паролей
- защита сессий/JWT
- rate limiting
- audit log для staff edits
- минимизация данных (GDPR)
- retention: draft cleanup, incomplete cleanup, completed 10 years (founder requirement)

## Deliverables
- auth модели (staff + customer)
- password policy
- session/JWT policy
- data classification
- encryption at rest/in transit
- file upload security
- audit logging
- retention & deletion rules
- security тесты

## Auth

### Staff
- email + password
- MFA не требуется в MVP, но архитектурно предусмотреть (future)

### Customer (Endkunde)
- trackingCode + password после submit
- рекомендация: пароль временный (TTL 24h) + forced change на первом входе

## Password storage (обязательное)
- Argon2id (рекомендация параметров минимум как в OWASP; tuning по infra)
- уникальная соль
- ограничение attempts + lockout + captcha после N failed (MVP: rate limit)

## Sessions / JWT
- Access token short-lived (15 min)
- Refresh token (14 days) с rotation
- Idle timeout 14 days (founder preference) — допустимо при refresh rotation

## Rate limiting (обязательное)
- /auth/login: строгий лимит по IP + по account
- /public/auth/login: строгий лимит
- /attachments:presign: лимит чтобы не DDoS storage

## Multi-tenant isolation (обязательное)
- server-side checks на каждом запросе:
  - tenantId из token/membership
  - applicationId принадлежит tenantId
- запрет IDOR:
  - нельзя получить чужой application по id
- рекомендовано:
  - интеграционные тесты для tenant breakout
  - (опция) Postgres RLS

## Data classification

### Sensitive
- bank details (IBAN/BIC)
- passwords (hash)
- attachments (документы)
- PII (имя, адрес, email, телефон)

### Handling
- шифрование at rest: RDS + S3 SSE (AWS default, with KMS)
- in transit: TLS everywhere, HSTS
- logs: никогда не логировать PII полностью и никогда не логировать bank details

## Bank details security (рекомендация)
- В MVP можно хранить IBAN/BIC в Postgres в зашифрованном виде (application-level encryption):
  - envelope encryption с KMS
  - или libsodium secretbox с ключом из Secrets Manager
- Если не успеваем: минимум шифрование at rest + строгие ACL + masking в UI/logs.

## File upload security
- presigned URL с ограниченным временем жизни
- фиксированный key namespace tenant/application/category
- проверка mimeType и sizeBytes на backend до выдачи presign
- (опционально) антивирус скан (future)

## Audit logging (обязательное)
- Логировать только staff edits:
  - кто изменил
  - когда
  - какое поле
  - old/new
  - reason (желательно)
- UI показывает «изменено сотрудником»

## Consent
- хранить consent flags + consentVersion + timestamp + language
- consent обязателен перед submit

## Retention & deletion
- DRAFT: удалить через 2 дня inactivity
- SUBMITTED_INCOMPLETE: удалить через 1 месяц inactivity
- COMPLETED: хранить 10 лет
- требования реализовать через background job

## Security testing (минимум)
- dependency scanning (npm audit / osv)
- SAST (CodeQL)
- API tests на:
  - auth brute force (rate limit)
  - tenant isolation
  - CSRF (если cookies)
  - XSS (sanitize)
- OWASP ASVS L1/L2 subset checklist (для веб-форм)
