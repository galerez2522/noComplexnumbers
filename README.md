# מרוכבים בתנועה · Complex Motion

פלטפורמה אינטראקטיבית להמחשת מספרים מרוכבים ומתמטיקה ל־5 יח״ל.

## הפעלה

האתר דורש **Firebase** (Auth + Firestore) — אין מצב מקומי. הגדרה חד־פעמית (~5 דקות):

1. כנסי ל-https://console.firebase.google.com/ → "Add project" (חינמי).
2. בפרויקט: **Build → Authentication → Get started** → אפשרי "Email/Password".
3. **Build → Firestore Database → Create database** (Production mode, אזור eur3).
4. **Project settings ⚙ → General → Your apps → Web (`</>`)** → רשמי web app וקבלי את אובייקט הקונפיג.
5. הדביקי אותו ב-`js/firebase-init.js` במקום ה-`PASTE_*`.
6. עדכני את `TEACHER_EMAILS` במייל שלך (מורה).
7. ב-**Firestore → Rules** הדביקי (החליפי את המייל):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
         allow read: if request.auth != null
           && request.auth.token.email in ['gal@example.com'];
       }
     }
   }
   ```
8. פרסי את האתר (Vercel / GitHub Pages / שרת סטטי כלשהו).

אם הקונפיג חסר — מודאל הכניסה יציג הודעת "נדרשת הגדרת Firebase" והאתר לא יפעל.

## המודולים ב־MVP

1. **המישור המרוכב** — גררי את הנקודה z וראי בו־זמנית את ההצגה האלגברית, הקוטבית, הטריגונומטרית ו־cis.
2. **כפל וסיבוב** — אנימציה של z·w. כפתורי קיצור: ×i, ×(−1), ×(−i), ×2, ×cis(60°).
3. **שורשים מרוכבים** — n פתרונות של zⁿ = c, מוצגים על מעגל ברדיוס |c|^(1/n) עם בנייה הדרגתית.
4. **מחזוריות ו־cis** — מעגל היחידה לצד גרפי sin/cos לאורך θ, עם הרצה אוטומטית שמראה את החזרה כל 2π.

## ארכיטקטורה

- `index.html` · מבנה ו־RTL
- `styles.css` · עיצוב
- `app.js` · ארבעת המודולים + מחלקת `ComplexPlane` משותפת ל־Canvas

## הרחבות עתידיות

- מודול 3D עם Three.js (ספירלה z(θ)=e^(iθ) לאורך ציר זמן)
- אבחון טעויות נפוצות + משוב מותאם
- אזור מורה: משימות, מעקב התקדמות
- Backend (Node/Flask) + DB לשמירת תלמידים ותרגילים