# WhatsCore.AI - Maverick Edition
Versiya: v5.0.1

Bu sənəd WhatsCore.AI - Maverick Edition layihəsi haqqında ətraflı məlumat, quraşdırma təlimatları, API endpoint-ləri, edilən təkmilləşdirmələr və avtomatlaşdırılmış testlər barədə bələdçilik edir.

## 🚀 Sürətli Başlanğıc

```bash
# 1. Sistem asılılıqlarını quraşdırın
sudo apt update
sudo apt install -y chromium nodejs npm

# 2. Layihəni klonlayın
git clone https://github.com/your-username/WhatsCore.AI.git
cd WhatsCore.AI

# 3. Node.js asılılıqlarını quraşdırın
npm install

# 4. Mühit konfiqurasiyası
cp .env.example .env
# .env faylını redaktə edin

# 5. Tətbiqi başladın
bash start.sh
```

## 🔧 Sistem Tələbləri

- Node.js 16+ 
- NPM 7+
- Chromium Browser
- PM2 (qlobal quraşdırılmalı)
- Minimum 2GB RAM
- Ubuntu/Debian əsaslı sistem (tövsiyə olunur)

## 📝 Yeni Xüsusiyyətlər (v5.0.1)

### Əlavə edildi
- start.sh skriptində avtomatik Chromium aşkarlanması
- WhatsApp müştərisi başladılması zamanı xətaların idarə edilməsi
- Yeni npm skriptləri (setup, clean)
- Lazımi qovluqların avtomatik yaradılması
- Başlanğıc zamanı mühit yoxlanışı

### Düzəldildi
- start.sh skriptində SingletonLock fayl yolu
- PM2 proses idarəetməsində təkmilləşmələr
- Chromium zombie proseslərinin təmizlənməsi
- Port münaqişələrinin həlli
- Sessiya qovluq strukturu

## ⚙️ Mühit Dəyişənləri (.env)

Vacib mühit dəyişənləri:
- `PORT`: Server portu (default: 9876)
- `PUPPETEER_EXECUTABLE_PATH`: Chromium yolu
- `GROQ_API_KEYS`: API açarları (vergüllə ayrılmış)
- `SESSION_CLIENT_ID`: WhatsApp sessiya identifikatoru

## 🛠️ Problemlərin Həlli

1. WhatsApp Bağlantı Problemləri:
   - Sessiya məlumatlarını təmizləyin: `npm run clean`
   - Chromium quraşdırılmasını yoxlayın: `which chromium || which chromium-browser`
   - 9876 portunun boş olduğunu yoxlayın: `lsof -i :9876`

2. Chromium Problemləri:
   - Chromium quraşdırın: `sudo apt install chromium`
   - .env faylında düzgün yolu təyin edin
   - İcazələri yoxlayın: `ls -l $(which chromium)`

3. PM2 Problemləri:
   - PM2 proseslərini təmizləyin: `pm2 delete all`
   - Logları yoxlayın: `pm2 logs whatscore-ai`
   - Statusu izləyin: `pm2 monit`
 * API Endpoint-ləri (cURL Nümunələri ilə)
   * API Sağlamlıq və Status Yoxlamaları
   * Mesaj Göndərmə Marşrutları
   * Söhbət İdarəetmə Marşrutları
   * Kontakt İdarəetmə Marşrutları
   * Servis İdarəetmə Marşrutları
   * Klient İdarəetmə Funksiyaları
 * Təkmilləşdirmələr və Həllər (v4.3-dən v4.5.0-a)
 * Avtomatlaşdırılmış API Test Skripti
 * Problemlərin Aradan Qaldırılması (Troubleshooting)
