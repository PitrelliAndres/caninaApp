## 1) Resumen
Autenticación con rutas públicas, acciones protegidas, retorno a la intención original y onboarding previo. Diferenciación automática DEV/PROD.

## 2) Backend (Flask)
```py
IS_DEVELOPMENT = os.environ.get('FLASK_ENV') == 'development'
IS_PRODUCTION  = os.environ.get('FLASK_ENV') == 'production'
```
- DEV: TTL amplio y validación relajada.
- PROD: TTL 10–15 min; validar `iss/aud/exp/nbf`; blacklist/jti opcional; logs sin PII.
- Datos públicos limitados para anónimos.

## 3) Frontend (Next.js)
**Middleware**: `/` pública; protegidas `/profile`, `/my-visits`, `/matches`, `/chats`, `/admin`. CSP/HSTS en PROD.

**Hooks**
- `useAuth()` → `{ isAuthenticated, user, requireAuth, requireAuthForAction }`
- `useProtectedActions()` → `{ visitActions, matchActions, chatActions, profileActions }`
- `usePublicData()` → filtra datasets según auth.

## 4) Flujo
1. Anónimo en `/` → parques limitados.
2. Acción protegida → redirect a `/login?redirect=...&action=...`.
3. Login Google → si **onboarded**, vuelve a `redirect`; si no, `/onboarding`.
4. Completa onboarding → redirección a intención original.

## 5) Componentes
- Botón de visita (CTA según estado: anónimo / onboarding / listo).
- Modal de registro con validaciones de auth integradas.

## 6) ENV
**Backend**
```env
FLASK_ENV=development
STRICT_JWT_VALIDATION=false
ENABLE_TOKEN_BLACKLIST=false
REQUIRE_HTTPS=false
```
**Frontend**
```env
NEXT_PUBLIC_STRICT_JWT_VALIDATION=false
NEXT_PUBLIC_SECURITY_LOGGING=false
NEXT_PUBLIC_LIMIT_PUBLIC_DATA=false
NEXT_PUBLIC_SESSION_TIMEOUT=120
```

## 7) DEV vs PROD
| Aspecto | DEV | PROD |
|---|---|---|
| Token TTL | 2h | 10–15 min |
| Validación | Relajada | Estricta (`iss/aud/exp/nbf`) |
| Blacklist | Off | On |
| HTTPS | Opcional | Requerido |
| Datos públicos | Más amplios | Limitados |
| Security logging | Opt‑in | On |
| Headers | Básicos | CSP/HSTS |

## 8) Testing del flujo
- Redirect correcto, persistencia de intención, onboarding gating y regreso.

---