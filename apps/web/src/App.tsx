import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

type User = { id: string; email: string; role: string };
type Profile = {
  displayName: string;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  preferredLanguage: 'ar' | 'en';
  goal: string;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  safetyNotes: string | null;
};
type Exercise = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  difficulty: string;
  equipment: unknown;
};
type Workout = { id: string; startedAt: string; completedAt: string | null; status: string; _count?: { sets: number } };
type WorkoutSet = { id: string; exerciseId: string; setNumber: number; reps: number | null; loadKg: number | null; durationSeconds: number | null; completed: boolean; exercise?: { nameAr: string; nameEn: string } };
type WorkoutDetail = { id: string; status: string; sets: WorkoutSet[] };
type TrainingPlan = { id: string; title: string; goal: string; status: string; _count?: { days: number } };

const emptyProfile: Profile = {
  displayName: '',
  birthDate: null,
  heightCm: null,
  weightKg: null,
  preferredLanguage: 'ar',
  goal: 'GENERAL',
  experienceLevel: 'BEGINNER',
  trainingDaysPerWeek: 3,
  sessionMinutes: 45,
  equipment: [],
  safetyNotes: null,
};

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('zyvon_token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [reps, setReps] = useState('10');
  const [loadKg, setLoadKg] = useState('');
  const [setCounts, setSetCounts] = useState<Record<string, number>>({});
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join('، ') : body.message || 'حدث خطأ. حاول مرة أخرى.');
    return body;
  }, [token]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const [me, catalog, history, planList] = await Promise.all([
        api('/users/me'),
        api('/exercises?limit=12'),
        api('/workouts?limit=10'),
        api('/plans'),
      ]);
      setExercises(catalog.data || []);
      const workoutItems: Workout[] = history.data || [];
      setWorkouts(workoutItems);
      setPlans(Array.isArray(planList) ? planList : []);
      const inProgress = workoutItems.find((item) => item.status === 'IN_PROGRESS');
      if (inProgress) {
        const detail: WorkoutDetail = await api(`/workouts/${inProgress.id}`);
        setActiveWorkout(detail.id);
        setWorkoutSets(detail.sets || []);
        const counts = detail.sets.reduce<Record<string, number>>((result, item) => {
          result[item.exerciseId] = Math.max(result[item.exerciseId] || 0, item.setNumber);
          return result;
        }, {});
        setSetCounts(counts);
      } else {
        setActiveWorkout(null);
        setSetCounts({});
        setWorkoutSets([]);
      }
      try {
        const saved = await api('/users/me/profile');
        setProfile({
          ...emptyProfile,
          ...saved,
          birthDate: saved.birthDate ? String(saved.birthDate).slice(0, 10) : null,
          equipment: Array.isArray(saved.equipment) ? saved.equipment : [],
        });
      } catch {
        setProfile(emptyProfile);
      }
      setUser(me.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات');
      if (String(err).includes('Invalid') || String(err).includes('token')) logout();
    } finally {
      setBusy(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (token) void loadDashboard();
  }, [token, loadDashboard]);

  function logout() {
    sessionStorage.removeItem('zyvon_token');
    setToken('');
    setUser(null);
    setProfile(emptyProfile);
    setActiveWorkout(null);
    setSetCounts({});
    setWorkoutSets([]);
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, ...(isRegister && displayName ? { displayName } : {}) }),
      });
      sessionStorage.setItem('zyvon_token', result.accessToken);
      setToken(result.accessToken);
      setMessage(isRegister ? 'تم إنشاء حسابك بنجاح.' : 'تم تسجيل الدخول بنجاح.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      const equipment = String(form.get('equipment') || '').split(',').map((x) => x.trim()).filter(Boolean);
      const payload = {
        displayName: String(form.get('displayName') || ''),
        birthDate: String(form.get('birthDate') || '') || null,
        heightCm: form.get('heightCm') ? Number(form.get('heightCm')) : null,
        weightKg: form.get('weightKg') ? Number(form.get('weightKg')) : null,
        preferredLanguage: String(form.get('preferredLanguage') || 'ar'),
        goal: String(form.get('goal') || 'GENERAL'),
        experienceLevel: String(form.get('experienceLevel') || 'BEGINNER'),
        trainingDaysPerWeek: Number(form.get('trainingDaysPerWeek') || 3),
        sessionMinutes: Number(form.get('sessionMinutes') || 45),
        equipment,
        safetyNotes: String(form.get('safetyNotes') || '') || null,
      };
      const saved = await api('/users/me/profile', { method: 'PATCH', body: JSON.stringify(payload) });
      setProfile({ ...emptyProfile, ...saved, birthDate: saved.birthDate ? String(saved.birthDate).slice(0, 10) : null, equipment: Array.isArray(saved.equipment) ? saved.equipment : [] });
      setMessage('تم حفظ بياناتك الرياضية.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ البيانات');
    } finally {
      setBusy(false);
    }
  }

  async function generatePlan() {
    setBusy(true);
    setError('');
    try {
      await api('/plans/generate', { method: 'POST', body: JSON.stringify({}) });
      setMessage('تم إنشاء مسودة خطتك التدريبية. راجع الأيام والتمارين قبل تفعيلها.');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إنشاء الخطة');
    } finally {
      setBusy(false);
    }
  }

  async function activatePlan(planId: string) {
    setBusy(true);
    setError('');
    try {
      await api(`/plans/${planId}/activate`, { method: 'POST', body: JSON.stringify({}) });
      setMessage('تم تفعيل الخطة التدريبية.');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تفعيل الخطة');
    } finally {
      setBusy(false);
    }
  }

  async function startWorkout() {
    setBusy(true);
    try {
      const result = await api('/workouts', { method: 'POST', body: JSON.stringify({}) });
      setActiveWorkout(result.id);
      setSetCounts({});
      setMessage('بدأت جلسة التدريب. اختر تمرينًا لتسجيل أول مجموعة.');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر بدء التدريب');
    } finally {
      setBusy(false);
    }
  }

  async function logExercise(exerciseId: string) {
    if (!activeWorkout) return;
    if (!Number.isInteger(Number(reps)) || Number(reps) < 1 || Number(reps) > 1000) {
      setError('أدخل عدد تكرارات صحيحًا من 1 إلى 1000.');
      return;
    }
    if (loadKg !== '' && (!Number.isFinite(Number(loadKg)) || Number(loadKg) < 0 || Number(loadKg) > 1000)) {
      setError('أدخل وزنًا صحيحًا من 0 إلى 1000 كجم.');
      return;
    }
    setBusy(true);
    try {
      await api(`/workouts/${activeWorkout}/sets`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId, setNumber: (setCounts[exerciseId] || 0) + 1, reps: Number(reps), ...(loadKg !== '' ? { loadKg: Number(loadKg) } : {}), completed: true }),
      });
      setSetCounts((current) => ({ ...current, [exerciseId]: (current[exerciseId] || 0) + 1 }));
      setMessage('تم تسجيل المجموعة بنجاح.');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل المجموعة');
    } finally {
      setBusy(false);
    }
  }

  async function finishWorkout() {
    if (!activeWorkout) return;
    setBusy(true);
    try {
      await api(`/workouts/${activeWorkout}/complete`, { method: 'PATCH', body: JSON.stringify({}) });
      setActiveWorkout(null);
      setSetCounts({});
      setMessage('تم إنهاء جلسة التدريب وحفظها في السجل.');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إنهاء الجلسة');
    } finally {
      setBusy(false);
    }
  }

  if (!token || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="brand-mark">Z</div>
          <p className="eyebrow">YOUR PERFORMANCE, REIMAGINED</p>
          <h1>ZYVON <span>AI</span></h1>
          <p className="muted">منصة تدريب ذكية تساعدك تبني أداء أقوى، خطوة بخطوة.</p>
          <form onSubmit={authenticate} className="stack">
            {isRegister && <label>الاسم<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={60} placeholder="اسمك" /></label>}
            <label>البريد الإلكتروني<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></label>
            <label>كلمة المرور<input type="password" required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 أحرف على الأقل" /></label>
            <button className="primary" disabled={busy}>{busy ? 'جارٍ التنفيذ...' : isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}</button>
          </form>
          <button className="text-button" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'لديك حساب؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ حسابًا'}</button>
          {error && <p className="alert error">{error}</p>}
          {message && <p className="alert success">{message}</p>}
          <small>نسخة تجريبية مبكرة — لا تستخدمها لتشخيص الحالات الطبية أو استبدال المختصين.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark small">Z</span><strong>ZYVON <em>AI</em></strong></div>
        <div className="user-tools"><span>{profile.displayName || user.email}</span><button className="ghost" onClick={logout}>خروج</button></div>
      </header>
      <section className="welcome">
        <div><p className="eyebrow">SMART FITNESS PLATFORM</p><h1>أهلاً {profile.displayName || 'بك'} 👋</h1><p>خطتك تبدأ من فهم مستواك وتتبع تقدمك.</p></div>
        <button className="primary" onClick={startWorkout} disabled={busy || !!activeWorkout}>{activeWorkout ? 'جلسة تدريب نشطة' : 'ابدأ جلسة تدريب'}</button>
      </section>
      {error && <p className="alert error">{error}</p>}
      {message && <p className="alert success">{message}</p>}
      {activeWorkout && <section className="active-banner"><div><strong>جلسة تدريب نشطة</strong><p>حدد التكرارات والوزن، ثم سجّل كل مجموعة من مكتبة التمارين.</p><div className="set-inputs"><label>التكرارات<input type="number" min="1" max="1000" value={reps} onChange={(e) => setReps(e.target.value)} /></label><label>الوزن (كجم)<input type="number" min="0" max="1000" step="0.25" value={loadKg} onChange={(e) => setLoadKg(e.target.value)} placeholder="اختياري" /></label></div></div><button className="danger" onClick={finishWorkout} disabled={busy}>إنهاء الجلسة</button></section>}
      {activeWorkout && <section className="panel logged-workout"><div className="section-heading"><div><p className="eyebrow">LIVE SESSION</p><h2>المجموعات المسجلة</h2></div><span className="pill">{workoutSets.length} مجموعة</span></div>{workoutSets.length ? <div className="logged-set-list">{workoutSets.map((set) => <div className="logged-set" key={set.id}><div><strong>{set.exercise?.nameAr || 'تمرين'}</strong><small>{set.exercise?.nameEn || ''} · المجموعة {set.setNumber}</small></div><span>{set.reps !== null ? `${set.reps} تكرار` : `${set.durationSeconds} ثانية`}</span><span>{set.loadKg !== null ? `${set.loadKg} كجم` : 'بدون وزن'}</span></div>)}</div> : <p className="muted">لم تُسجل مجموعات بعد. اختر تمرينًا من المكتبة للبدء.</p>}</section>}
      <div className="dashboard-grid">
        <section className="panel profile-panel">
          <div className="section-heading"><div><p className="eyebrow">YOUR BASELINE</p><h2>ملفك الرياضي</h2></div><span className="pill">التهيئة</span></div>
          <form onSubmit={saveProfile} className="profile-form">
            <label>الاسم<input name="displayName" defaultValue={profile.displayName} required minLength={2} maxLength={60} /></label>
            <label>تاريخ الميلاد<input name="birthDate" type="date" defaultValue={profile.birthDate || ''} /></label>
            <div className="two-cols"><label>الطول (سم)<input name="heightCm" type="number" min="100" max="230" step="0.1" defaultValue={profile.heightCm ?? ''} /></label><label>الوزن (كجم)<input name="weightKg" type="number" min="25" max="350" step="0.1" defaultValue={profile.weightKg ?? ''} /></label></div>
            <div className="two-cols"><label>الهدف<select name="goal" defaultValue={profile.goal}><option value="FAT_LOSS">خسارة الدهون</option><option value="MUSCLE_GAIN">بناء العضلات</option><option value="STRENGTH">القوة</option><option value="ENDURANCE">التحمل</option><option value="MOBILITY">المرونة والحركة</option><option value="GENERAL">لياقة عامة</option></select></label><label>المستوى<select name="experienceLevel" defaultValue={profile.experienceLevel}><option value="BEGINNER">مبتدئ</option><option value="INTERMEDIATE">متوسط</option><option value="ADVANCED">متقدم</option></select></label></div>
            <div className="two-cols"><label>أيام التدريب أسبوعيًا<input name="trainingDaysPerWeek" type="number" min="1" max="7" defaultValue={profile.trainingDaysPerWeek} /></label><label>مدة الجلسة بالدقائق<input name="sessionMinutes" type="number" min="10" max="180" defaultValue={profile.sessionMinutes} /></label></div>
            <label>المعدات المتاحة (افصل بينها بفاصلة)<input name="equipment" defaultValue={profile.equipment.join(', ')} placeholder="دمبل، مقاومة، بساط" /></label>
            <label>ملاحظات السلامة أو القيود<textarea name="safetyNotes" rows={3} defaultValue={profile.safetyNotes || ''} placeholder="اكتب فقط ما يلزم لتعديل التمارين بأمان." /></label>
            <button className="primary" disabled={busy}>حفظ الملف الرياضي</button>
          </form>
        </section>
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">EXERCISE LIBRARY</p><h2>مكتبة التمارين</h2></div><span className="pill">{exercises.length} تمرين</span></div>
          <div className="exercise-list">
            {exercises.map((exercise) => <article className="exercise-card" key={exercise.id}><div><h3>{exercise.nameAr}</h3><p>{exercise.nameEn}</p><small>{exercise.descriptionAr}</small><span className="level">{exercise.difficulty}</span></div>{activeWorkout && <button className="outline" disabled={busy} onClick={() => logExercise(exercise.id)}>تسجيل المجموعة {(setCounts[exercise.id] || 0) + 1}</button>}</article>)}
            {!exercises.length && <p className="muted">لا توجد تمارين منشورة بعد. ستظهر هنا عند إضافتها إلى المكتبة.</p>}
          </div>
        </section>
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">PERSONAL TRAINING</p><h2>خططي التدريبية</h2></div><button className="outline" onClick={generatePlan} disabled={busy}>إنشاء خطة</button></div>
          {plans.length ? <div className="history-list">{plans.map((plan) => <div className="history-row" key={plan.id}><div><strong>{plan.title}</strong><p>{plan._count?.days ?? 0} أيام · {plan.goal}</p></div><div className="plan-actions"><span className={plan.status === 'ACTIVE' ? 'status done' : 'status'}>{plan.status === 'ACTIVE' ? 'نشطة' : plan.status === 'DRAFT' ? 'مسودة' : plan.status}</span>{plan.status !== 'ACTIVE' && <button className="outline" disabled={busy} onClick={() => activatePlan(plan.id)}>تفعيل</button>}</div></div>)}</div> : <p className="muted">أنشئ خطة أولية بناءً على ملفك الرياضي والتمارين المنشورة.</p>}
        </section>
        <section className="panel history-panel">
          <div className="section-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2>سجل التدريب</h2></div><span className="pill">{workouts.length} جلسات</span></div>
          {workouts.length ? <div className="history-list">{workouts.map((workout) => <div className="history-row" key={workout.id}><div><strong>{new Date(workout.startedAt).toLocaleDateString('ar-EG')}</strong><p>{workout._count?.sets ?? 0} مجموعات مسجلة</p></div><span className={workout.status === 'COMPLETED' ? 'status done' : 'status'}>{workout.status === 'COMPLETED' ? 'مكتملة' : 'قيد التنفيذ'}</span></div>)}</div> : <p className="muted">لم تسجل جلسات بعد. ابدأ أول جلسة عندما تكون مستعدًا.</p>}
        </section>
      </div>
      <footer>ZYVON AI · إصدار تأسيسي · البيانات الرياضية ملك لحسابك</footer>
    </main>
  );
}