1. Layihə Haqqında
WhatsCore.AI - Maverick Edition WhatsApp Business API üzərində qurulmuş, süni intellekt (AI) dəstəkli bir chatbot layihəsidir. Bu bot müştərilərlə avtomatlaşdırılmış şəkildə ünsiyyət qurmaq, sorğuları cavablandırmaq, məhsul və xidmətlər haqqında məlumat vermək və sifarişləri idarə etmək üçün nəzərdə tutulub. Layihə Node.js və whatsapp-web.js kitabxanası əsasında qurulmuşdur.
Məqsəd
Layihənin əsas məqsədi kiçik və orta bizneslərə WhatsApp üzərindən avtomatlaşdırılmış müştəri xidməti, satış və dəstək təmin etməkdir. Bu, insan resurslarına olan ehtiyacı azaltmaqla yanaşı, müştərilərə sürətli və effektiv cavablar verməyə kömək edir.
Əsas Xüsusiyyətlər
 * Multimodal AI Dəstəyi: Mətn, şəkil, video və səsli mesajları emal edə bilir.
 * Video Analizi: Videodan kadrlar çıxararaq AI tərəfindən vizual analizə imkan verir.
 * Səsli Mesaj Transkripsiyası: Səsli mesajları mətnə çevirir və AI tərəfindən emal edir.
 * Məhsul və Xidmət İdarəetməsi: CSV fayllarından məhsul və xidmət məlumatlarını oxuyur və AI vasitəsilə sorğuları cavablandırır.
 * Sifariş Yaratma: AI tərəfindən müştəri sorğularına əsasən sifarişlər yarada bilir.
 * API Endpoint-lər: Xarici sistemlərin botla qarşılıqlı əlaqə qurması üçün RESTful API təmin edir.
 * Çat İdarəetməsi: Söhbətləri arxivləmə, pinləmə, oxunmuş/oxunmamış kimi işarələmə.
 * Kontakt İdarəetməsi: Kontakt məlumatlarını, profil şəkillərini almaq və etiketləri idarə etmək.
2. Başlanğıc (Quraşdırma)
Tələblər
 * Node.js (v16.x və ya daha yüksək)
 * npm (Node.js ilə birlikdə gəlir)
 * FFmpeg (Video və audio emalı üçün, sisteminizdə quraşdırılmış olmalıdır)
 * Chromium-browser (WhatsApp Web üçün Puppeteer tərəfindən istifadə olunur)
 * WhatsApp hesabı (Business hesabı məhsul xüsusiyyətləri üçün tövsiyə olunur)
Quraşdırma Addımları
 * Layihəni klonlayın və ya yükləyin:
   git clone <repository_url>
cd WhatsCore.AI_4.4.0 # Layihə qovluğuna keçid

 * Asılılıqları quraşdırın:
   Layihənin kök qovluğunda (burada package.json faylı yerləşir) aşağıdakı əmri icra edin:
   npm install

Ətraf Mühit Dəyişənləri (.env)
Layihənin düzgün işləməsi üçün package.json faylının yerləşdiyi qovluqda .env adlı bir fayl yaratmalısınız. Bu fayl aşağıdakı dəyişənləri ehtiva etməlidir:
# Groq API Açar (Birdən çox açarı vergüllə ayıraraq təyin edə bilərsiniz)
GROQ_API_KEYS="YOUR_GROQ_API_KEY_1,YOUR_GROQ_API_KEY_2"

# Groq Modelləri
GROQ_CHAT_MODEL="llama3-8b-8192" # Məsələn: llama3-8b-8192, llama3-70b-8192, mixtral-8x7b-32768, gemma-7b-it
GROQ_VISION_MODEL="llama3-8b-8192" # Məsələn: llama3-8b-8192 (Groq API-də Vision modeli üçün uyğun model adı)
GROQ_TRANSCRIPTION_MODEL="whisper-large-v3" # Groq API-də audio transkripsiya üçün model adı

# WhatsApp-Web.js Session Client ID
SESSION_CLIENT_ID="whatscore_gemma_bot" # Unikal bir ID təyin edin

# Puppeteer üçün Chromium-browser yolu (Ubuntu/Debian əsaslı sistemlər üçün nümunə)
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser" # Linux üçün

# Media fayllarının müvəqqəti saxlanılacağı qovluq
MEDIA_TEMP_DIR="./media/temp"

# Mesaj buferinin boşaldılma müddəti (saniyə)
BUFFER_TIMEOUT_SECONDS=8

# Express serverinin işləyəcəyi port
PORT=9876

Qeyd: PUPPETEER_EXECUTABLE_PATH dəyişəni sizin əməliyyat sisteminizə uyğun olaraq dəyişə bilər. Məsələn, Windows-da C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe kimi bir yol ola bilər.
3. Tətbiqi İşə Salmaq
Layihənin əsas qovluğunda (burada index.js faylı yerləşir) aşağıdakı əmri icra edin:
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser && node index.js

 * Tətbiq işə düşdükdən sonra terminalda bir QR kod görəcəksiniz.
 * WhatsApp tətbiqinizdə Settings (Parametrlər) -> Linked Devices (Bağlı Cihazlar) bölməsinə keçin və bu QR kodu skan edin.
 * Uğurlu qoşulduqdan sonra botunuz mesajları qəbul etməyə hazır olacaq.
 * API serveri http://localhost:9876 ünvanında işə düşəcək.
