/* ============================================================
   questions.js — question bank with answer checkers + mistake diagnosis
   Question text uses LaTeX between $...$ rendered by KaTeX auto-render.
   ============================================================ */

function nearly(a, b, tol = 0.05) { return Math.abs(a - b) <= tol; }

const QUESTIONS = [
  // ---------- polar conversion ----------
  {
    id: 'pol1', topic: 'polar', level: 1,
    text: 'נתון $z = 3 + 4i$. מה הגודל $|z|$ ?',
    type: 'numeric', answer: 5,
    accept: g => nearly(parseFloat(g), 5),
    hint: 'הגודל הוא $\\sqrt{a^{2} + b^{2}}$.',
    explain: '$|z| = \\sqrt{3^{2} + 4^{2}} = \\sqrt{25} = 5$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 7)) return 'בלבול בין |z| לסכום a+b';
      if (nearly(x, 25)) return 'שכחת להוציא שורש';
      if (nearly(x, 12)) return 'חישוב a·b במקום a²+b²';
      return 'חישוב גודל מספר מרוכב';
    },
  },
  {
    id: 'pol2', topic: 'polar', level: 1,
    text: 'נתון $z = 0 + 2i$. מה הארגומנט $\\arg(z)$ במעלות?',
    type: 'numeric', answer: 90,
    accept: g => nearly(parseFloat(g), 90, 0.5),
    hint: 'הנקודה $(0,\\,2)$ נמצאת על הציר המדומה החיובי.',
    explain: '$z$ יושב על הציר המדומה החיובי $\\Rightarrow \\theta = 90^{\\circ}$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 0)) return 'בלבול בין ציר ממשי לציר מדומה';
      if (nearly(x, -90)) return 'סימן הזווית';
      if (nearly(x, 180)) return 'זיהוי כיוון הציר';
      return 'חישוב ארגומנט';
    },
  },
  {
    id: 'pol3', topic: 'polar', level: 2,
    text: 'הצגה קוטבית של $z = -1 - i$. מה הארגומנט במעלות בטווח $(-180^{\\circ},\\, 180^{\\circ}]$?',
    type: 'numeric', answer: -135,
    accept: g => nearly(parseFloat(g), -135, 0.5) || nearly(parseFloat(g), 225, 0.5),
    hint: 'הנקודה ברביע השלישי. $\\arctan(b/a)$ לבדה לא מספיקה — בדקי את הרביע.',
    explain: 'הנקודה $(-1,\\,-1)$ ברביע ה־III. $\\theta = -180^{\\circ} + 45^{\\circ} = -135^{\\circ}$ (או $225^{\\circ}$).',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 45)) return 'לקחת רק arctan ולא התחשבת ברביע';
      if (nearly(x, 135)) return 'טעות סימן ברביע השלישי';
      if (nearly(x, -45)) return 'בלבול בין רביע III ל־IV';
      return 'חישוב ארגומנט ברביע השלישי';
    },
  },
  {
    id: 'pol4', topic: 'polar', level: 2,
    text: 'נתון $z = 2\\,\\operatorname{cis}(60^{\\circ})$. מה החלק הממשי $a$?',
    type: 'numeric', answer: 1,
    accept: g => nearly(parseFloat(g), 1, 0.05),
    hint: '$a = r\\cos\\theta$.',
    explain: '$a = 2\\cos 60^{\\circ} = 2 \\cdot \\tfrac{1}{2} = 1$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, Math.sqrt(3))) return 'החלפת בין sin ל־cos (נתת את החלק המדומה)';
      if (nearly(x, 2)) return 'שכחת לכפול ב־cos';
      return 'מעבר מקוטבי לאלגברי';
    },
  },

  // ---------- multiplication ----------
  {
    id: 'mul1', topic: 'mult', level: 1,
    text: 'מהי המכפלה $i\\cdot(3 + 2i)$ ?',
    type: 'choice', answer: '−2 + 3i',
    choices: ['3 − 2i', '−2 + 3i', '2 − 3i', '−3 − 2i'],
    accept: g => g.replace(/\s/g,'') === '−2+3i' || g.replace(/\s/g,'') === '-2+3i',
    hint: 'כפל ב־$i$ הוא סיבוב $90^{\\circ}$ נגד כיוון השעון.',
    explain: '$i(3+2i) = 3i + 2i^{2} = 3i - 2 = -2 + 3i$. גיאומטרית: $(3,2) \\to (-2,3)$.',
    diagnose: (g) => {
      const s = g.replace(/\s/g,'');
      if (s === '2−3i' || s === '2-3i') return 'סיבוב בכיוון ההפוך (90° במקום −90°)';
      if (s === '3−2i' || s === '3-2i') return 'התעלמות מ־i² = −1';
      return 'כפל ב־i כסיבוב';
    },
  },
  {
    id: 'mul2', topic: 'mult', level: 2,
    text: 'נתון $z = 2\\,\\operatorname{cis}(30^{\\circ})$. מהי $z\\cdot\\operatorname{cis}(60^{\\circ})$ בייצוג קוטבי? הכניסי $\\theta$ במעלות (הגודל הוא $2$).',
    type: 'numeric', answer: 90,
    accept: g => nearly(parseFloat(g), 90, 0.5),
    hint: 'בכפל קוטבי הזוויות מתחברות והגדלים מוכפלים.',
    explain: '$\\operatorname{cis}(30^{\\circ})\\cdot\\operatorname{cis}(60^{\\circ}) = \\operatorname{cis}(90^{\\circ})$. הגודל נשאר $2 \\cdot 1 = 2$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 30)) return 'שכחת לחבר זוויות';
      if (nearly(x, 1800)) return 'כפלת זוויות במקום לחבר';
      if (nearly(x, -30)) return 'חיסור במקום חיבור';
      return 'חוק כפל בייצוג קוטבי';
    },
  },
  {
    id: 'mul3', topic: 'mult', level: 1,
    text: 'כפל ב־$(-1)$ מבחינה גאומטרית הוא:',
    type: 'choice', answer: 'סיבוב ב־180°',
    choices: ['סיבוב ב־90°', 'סיבוב ב־180°', 'שיקוף על הציר הממשי', 'מתיחה פי 2'],
    accept: g => g === 'סיבוב ב־180°',
    hint: '$|-1| = 1$ והזווית של $-1$ היא $180^{\\circ}$.',
    explain: 'כפל ב־$\\operatorname{cis}(180^{\\circ}) = -1$ מסובב כל נקודה ב־$180^{\\circ}$ סביב הראשית.',
    diagnose: (g) => {
      if (g.includes('90')) return 'בלבול בין כפל ב־i לכפל ב־(−1)';
      if (g.includes('שיקוף')) return 'שיקוף ≠ סיבוב 180°';
      return 'משמעות גאומטרית של כפל בקבוע';
    },
  },

  // ---------- roots ----------
  {
    id: 'rt1', topic: 'roots', level: 1,
    text: 'כמה פתרונות מרוכבים יש למשוואה $z^{5} = 1$ ?',
    type: 'numeric', answer: 5,
    accept: g => parseInt(g) === 5,
    hint: 'המשפט היסודי של האלגברה: למשוואה $z^{n} = c$ יש $n$ פתרונות.',
    explain: 'משפט: $z^{n} = c$ (כש־$c \\ne 0$) יש בדיוק $n$ שורשים מרוכבים, על מעגל אחד.',
    diagnose: (g) => {
      const x = parseInt(g);
      if (x === 1) return 'התעלמות משורשים מרוכבים (רק שורש ממשי)';
      if (x === 2) return 'חשבת רק על ±';
      if (x === 10) return 'ספירה כפולה';
      return 'מספר השורשים של zⁿ=c';
    },
  },
  {
    id: 'rt2', topic: 'roots', level: 2,
    text: 'מהו המרווח הזוויתי בין שני שורשים סמוכים של $z^{6} = 1$, במעלות?',
    type: 'numeric', answer: 60,
    accept: g => nearly(parseFloat(g), 60, 0.5),
    hint: '$\\dfrac{360^{\\circ}}{n}$.',
    explain: 'השורשים מסודרים שווה־מרחק על מעגל היחידה: $\\dfrac{360^{\\circ}}{6} = 60^{\\circ}$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 30)) return 'חלוקה ב־2n במקום n';
      if (nearly(x, 360)) return 'שכחת לחלק ב־n';
      if (nearly(x, 6)) return 'נתת את n במקום את הזווית';
      return 'מרווח זוויתי בין שורשים';
    },
  },
  {
    id: 'rt3', topic: 'roots', level: 2,
    text: 'מהו הרדיוס של המעגל שעליו יושבים שורשי $z^{4} = 16$ ?',
    type: 'numeric', answer: 2,
    accept: g => nearly(parseFloat(g), 2, 0.05),
    hint: 'הרדיוס הוא $|c|^{1/n}$.',
    explain: '$|c| = 16,\\; n = 4 \\;\\Rightarrow\\; \\sqrt[4]{16} = 2$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 4)) return 'חישוב √16 במקום ⁴√16';
      if (nearly(x, 16)) return 'שכחת להוציא שורש מסדר n';
      if (nearly(x, 1)) return 'בלבול עם מעגל היחידה';
      return 'רדיוס מעגל השורשים';
    },
  },

  // ---------- cis / periodicity ----------
  {
    id: 'cis1', topic: 'cis', level: 1,
    text: 'מהו $\\operatorname{cis}(2\\pi)$ ?',
    type: 'choice', answer: '1',
    choices: ['0', '1', 'i', '−1'],
    accept: g => g === '1' || g === '1+0i',
    hint: 'סיבוב מלא של $360^{\\circ}$ מחזיר אותך לאותה נקודה.',
    explain: '$\\operatorname{cis}(2\\pi) = \\cos(2\\pi) + i\\sin(2\\pi) = 1$. זו בדיוק המחזוריות.',
    diagnose: (g) => {
      if (g === '0') return 'בלבול בין sin(2π)=0 ל־cis(2π)';
      if (g === 'i') return 'cis(π/2) במקום cis(2π)';
      if (g === '−1') return 'cis(π) במקום cis(2π)';
      return 'מחזוריות cis';
    },
  },
  {
    id: 'cis2', topic: 'cis', level: 2,
    text: '$\\operatorname{cis}(\\theta) = \\operatorname{cis}(\\theta + 2\\pi k)$ עבור איזה $k$ ?',
    type: 'choice', answer: 'כל מספר שלם k',
    choices: ['רק k = 0', 'רק k = 1', 'כל מספר שלם k', 'רק k חיובי'],
    accept: g => g === 'כל מספר שלם k',
    hint: 'כל סיבוב מלא של $360^{\\circ} = 2\\pi$ מחזיר אותך לאותה נקודה.',
    explain: '$\\operatorname{cis}$ מחזורית במחזור $2\\pi$. תוספת של $2\\pi k$ ($k$ שלם) לא משנה את הנקודה.',
    diagnose: (g) => {
      if (g.includes('חיובי')) return 'מחזוריות בשני הכיוונים';
      if (g.includes('0')) return 'אי־הבנה של המושג מחזוריות';
      return 'תחום המחזוריות';
    },
  },
  {
    id: 'cis3', topic: 'cis', level: 3,
    text: 'נתון $z = \\operatorname{cis}\\!\\left(\\dfrac{7\\pi}{3}\\right)$. באיזה זווית "מצומצמת" בטווח $[0, 2\\pi)$ זה שווה?',
    type: 'numeric', answer: Math.PI / 3,
    accept: g => {
      const x = parseFloat(g);
      if (isNaN(x)) return false;
      return nearly(x, Math.PI / 3, 0.05) || nearly(x, 60, 0.5) || nearly(x, 1.047, 0.05);
    },
    hint: 'הורידי כפולות של $2\\pi$. $\\dfrac{7\\pi}{3} - 2\\pi = \\dfrac{\\pi}{3}$.',
    explain: '$\\dfrac{7\\pi}{3} - 2\\pi = \\dfrac{\\pi}{3} \\;\\Rightarrow\\; \\operatorname{cis}\\!\\left(\\tfrac{7\\pi}{3}\\right) = \\operatorname{cis}\\!\\left(\\tfrac{\\pi}{3}\\right)$.',
    diagnose: (g) => {
      const x = parseFloat(g);
      if (nearly(x, 7*Math.PI/3, 0.05)) return 'לא צמצמת בכלל';
      if (nearly(x, Math.PI/6, 0.05) || nearly(x, 30, 0.5)) return 'חלוקה במקום חיסור של 2π';
      return 'צמצום זווית במחזוריות';
    },
  },
];

function getQuestions(topic, level) {
  return QUESTIONS.filter(q =>
    (topic === 'all' || q.topic === topic) &&
    (level === 'all' || q.level === parseInt(level))
  );
}
