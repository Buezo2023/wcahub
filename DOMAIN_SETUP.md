# Setup de dominio propio para WCA Hub

## Cuando comprés el dominio, seguí estos pasos en orden:

### 1. Resend — email transaccional (invitaciones, confirmaciones)

1. Entrá a https://resend.com → Domains → Add Domain
2. Ingresá tu dominio (ej: worldconnectacademy.com)
3. Resend te va a dar 3 registros DNS para agregar:
   - TXT record (verificación SPF)
   - CNAME record (DKIM)
   - MX record (opcional)
4. En tu registrador (Namecheap, GoDaddy, etc) → DNS → agregar esos 3 registros
5. Volvé a Resend → verificar → esperar ~5 minutos → aparece ✓ Verified
6. En Vercel → Settings → Environment Variables → editar:
   - RESEND_FROM_EMAIL = no-reply@worldconnectacademy.com
7. Redeploy → listo. Emails salen con tu marca.

### 2. Mailrelay — emails masivos a estudiantes

1. En Mailrelay → Autenticación de Email → agregar dominio
2. Mismo proceso: agregar registros DNS que te dé Mailrelay (SPF + DKIM)
3. En Vercel → Environment Variables:
   - MAILRELAY_FROM_EMAIL = noticias@worldconnectacademy.com (o el que prefieras)

### 3. Supabase Auth — redirect URL de login

1. En Supabase → Authentication → URL Configuration
2. Site URL: https://worldconnectacademy.com
3. Redirect URLs: agregar https://worldconnectacademy.com/auth/callback

### 4. Vercel — dominio personalizado

1. En Vercel → tu proyecto → Settings → Domains
2. Add Domain → worldconnectacademy.com
3. Vercel te da un registro DNS (CNAME o A record)
4. Agregarlo en tu registrador
5. ~10 minutos → wcahub.vercel.app se puede seguir usando pero
   worldconnectacademy.com también apunta al mismo proyecto

### 5. Variables de entorno finales en Vercel

RESEND_FROM_EMAIL=no-reply@worldconnectacademy.com
MAILRELAY_FROM_EMAIL=noticias@worldconnectacademy.com
VITE_APP_URL=https://worldconnectacademy.com

### Registradores recomendados
- Namecheap.com → más barato (~$9/año para .com)
- Google Domains → fácil de usar
- GoDaddy → más conocido pero más caro

### Tiempo total de setup: ~15 minutos