4. API Endpoint-ləri (cURL Nümunələri ilə)
Aşağıda layihənin təqdim etdiyi API endpoint-lərinin tam siyahısı və cURL ilə istifadə nümunələri verilmişdir. Nümunələrdə istifadə olunan nömrə 994702353552@c.us olaraq qəbul edilir.
API Sağlamlıq və Status Yoxlamaları
 * API-nin işlək olub olmadığını yoxlamaq (GET /api/health):
   curl http://localhost:9876/api/health

 * WhatsApp Klientinin statusunu yoxlamaq (GET /api/status):
   curl http://localhost:9876/api/status

 * WhatsApp Klientinin hazırki vəziyyətini almaq (CONNECTED, DISCONNECTED, vb.) (GET /api/get-state):
   curl http://localhost:9876/api/get-state

Mesaj Göndərmə Marşrutları
 * Sadə mətn mesajı göndərmək (POST /api/send-text):
   curl -X POST -H "Content-Type: application/json" -d '{"number": "994702353552@c.us", "message": "Salam, bu API-dən göndərilmiş bir test mesajıdır."}' http://localhost:9876/api/send-text

 * Media (şəkil, video, sənəd) göndərmək (Lokal fayl yolu və ya URL ilə) (POST /api/send-media):
   * Qeyd: filePath server tərəfində əlçatan olan lokal bir yol (./media/temp/sekil.jpg kimi) və ya birbaşa URL olmalıdır.
   * Vacib: controllers/whatsappController.js faylının başında const { MessageMedia } = require('whatsapp-web.js'); əlavə etdiyinizə əmin olun.
   <!-- end list -->
   # URL ilə:
curl -X POST -H "Content-Type: application/json" -d '{"number": "994702353552@c.us", "filePath": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png", "caption": "Bu bir şəkil testidir."}' http://localhost:9876/api/send-media

# Lokal fayl üçün (fayl serverin çalışdığı yerdə əlçatan olmalıdır):
# curl -X POST -H "Content-Type: application/json" -d '{"number": "994702353552@c.us", "filePath": "/path/to/your/local/image.jpg", "caption": "Lokal şəkil testidir."}' http://localhost:9876/api/send-media

 * Kataloqdan məhsul göndərmək (WhatsApp Business üçün) (POST /api/send-product):
   * productId sizin data/products.csv faylınızdakı məhsulun ID-si olmalıdır.
   <!-- end list -->
   curl -X POST -H "Content-Type: application/json" -d '{"number": "994702353552@c.us", "productId": "1001", "message": "Bu əməliyyat sistemi yüklənməsi xidmətidir."}' http://localhost:9876/api/send-product

 * Məkan göndərmək (POST /api/send-location):
   * Vacib: controllers/whatsappController.js faylının başında const { Location } = require('whatsapp-web.js'); əlavə etdiyinizə əmin olun.
   <!-- end list -->
   curl -X POST -H "Content-Type: application/json" -d '{"number": "994702353552@c.us", "latitude": "40.4035", "longitude": "49.8553", "description": "Bu bizim ofisimizin yeridir."}' http://localhost:9876/api/send-location

 * Kontakt göndərmək (vCard olaraq) (POST /api/send-contact):
   * contactId göndəriləcək kontaktın WhatsApp ID-si olmalıdır (məsələn, 994551234567@c.us).
   <!-- end list -->
   curl -X POST -H "Content-Type: application/json" -d '{"number": "994702353552@c.us", "contactId": "994551234567@c.us"}' http://localhost:9876/api/send-contact

Söhbət İdarəetmə Marşrutları
 * Bütün söhbətlərin siyahısını almaq (GET /api/get-chats):
   curl http://localhost:9876/api/get-chats

 * Müəyyən bir söhbəti arxivləmək (POST /api/archive-chat):
   * chatId söhbətin ID-si olmalıdır (məsələn, 994702353552@c.us).
   <!-- end list -->
   curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us"}' http://localhost:9876/api/archive-chat

 * Müəyyən bir söhbəti arxivdən çıxarmaq (POST /api/unarchive-chat):
   curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us"}' http://localhost:9876/api/unarchive-chat

 * Mesajı pinləmək (POST /api/pin-message):
   * messageId mesajın ID-si olmalıdır (Bu ID-ni WhatsApp-dan əldə etməlisiniz, çünki bu, dinamikdir). Nümunə: true_994702353552@c.us_3EB03CD4D7032D8E.
   <!-- end list -->
   curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us", "messageId": "true_994702353552@c.us_YOUR_MESSAGE_ID"}' http://localhost:9876/api/pin-message

 * Mesajın pinini ləğv etmək (POST /api/unpin-message):
   curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us", "messageId": "true_994702353552@c.us_YOUR_MESSAGE_ID"}' http://localhost:9876/api/unpin-message

 * Söhbəti oxunmuş kimi işarələmək (POST /api/mark-as-read):
   curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us"}' http://localhost:9876/api/mark-as-read

 * Söhbəti oxunmamış kimi işarələmək (POST /api/mark-as-unread):
   curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us"}' http://localhost:9876/api/mark-as-unread

Kontakt İdarəetmə Marşrutları
 * Kontaktın profil məlumatlarını almaq (GET /api/get-contact-info):
   curl http://localhost:9876/api/get-contact-info?number=994702353552@c.us

 * Kontaktın profil şəklini (URL olaraq) almaq (GET /api/get-profile-pic):
   curl http://localhost:9876/api/get-profile-pic?number=994702353552@c.us

 * Kontaktın son görülmə (last seen) statusunu almaq (GET /api/get-last-seen):
   * Qeyd: Bu funksiya whatsapp-web.js API-sinin məhdudiyyətlərinə görə isOnline statusunu qaytarır, birbaşa "last seen" vaxtını yox.
   <!-- end list -->
   curl http://localhost:9876/api/get-last-seen?number=994702353552@c.us

 * Kontakt üçün etiket (label) əlavə etmək/dəyişmək (POST /api/edit-labels):
   * labelIds WhatsApp Business hesabınızda yaratdığınız etiketlərin ID-lərinin massivi olmalıdır.
   <!-- end list -->
   curl -X POST -H "Content-Type: application/json" -d '{"contactId": "994702353552@c.us", "labelIds": ["1", "2"]}' http://localhost:9876/api/edit-labels

 * Bütün kontaktları almaq (GET /api/get-all-contacts):
   curl http://localhost:9876/api/get-all-contacts

Servis İdarəetmə Marşrutları
 * Xidmətləri axtarmaq (GET /api/search-services):
   curl http://localhost:9876/api/search-services?q=təmir

Klient İdarəetmə Funksiyaları
 * Sessiyanı sıfırlamaq (Klienti yenidən başlatmaq) (POST /api/reset-session):
   * Qeyd: Bu əmri icra etdikdən sonra, botunuzun yenidən işə düşməsi üçün terminalda Node.js prosesini əl ilə dayandırıb yenidən başlatmalı ola bilərsiniz (və ya PM2 kimi proses meneceri istifadə edirsinizsə, o avtomatik yenidən başlatacaq).
   <!-- end list -->
   curl -X POST http://localhost:9876/api/reset-session

 * WhatsApp klientindən çıxış (POST /api/logout):
   * Qeyd: Bu, botu WhatsApp-dan tamamilə ayırır. Yenidən qoşulmaq üçün QR kodu yenidən skan etməyiniz tələb oluna bilər.
   <!-- end list -->
   curl -X POST http://localhost:9876/api/logout

CI / GitHub Actions
-------------------
This repository includes a GitHub Actions workflow that runs on push and pull_request to the main/master branches. The CI job installs dependencies and runs the test suite. It sets SKIP_WHATSAPP=true to avoid launching Puppeteer in CI.

To enable CI, just push this repository to GitHub. The workflow file is located at `.github/workflows/ci.yml`.

Admin UI (basic auth)
----------------------
There is a minimal admin UI for managing blacklist and stop lists at `/admin` and static assets under `/static` (the admin HTML is served from `public/admin.html`). For security, the admin UI is protected by a simple Basic Auth using the `ADMIN_PASSWORD` environment variable.

Set `ADMIN_PASSWORD` in your environment before starting the server, for example:

```bash
export ADMIN_PASSWORD="s3cret"
SKIP_WHATSAPP=true node index.js
```

Then open `http://localhost:9876/admin` in your browser. Use any username and the `ADMIN_PASSWORD` as the password when prompted by the browser's basic auth dialog.

If `ADMIN_PASSWORD` is not set the admin UI will be disabled and return HTTP 403.

cURL examples (admin)
---------------------
Add or remove blacklist entries via cURL using basic auth (username can be `admin`):

```bash
# Add to blacklist
curl -u admin:${ADMIN_PASSWORD} -X POST -H "Content-Type: application/json" -d '{"phone":"+994501234567"}' http://localhost:9876/api/moderation/blacklist

# Remove from blacklist
curl -u admin:${ADMIN_PASSWORD} -X POST -H "Content-Type: application/json" -d '{"phone":"+994501234567"}' http://localhost:9876/api/moderation/blacklist/remove

# Add to stop list
curl -u admin:${ADMIN_PASSWORD} -X POST -H "Content-Type: application/json" -d '{"phone":"+994501234567"}' http://localhost:9876/api/moderation/stop

# Remove from stop list
curl -u admin:${ADMIN_PASSWORD} -X POST -H "Content-Type: application/json" -d '{"phone":"+994501234567"}' http://localhost:9876/api/moderation/stop/remove
```



5. Təkmilləşdirmələr və Həllər (v4.3-dən v4.5.0-a)
Bu versiyada aşağıdakı əsas təkmilləşdirmələr və problemlərin həlli həyata keçirilmişdir:
 * API Marşrutlarının Aktivləşdirilməsi:
   * core/index.js faylında API marşrutları aktivləşdirilərək xarici API çağırışlarına imkan verildi.
 * Video Analizinin Təkmilləşdirilməsi:
   * Əvvəlki versiyada videodan yalnız bir kadr çıxarılırdı. İndi core/services/mediaProcessor.js faylındakı processVideo funksiyası videodan 5 bərabər aralıqlı kadr (snapshot) çıxarır.
   * core/controllers/messageController.js və core/services/ai.js faylları bu çoxlu kadrları AI-yə göndərmək üçün yeniləndi, AI-nin video məzmununu daha dolğun analiz etməsinə nail olundu.
 * PTT (Push-to-Talk) Səsli Mesaj Dəstəyi:
   * core/controllers/messageController.js faylında PTT tipli səsli mesajların da "audio" kimi tanınaraq AI tərəfindən transkripsiya edilməsi təmin edildi.
 * "Product Type" Mesaj Dəstəyi və Analizi:
   * WhatsApp Business API-dən gələn product tipli mesajların düzgün emalı üçün core/controllers/messageController.js və core/services/ai.js fayllarında dəyişikliklər edildi. AI artıq məhsul ID-si və digər məlumatları qəbul edərək daha dəqiq cavablar verir və "olmayan məhsulları" təklif etməsinin qarşısı alındı.
 * Müvəqqəti Faylların Təmizlənməsi:
   * Media emalı zamanı yaranan bütün müvəqqəti faylların (.mp3, .png kadrlar) proses başa çatdıqdan sonra core/controllers/messageController.js tərəfindən avtomatik silinməsi təmin edildi.
 * API Endpoint Məntiqinin Təkmilləşdirilməsi:
   * core/api/routes.js və core/controllers/whatsappController.js faylları genişləndirilərək yeni API endpoint-lər (məkan/kontakt göndərmə, söhbətləri oxunmuş/oxunmamış etmə, bütün kontaktları almaq, klient sessiyasını idarə etmə) əlavə edildi.
   * whatsappClient instansiyası index.js-dən whatsappController.js modulu daxilinə ötürüldü ki, klient obyekti bütün kontroller funksiyaları üçün əlçatan olsun.
7. Problemlərin Aradan Qaldırılması (Troubleshooting)
 * "Error: PUPPETEER_EXECUTABLE_PATH is not set" xətası:
   * .env faylında PUPPETEER_EXECUTABLE_PATH dəyişəninin düzgün təyin olunduğundan əmin olun.
   * Verilmiş yolda Chromium-browser-in quraşdırıldığını yoxlayın.
 * "GROQ_API_KEYS not defined" xətası:
   * .env faylında GROQ_API_KEYS dəyişəninin təyin olunduğundan və boş olmadığından əmin olun.
 * WhatsApp qoşulmur / QR kod yenilənmir:
   * İnternet bağlantınızı yoxlayın.
   * wwebjs_auth qovluğunu silib tətbiqi yenidən başladın. Bu, yeni bir sessiya yaradacaq.
   * PUPPETEER_EXECUTABLE_PATH yolunun düzgün olduğundan əmin olun.
   * Terminalda npm install əmrini yenidən icra edin.
 * API cavab vermir:
   * Tətbiqin işlək olduğundan (node index.js əmrini icra etdiyiniz terminalda xəta olmadığını) əmin olun.
   * Portun (9876) başqa bir proqram tərəfindən istifadə olunmadığını yoxlayın.
   * routes.js və index.js fayllarında API marşrutlarının düzgün aktivləşdirildiyindən əmin olun.
 * Media fayllarının emalında problem:
   * Sisteminizdə FFmpeg-in düzgün quraşdırıldığını yoxlayın. FFmpeg PATH-a əlavə olunmalıdır.
   * MEDIA_TEMP_DIR qovluğunun mövcud olduğundan və yazma icazələrinin olduğundan əmin olun.
 * AI-nin qəribə cavabları / məhsul tapılmaması:
   * GROQ_API_KEYS və model adlarının (GROQ_CHAT_MODEL, GROQ_VISION_MODEL, GROQ_TRANSCRIPTION_MODEL) düzgün olduğundan əmin olun.
   * data/products.csv və data/services.csv fayllarının mövcud olduğundan və məzmununun düzgün formatda olduğundan əmin olun.
   * AI promptlarını təkmilləşdirin (xüsusilə assistant_prompt.md).

WhatsApp Botu üçün CURL Nümunələri

Bu cURL amrləri sizin WhatsCore.AI

botunuzun API endpoint-lari ilə qarşılıqlı əlaqə qurmaq üçün istifadə edilə bilər. http://localhost:9876 asas URL-dir. Bütün

nümunələrdə 994702353552@c.us nömrəsi istifadə olunur, lakin siz bunu lazım

gəldikdə dəyişə bilərsiniz. Əsas Qeyd: MessageMedia va Location

obyektlərini istifadə edan API çağırışlara üçün whatsapp-web.js kitabxanasından bu obyektləri düzgün şəkildə import etdiyinizə

amin olun.

1. API Sağlamlıq va Status Yoxlamaları

API-nin işlək olub olmadığını yoxlamaq: curl http://localhost:9876/api/health

WhatsApp Klientinin statusunu yoxlamaq: curl http://localhost:9876/api/status

WhatsApp Klientinin hazırki vəziyyətini almaq (CONNECTED, DISCONNECTED, vb.): curl http://localhost:9876/api/get-state

2 Sada matn mesajı göndərmək:

. Mesaj Göndərmə Marşrutları

curl -X POST -H "Content-Type:

application/json" -d "number":

"994702353552@c.us", "message": "Salam, bu API-dən göndərilmiş bir test mesajıdır."}"

http://localhost:9876/api/send-text

Media (şəkil, video, sənəd) göndərmək (Lokal fayl yolu ilə):

Qeyd: filePath server tərəfində əlçatan

olan lokal bir yol olmalıdır (məsələn, ./media/temp/sekil.jpg) və ya bir URL.

* Vacib: whatsapp-web.js kitabxanasından MessageMedia obyektini import etdiyinizə

əmin olun. <!-- end list --> const (MessageMedia }

require('whatsapp-web.js'); //whatsappController.js faylının başında əlavə

edin

bash

curl -X POST -H "Content-Type: application/json" -d ("number": "994702353552@c.us",

"filePath": "[https://www.google.com/images

/branding/googlelogo/1x/googlelogo_color _272x92dp.png](https://www.google.com/images

/branding/googlelogo/1x/googlelogo_color _272x92dp.png)", "caption": "Bu bir şəkil

testidir."}' http://localhost:9876/api/send

-media #Veya lokal fayl üçün:

#curl -X POST -H "Content-Type:

application/json" -d '{"number":

"994702353552@c.us", "filePath": "/path/

to/your/image.jpg", "caption": "Lokal şəkil

testidir."}' http://localhost:9876/api/send

-media

Kataloqdan məhsul göndərmək (WhatsApp

Business üçün):

productId sizin products.csv

faylınızdakı məhsulun ID-si olmalıdır. <!-- end list -->

curl -X POST -H "Content-Type:

application/json" -d '{"number":

"994702353552@c.us", "productId": "1001",

"message": "Bu əməliyyat sistemi yüklənməsi xidmətidir."}" http://localhost:9876/api

/send-product

Makan göndərmək:

Vacib: whatsapp-web.js kitabxanasından Location obyektini import etdiyinizə əmin

olun.

<!-- end list -->

const (Location }

require('whatsapp-web.js'); //whatsappController.js faylının başında əlavə

edin

bash

curl -X POST -H "Content-Type: application/json" d '{"number": "994702353552@c.us",

"latitude": "40.4035", "longitude": "49.8553", "description": "Bu bizim

ofisimizin yeridir."}' http://localhost:9876 /api/send-location

Kontakt göndərmək (vCard olaraq): contactId göndəriləcək kontaktın

WhatsApp ID-si olmalıdır (masalan,

994551234567@c.us).

<!-- end list -->

curl -X POST -H "Content-Type: application/json" -d '{"number":

"994702353552@c.us", "contactId"

"994551234567@c.us") http://localhost:9876

/api/send-contact

3. Söhbət (Chat) İdarəetmə Marşrutları

Bütün söhbətlərin siyahısını almaq: curl http://localhost:9876/api/get-chats

Müayyan bir söhbəti arxivlamak:

chatId söhbat in ID-si olmalıdır (məsələn, 994702353552@c.us).

<!-- end list -->

curl -X POST -H "Content-Type:

application/json" -d {"chatId": "994702353552@c.us")' http://localhost:9876 /api/archive-chat

Müəyyən bir söhbəti arxivdən çıxarmaq:

curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us")' http://localhost:9876 /api/unarchive-chat

Mesajı pinlamak:

messageId mesajın ID-si olmalıdır (WhatsApp-dan mesajın ID-sini əldə

etməlisiniz).

<!-- end list

#avvalca mesaj ID-sini aldə edin (məsələn, söhbət loqlarından və ya API

vasitəsilə)

curl -X POST-H "Content-Type: application/json" -d {"chatId": "994702353552@c.us",

"messageld": "true_994702353552@c.us _3EB03CD4D7032D8E"} http://localhost:9876

/api/pin-message

Mesajın pinini ləğv etmək:

curl -X POST -H "Content-Type:

application/json" -d {"chatId":

"994702353552@c.us", "messageId": "true

_994702353552@c.us_3EB03CD407032D8E"} http://localhost:9876/api/unpin-message

Söhbəti oxunmuş kimi işarəlamak:

curl -X POST -H "Content-Type:

application/json" -d '{"chatId": "994702353552@c.us")" http://localhost:9876

/api/mark-as-read

Söhbati oxunmamış kimi işarələmək:

curl -X POST -H "Content-Type: application/json" -d '{"chatId": "994702353552@c.us")" http://localhost:9876

/api/mark-as-unread

4. Kontakt (Contact) İdarəetma Marşrutları

Kontaktın profil məlumatlarını almaq:

curl http://localhost:9876/api/get

-contact-info?number=994702353552@c.us

* Kontaktın profil şəklini (URL olaraq)

almaq

curl http://localhost:9876/api/get -profile-pic?number-994702353552@c.us

Kontaktın son görülmə (last seen)

statusunu almaq:

curl http://localhost:9876/api/get-last -seen?number=994702353552@k.us

Kontakt üçün etiket (label) əlavə etmək/

dayişmək:

labelids etiket ID-larinin massivi olmalıdır (WhatsApp Business-də yaradılan

etiketlər).

<!-- end list

curl -X POST -H "Content-Type: application/json" -d {"contactId":

"994702353552@c.us", "labelIds":["1",

" 2"])" http://localhost:9876/api/edit-labels

Bütün kontaktları almaq: curl http://localhost:9876/api/get-all

-contacts

5. Servis İdarəetmə Marşrutları

Xidmətləri axtarmaq: curl http://localhost:9876/api/search

-services?q-tamir

6. Klient İdarəetmə Funksiyaları Sessiyanı sıfırlamaq (Klienti yenidən

başlatmaq):

Qeyd: Bu əmri icra etdikdən sonra,

botunuzun yenidən işə düşməsi üçün dayandırıb yenidən başlatmalı ola bilərsiniz

terminalda Node.js prosesini əl ilə

(va ya avtomatik yenidən başlatma mexanizmi qurmuşsanız, o işə düşəcək). <!-- end list -->

curl -X POST http://localhost:9876/api

/reset-session

WhatsApp klientindən çıxış: Qeyd: Bu, botu WhatsApp-dan tamamilə

ayırır. Yenidən qoşulmaq üçün QR kodu yenidən skan etməyiniz tələb oluna bilər.

<1-- end list --> curl -X POST http://localhost:9876/api

/logout

Bu cURL nümunələri ilə API-nizin tam

funksionallığını test edə bilərsiniz. Har bar amrdən sonra terminalda ve WhatsApp-da botun davranışını izləməyi unutmayın.

Uğurlar!

Siz tərəfindən seçilmiş Canvasdakı kod və təqdim etdiyiniz terminal çıxışı əsasında tətbiqi necə test edə biləcəyinizi izah edirəm.
Terminal çıxışınıza görə, Express serveriniz http://localhost:9876 ünvanında işə düşüb və WhatsApp Asistanı da hazırdır. Bu o deməkdir ki, siz həm WhatsApp vasitəsilə, həm də API çağırışları ilə tətbiqi test edə bilərsiniz.
1. WhatsApp Vasitəsilə Test (Bot ilə Birbaşa Ünsiyyət):
Botunuz artıq mesajları gözlədiyi üçün, siz botun qoşulduğu WhatsApp nömrəsinə müxtəlif mesajlar göndərərək test edə bilərsiniz:
 * Mətn Mesajları: Adi mətn mesajları göndərin və botun cavablarını yoxlayın.
 * Audio Mesajlar: Səsli mesajlar göndərin (PTT formatı daxil olmaqla) və botun transkripsiya edib cavab verdiyini yoxlayın.
 * Şəkil Mesajları: Şəkillər göndərin və AI-nin şəkli təsvir etmə qabiliyyətini yoxlayın.
 * Video Mesajları: Videolar göndərin. Botun videodan kadrlar çıxarıb analiz etdiyini və məzmunla bağlı cavab verdiyini yoxlayın.
 * Məkan Mesajları: Məkan paylaşın və botun ona necə reaksiya verdiyini görün.
 * Məhsul Mesajları: Əgər WhatsApp Business hesabınız varsa, məhsul kataloqundan bir məhsul göndərin və botun məhsul sorğusunu düzgün emal etdiyini yoxlayın.
 * Məhsul Sorğuları (Mətnlə): "Noutbuk qiyməti nə qədərdir?", "Batareya dəyişdirmə neçəyədir?" kimi məhsul və ya xidmət ilə bağlı suallar verin. Botun verilənlər bazasından məlumat tapıb-tapmadığını və ya məhsul tapılmadığı halda düzgün cavab verdiyini yoxlayın.
Bütün bu testlər zamanı botun verdiyi cavabları və terminaldakı logları diqqətlə izləyin.
2. API Çağırışları Vasitəsilə Test (cURL istifadə edərək):
Sizin routes.js faylındakı dəyişikliklər API endpoint-lərini aktivləşdirir. Siz bunları curl əmrləri ilə test edə bilərsiniz. Terminalınızda yeni bir pəncərə açaraq bu əmrləri yerinə yetirə bilərsiniz.
a. Sağlamlıq Yoxlaması:
Bu, API-nin işlək olub-olmadığını yoxlamaq üçün əsas marşrutdur.
curl http://localhost:9876/api/health

Gözlənilən cavab: {"status":"OK","message":"WhatsCore API işlək vəziyyətdədir."}
b. Klient Statusu:
WhatsApp klientinin hazırki statusunu yoxlamaq üçün.
curl http://localhost:9876/api/status

Gözlənilən cavab (əgər qoşulubsa): {"status":"OK","clientState":"CONNECTED"}
c. Mətn Mesajı Göndərmək:
+994XXXXXXXXX yerinə WhatsApp nömrəsini (ölkə kodu ilə birlikdə, misal üçün 994501234567) yazın.
curl -X POST -H "Content-Type: application/json" -d '{"number": "994501234567@c.us", "message": "Salam, bu API testi mesajıdır."}' http://localhost:9876/api/send-text

d. Servis Axtarışı:
Verilənlər bazasındakı xidmətləri axtarmaq üçün.
curl http://localhost:9876/api/search-services?q=adapter

Gözlənilən cavab: Tapılan adapter xidmətlərinin siyahısı.
e. Söhbətləri Almaq:
curl http://localhost:9876/api/get-chats

f. Bütün Kontaktları Almaq:
curl http://localhost:9876/api/get-all-contacts

Vacib Qeydlər:
 * number sahəsində WhatsApp nömrəsini 994XXXXXXXXX@c.us formatında daxil etməlisiniz.
 * Digər API endpoint-lərini (/send-media, /send-product, /send-location, /send-contact, /archive-chat, /unarchive-chat, /pin-message, /unpin-message, /mark-as-read, /mark-as-unread, /reset-session, /logout) də oxşar cURL əmrləri ilə test edə bilərsiniz. Onların hər biri üçün tələb olunan req.body parametrlərinə (məsələn, chatId, messageId, filePath, latitude, longitude və s.) diqqət yetirin.
 * Bütün bu testlər zamanı terminalınızdakı loqları izləyin. Onlar proseslərin düzgün işlədiyini və ya hər hansı bir xəta baş verdiyini göstərəcək.
Bu addımları izləyərək tətbiqinizin həm bot tərəfindən, həm də API vasitəsilə tam funksional olduğunu yoxlaya bilərsiniz.

