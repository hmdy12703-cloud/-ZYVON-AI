import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

type CoachMessage = { role: 'user' | 'coach'; text: string };
type Exercise = { id: string; nameAr: string; nameEn: string; descriptionAr: string; difficulty: string };
type Workout = { id: string; status: string; startedAt: string; _count?: { sets: number } };
type WorkoutDetail = { id: string; status: string; startedAt: string; completedAt?: string | null; perceivedEffort?: number | null; feedback?: string | null; sets: WorkoutSet[] };
type WorkoutSet = { id: string; exerciseId: string; setNumber: number; reps: number | null; loadKg: number | null; durationSeconds: number | null; exercise?: { nameAr: string; nameEn: string } };
type TrainingPlan = { id: string; title: string; goal: string; status: string; startDate?: string | null; _count?: { days: number }; days?: Array<{ id: string; dayNumber: number; title?: string | null; exercises: Array<{ id: string; sets: number; repsMin: number; repsMax: number; durationSeconds?: number | null; restSeconds: number; exercise: { id: string; nameAr: string; nameEn: string; difficulty: string } }> }> };
type WorkoutProgress = { sessions: Array<{ id: string; completedAt: string | null; completedSets: number; volumeKg: number }>; totals: { completedSessions: number; completedSets: number; volumeKg: number } };
type Progression = { basedOnSessions: number; recommendations: Array<{ exerciseId: string; action: string; suggestedLoadKg: number | null; reason: string }>; safetyMessage: string };
type NutritionLog = { id: string; calories?: number; proteinGrams?: number; carbsGrams?: number; fatGrams?: number; loggedAt: string; notes?: string };
type Profile = { displayName: string; heightCm: string; weightKg: string; goal: string; experienceLevel: string; trainingDaysPerWeek: string; sessionMinutes: string; equipment: string; safetyNotes: string };

const emptyProfile: Profile = {
  displayName: '', heightCm: '', weightKg: '', goal: 'GENERAL', experienceLevel: 'BEGINNER',
  trainingDaysPerWeek: '3', sessionMinutes: '45', equipment: '', safetyNotes: '',
};

export default function App() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mode, setMode] = useState('RULE_BASED');
  const [screen, setScreen] = useState<'home' | 'profile' | 'training' | 'nutrition' | 'coach' | 'feedback' | 'plans'>('home');
  const [feedbackRating, setFeedbackRating] = useState('5');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState('');
  const [activeSets, setActiveSets] = useState<WorkoutSet[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [reps, setReps] = useState('10');
  const [loadKg, setLoadKg] = useState('');
  const [sessionEffort, setSessionEffort] = useState('5');
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
  const [progression, setProgression] = useState<Progression | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealNotes, setMealNotes] = useState('');

  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join('، ') : body.message || 'Request failed');
    return body;
  }

  async function loadDashboard() {
    setBusy(true);
    setError('');
    try {
      const [savedProfile, exerciseResult, workoutResult, nutritionResult, planResult] = await Promise.all([
        request('/users/me/profile').catch(() => null),
        request('/exercises?limit=30'),
        request('/workouts?limit=20'),
        request('/nutrition/logs'),
        request('/plans').catch(() => []),
      ]);
      if (savedProfile) setProfile({
        ...emptyProfile,
        ...savedProfile,
        heightCm: savedProfile.heightCm == null ? '' : String(savedProfile.heightCm),
        weightKg: savedProfile.weightKg == null ? '' : String(savedProfile.weightKg),
        trainingDaysPerWeek: String(savedProfile.trainingDaysPerWeek ?? 3),
        sessionMinutes: String(savedProfile.sessionMinutes ?? 45),
        equipment: Array.isArray(savedProfile.equipment) ? savedProfile.equipment.join(', ') : '',
        safetyNotes: savedProfile.safetyNotes || '',
      });
      setExercises(exerciseResult.data || []);
      setPlans(Array.isArray(planResult) ? planResult : []);
      const sessions: Workout[] = workoutResult.data || [];
      setWorkouts(sessions);
      const activeId = sessions.find((item) => item.status === 'IN_PROGRESS')?.id || '';
      setActiveWorkout(activeId);
      if (activeId) {
        const detail = await request(`/workouts/${activeId}`);
        setActiveSets(Array.isArray(detail.sets) ? detail.sets : []);
      } else {
        setActiveSets([]);
      }
      setNutrition(Array.isArray(nutritionResult) ? nutritionResult : []);
      const [progressionResult, progressResult] = await Promise.all([
        request('/plans/progression/recommendations').catch(() => null),
        request('/workouts/progress').catch(() => null),
      ]);
      setProgression(progressionResult);
      setWorkoutProgress(progressResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your dashboard');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (token) void loadDashboard();
  }, [token]);

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      const result = await request(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setToken(result.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setError('');
    try {
      const payload = {
        displayName: profile.displayName.trim() || 'ZYVON Athlete',
        heightCm: profile.heightCm ? Number(profile.heightCm) : null,
        weightKg: profile.weightKg ? Number(profile.weightKg) : null,
        goal: profile.goal,
        experienceLevel: profile.experienceLevel,
        trainingDaysPerWeek: Number(profile.trainingDaysPerWeek),
        sessionMinutes: Number(profile.sessionMinutes),
        equipment: profile.equipment.split(',').map((item) => item.trim()).filter(Boolean),
        safetyNotes: profile.safetyNotes.trim() || null,
        preferredLanguage: 'ar',
      };
      await request('/users/me/profile', { method: 'PATCH', body: JSON.stringify(payload) });
      setProfile((current) => ({ ...current, displayName: payload.displayName }));
      setError('');
      setScreen('home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setBusy(false);
    }
  }

  async function openWorkout(workoutId: string) {
    setBusy(true);
    setError('');
    try {
      const detail = await request(`/workouts/${workoutId}`);
      setSelectedWorkout(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل تفاصيل الجلسة');
    } finally {
      setBusy(false);
    }
  }

  async function generatePlan() {
    setBusy(true);
    setError('');
    try {
      const plan = await request('/plans/generate', { method: 'POST' });
      setSelectedPlan(plan);
      setPlans((current) => [plan, ...current.filter((item) => item.id !== plan.id)]);
      setScreen('plans');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إنشاء الخطة');
    } finally {
      setBusy(false);
    }
  }

  async function openPlan(planId: string) {
    setBusy(true);
    setError('');
    try {
      const plan = await request(`/plans/${planId}`);
      setSelectedPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل تفاصيل الخطة');
    } finally {
      setBusy(false);
    }
  }

  async function activatePlan(planId: string) {
    setBusy(true);
    setError('');
    try {
      const plan = await request(`/plans/${planId}/activate`, { method: 'POST' });
      setSelectedPlan(plan);
      setPlans((current) => current.map((item) => item.id === planId ? { ...item, status: 'ACTIVE' } : { ...item, status: item.status === 'ACTIVE' ? 'ARCHIVED' : item.status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تفعيل الخطة');
    } finally {
      setBusy(false);
    }
  }

  async function startWorkout(trainingPlanId?: string) {
    setBusy(true);
    setError('');
    try {
      const result = await request('/workouts', { method: 'POST', body: JSON.stringify(trainingPlanId ? { trainingPlanId } : {}) });
      setActiveWorkout(result.id);
      setScreen('training');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start workout');
    } finally {
      setBusy(false);
    }
  }

  async function addSet() {
    if (!activeWorkout || !selectedExercise) {
      setError('ابدأ جلسة واختر تمرينًا أولًا.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const detail = await request(`/workouts/${activeWorkout}`);
      const previous = (detail.sets || []).filter((item: { exerciseId: string }) => item.exerciseId === selectedExercise).reduce((max: number, item: { setNumber: number }) => Math.max(max, item.setNumber), 0);
      await request(`/workouts/${activeWorkout}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: selectedExercise,
          setNumber: previous + 1,
          reps: Number(reps),
          ...(loadKg.trim() ? { loadKg: Number(loadKg) } : {}),
          completed: true,
        }),
      });
      setReps('10');
      setLoadKg('');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save set');
    } finally {
      setBusy(false);
    }
  }

  async function finishWorkout() {
    if (!activeWorkout) return;
    setBusy(true);
    setError('');
    try {
      await request(`/workouts/${activeWorkout}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          perceivedEffort: Number(sessionEffort),
          ...(sessionFeedback.trim() ? { feedback: sessionFeedback.trim() } : {}),
        }),
      });
      setActiveWorkout('');
      setSessionEffort('5');
      setSessionFeedback('');
      await loadDashboard();
      setScreen('home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete workout');
    } finally {
      setBusy(false);
    }
  }

  async function saveNutrition() {
    const payload: Record<string, number | string> = {};
    if (calories.trim()) payload.calories = Number(calories);
    if (protein.trim()) payload.proteinGrams = Number(protein);
    if (carbs.trim()) payload.carbsGrams = Number(carbs);
    if (fat.trim()) payload.fatGrams = Number(fat);
    if (mealNotes.trim()) payload.notes = mealNotes.trim();
    if (!Object.keys(payload).some((key) => key !== 'notes')) {
      setError('أدخل قيمة غذائية واحدة على الأقل.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await request('/nutrition/logs', { method: 'POST', body: JSON.stringify(payload) });
      setCalories(''); setProtein(''); setCarbs(''); setFat(''); setMealNotes('');
      const result = await request('/nutrition/logs');
      setNutrition(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save nutrition');
    } finally {
      setBusy(false);
    }
  }

  async function sendQuestion() {
    const text = question.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setQuestion('');
    setBusy(true);
    setError('');
    try {
      const result = await request('/coach/chat', { method: 'POST', body: JSON.stringify({ message: text }) });
      setMessages((current) => [...current, { role: 'coach', text: result.reply }]);
      setMode(result.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coach is unavailable');
    } finally {
      setBusy(false);
    }
  }

  function updateProfile(field: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function signOut() {
    setToken('');
    setMessages([]);
    setProfile(emptyProfile);
    setNutrition([]);
    setWorkouts([]);
    setActiveWorkout('');
    setActiveSets([]);
  }

  const nav: Array<{ key: typeof screen; label: string }> = [
    { key: 'home', label: 'الرئيسية' },
    { key: 'profile', label: 'ملفي' },
    { key: 'training', label: 'التمرين' },
    { key: 'plans', label: 'خططي' },
    { key: 'nutrition', label: 'التغذية' },
    { key: 'coach', label: 'المدرب' },
    { key: 'feedback', label: 'تقييم التطبيق' },
  ];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>Z</Text></View>
          <Text style={styles.brand}>ZYVON <Text style={styles.accent}>AI</Text></Text>
          <Text style={styles.tagline}>YOUR PERFORMANCE, REIMAGINED</Text>
        </View>
        {!token ? (
          <View style={styles.card}>
            <Text style={styles.title}>{register ? 'إنشاء حساب جديد' : 'مرحبًا بعودتك'}</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="البريد الإلكتروني" placeholderTextColor="#8293aa" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="كلمة المرور (8 أحرف على الأقل)" placeholderTextColor="#8293aa" />
            <Pressable style={styles.primary} onPress={signIn} disabled={busy || !email.trim() || password.length < 8}>
              {busy ? <ActivityIndicator color="#071422" /> : <Text style={styles.primaryText}>{register ? 'إنشاء الحساب' : 'تسجيل الدخول'}</Text>}
            </Pressable>
            <Pressable onPress={() => setRegister((value) => !value)}><Text style={styles.link}>{register ? 'لديك حساب؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب'}</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={styles.nav}>
              {nav.map((item) => <Pressable key={item.key} style={[styles.navItem, screen === item.key && styles.navActive]} onPress={() => setScreen(item.key)}><Text style={styles.navText}>{item.label}</Text></Pressable>)}
            </View>
            {screen === 'home' && <View style={styles.card}>
              <Text style={styles.title}>لوحة الأداء</Text>
              <Text style={styles.muted}>مرحبًا بك في ZYVON AI. تابع تدريبك وتغذيتك وهدفك من مكان واحد.</Text>
              <View style={styles.stats}>
                <View style={styles.stat}><Text style={styles.statValue}>{workouts.length}</Text><Text style={styles.muted}>جلسات التدريب</Text></View>
                <View style={styles.stat}><Text style={styles.statValue}>{nutrition.length}</Text><Text style={styles.muted}>سجلات التغذية</Text></View>
                <View style={styles.stat}><Text style={styles.statValue}>{exercises.length}</Text><Text style={styles.muted}>تمارين متاحة</Text></View>
              </View>
              {activeWorkout ? <Text style={styles.pill}>لديك جلسة تدريب نشطة</Text> : <Pressable style={styles.primary} onPress={() => startWorkout()} disabled={busy}><Text style={styles.primaryText}>ابدأ جلسة تدريب</Text></Pressable>}
              {workoutProgress && <View style={styles.exercise}>
                <Text style={styles.subtitle}>تقدمك التدريبي</Text>
                <Text style={styles.muted}>آخر {workoutProgress.totals.completedSessions} جلسات مكتملة · {workoutProgress.totals.completedSets} مجموعة مكتملة · حجم تدريبي {workoutProgress.totals.volumeKg} كجم×تكرار</Text>
                {workoutProgress.sessions.map((item) => <View key={item.id} style={styles.row}>
                  <Text style={styles.muted}>{item.completedAt ? new Date(item.completedAt).toLocaleDateString('ar-EG') : 'جلسة مكتملة'}</Text>
                  <Text style={styles.muted}>{item.completedSets} مجموعة · {item.volumeKg} كجم×تكرار</Text>
                </View>)}
                {!workoutProgress.sessions.length && <Text style={styles.muted}>أكمل أول جلسة لتظهر مؤشرات تقدمك هنا.</Text>}
              </View>}
              {progression && <View style={styles.exercise}>
                <Text style={styles.subtitle}>توصيات تطور الأداء</Text>
                {progression.recommendations.length ? progression.recommendations.map((item) => {
                  const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                  return <View key={item.exerciseId}><Text style={styles.exerciseName}>{exercise?.nameAr || exercise?.nameEn || 'تمرين'}</Text><Text style={styles.muted}>{item.action === 'SMALL_LOAD_INCREASE' ? `وزن مقترح ${item.suggestedLoadKg} كجم` : item.action === 'ADD_ONE_REP' ? 'جرّب إضافة تكرار واحد' : 'حافظ على نفس المستوى'}</Text><Text style={styles.muted}>{item.reason}</Text></View>;
                }) : <Text style={styles.muted}>سجّل جلستين مكتملتين للتمرين نفسه لعرض توصيات التقدم.</Text>}
                <Text style={styles.muted}>{progression.safetyMessage}</Text>
              </View>}
              <Pressable onPress={() => setScreen('profile')}><Text style={styles.link}>أكمل ملفك الرياضي</Text></Pressable>
              <Pressable onPress={signOut}><Text style={styles.link}>تسجيل الخروج</Text></Pressable>
            </View>}
            {screen === 'profile' && <View style={styles.card}>
              <Text style={styles.title}>ملفي الرياضي</Text>
              <TextInput style={styles.input} value={profile.displayName} onChangeText={(v) => updateProfile('displayName', v)} placeholder="الاسم المعروض" placeholderTextColor="#8293aa" />
              <View style={styles.row}><TextInput style={styles.inputHalf} value={profile.heightCm} onChangeText={(v) => updateProfile('heightCm', v)} keyboardType="decimal-pad" placeholder="الطول سم" placeholderTextColor="#8293aa" /><TextInput style={styles.inputHalf} value={profile.weightKg} onChangeText={(v) => updateProfile('weightKg', v)} keyboardType="decimal-pad" placeholder="الوزن كجم" placeholderTextColor="#8293aa" /></View>
              <Text style={styles.muted}>الهدف</Text>
              <View style={styles.wrap}>{[['FAT_LOSS','خسارة الدهون'],['MUSCLE_GAIN','بناء العضلات'],['STRENGTH','القوة'],['ENDURANCE','التحمل'],['MOBILITY','المرونة'],['GENERAL','لياقة عامة']].map(([value,label]) => <Pressable key={value} style={[styles.choice, profile.goal === value && styles.choiceActive]} onPress={() => updateProfile('goal', value)}><Text style={styles.choiceText}>{label}</Text></Pressable>)}</View>
              <Text style={styles.muted}>المستوى</Text>
              <View style={styles.wrap}>{[['BEGINNER','مبتدئ'],['INTERMEDIATE','متوسط'],['ADVANCED','متقدم']].map(([value,label]) => <Pressable key={value} style={[styles.choice, profile.experienceLevel === value && styles.choiceActive]} onPress={() => updateProfile('experienceLevel', value)}><Text style={styles.choiceText}>{label}</Text></Pressable>)}</View>
              <TextInput style={styles.input} value={profile.trainingDaysPerWeek} onChangeText={(v) => updateProfile('trainingDaysPerWeek', v)} keyboardType="number-pad" placeholder="أيام التدريب أسبوعيًا" placeholderTextColor="#8293aa" />
              <TextInput style={styles.input} value={profile.sessionMinutes} onChangeText={(v) => updateProfile('sessionMinutes', v)} keyboardType="number-pad" placeholder="مدة الحصة بالدقائق" placeholderTextColor="#8293aa" />
              <TextInput style={styles.input} value={profile.equipment} onChangeText={(v) => updateProfile('equipment', v)} placeholder="المعدات، افصل بفاصلة" placeholderTextColor="#8293aa" />
              <TextInput style={styles.input} value={profile.safetyNotes} onChangeText={(v) => updateProfile('safetyNotes', v)} placeholder="ملاحظات السلامة أو القيود" placeholderTextColor="#8293aa" multiline />
              <Pressable style={styles.primary} onPress={saveProfile} disabled={busy}><Text style={styles.primaryText}>حفظ الملف الرياضي</Text></Pressable>
            </View>}
            {screen === 'plans' && <View style={styles.card}>
              <Text style={styles.title}>خططي التدريبية</Text>
              <Text style={styles.muted}>أنشئ خطة وفق ملفك الرياضي ومستواك والمعدات المتاحة، ثم راجع أيامها قبل التفعيل.</Text>
              <Pressable style={styles.primary} onPress={generatePlan} disabled={busy}><Text style={styles.primaryText}>إنشاء خطة ذكية</Text></Pressable>
              {plans.length === 0 && <Text style={styles.muted}>لا توجد خطط محفوظة بعد. أكمل ملفك الرياضي أولًا ثم أنشئ خطتك.</Text>}
              {plans.map((plan) => <View key={plan.id} style={styles.exercise}>
                <Text style={styles.exerciseName}>{plan.title}</Text>
                <Text style={styles.muted}>الهدف: {plan.goal} · الأيام: {plan._count?.days ?? plan.days?.length ?? '—'} · الحالة: {plan.status === 'ACTIVE' ? 'نشطة' : plan.status === 'DRAFT' ? 'مسودة' : 'مؤرشفة'}</Text>
                <Pressable onPress={() => openPlan(plan.id)}><Text style={styles.link}>عرض التفاصيل</Text></Pressable>
                {plan.status !== 'ACTIVE' && <Pressable onPress={() => activatePlan(plan.id)} disabled={busy}><Text style={styles.link}>تفعيل الخطة</Text></Pressable>}
              </View>)}
              {selectedPlan && <View style={styles.exercise}>
                <Text style={styles.subtitle}>تفاصيل {selectedPlan.title}</Text>
                {(selectedPlan.days || []).map((day) => <View key={day.id}>
                  <Text style={styles.exerciseName}>اليوم {day.dayNumber}{day.title ? ` — ${day.title}` : ''}</Text>
                  {day.exercises.map((entry) => <Text key={entry.id} style={styles.muted}>{entry.exercise.nameAr || entry.exercise.nameEn} · {entry.sets} مجموعات · {entry.repsMin}–{entry.repsMax} تكرار{entry.durationSeconds ? ` · مدة ${entry.durationSeconds} ثانية` : ''} · راحة {entry.restSeconds} ثانية</Text>)}
                </View>)}
                {selectedPlan.status !== 'ACTIVE' && <Pressable style={styles.primary} onPress={() => activatePlan(selectedPlan.id)} disabled={busy}><Text style={styles.primaryText}>تفعيل هذه الخطة</Text></Pressable>}
                {selectedPlan.status === 'ACTIVE' && !activeWorkout && <Pressable style={styles.primary} onPress={() => startWorkout(selectedPlan.id)} disabled={busy}><Text style={styles.primaryText}>ابدأ جلسة مرتبطة بالخطة</Text></Pressable>}
              </View>}
            </View>}
            {screen === 'training' && <View style={styles.card}>
              <Text style={styles.title}>سجل التدريب</Text>
              {!activeWorkout ? <Pressable style={styles.primary} onPress={() => startWorkout()} disabled={busy}><Text style={styles.primaryText}>ابدأ جلسة جديدة</Text></Pressable> : <>
                <Text style={styles.pill}>جلسة نشطة</Text>
                <Text style={styles.muted}>اختر تمرينًا وسجّل المجموعة بعد إتمامها.</Text>
                <View style={styles.exerciseList}>{exercises.map((exercise) => <Pressable key={exercise.id} style={[styles.exercise, selectedExercise === exercise.id && styles.choiceActive]} onPress={() => setSelectedExercise(exercise.id)}><Text style={styles.exerciseName}>{exercise.nameAr}</Text><Text style={styles.muted}>{exercise.nameEn}</Text></Pressable>)}</View>
                <Text style={styles.subtitle}>المجموعات المسجلة</Text>
                {activeSets.length === 0 ? <Text style={styles.muted}>لم تُسجل مجموعات بعد.</Text> : activeSets.map((item) => <View key={item.id} style={styles.exercise}><Text style={styles.exerciseName}>{item.exercise?.nameAr || item.exercise?.nameEn || 'تمرين'} · المجموعة {item.setNumber}</Text><Text style={styles.muted}>{item.reps ?? '—'} تكرار · {item.loadKg ?? '—'} كجم</Text></View>)}
                <View style={styles.row}><TextInput style={styles.inputHalf} value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="التكرارات" placeholderTextColor="#8293aa" /><TextInput style={styles.inputHalf} value={loadKg} onChangeText={setLoadKg} keyboardType="decimal-pad" placeholder="الوزن كجم (اختياري)" placeholderTextColor="#8293aa" /></View>
                <Pressable style={styles.primary} onPress={addSet} disabled={busy || !selectedExercise}><Text style={styles.primaryText}>حفظ المجموعة</Text></Pressable>
                <Text style={styles.subtitle}>تقييم المجهود بعد التمرين (1–10)</Text>
                <TextInput style={styles.input} value={sessionEffort} onChangeText={setSessionEffort} keyboardType="number-pad" placeholder="من 1 إلى 10" placeholderTextColor="#8293aa" />
                <TextInput style={styles.input} value={sessionFeedback} onChangeText={setSessionFeedback} multiline placeholder="هل شعرت بألم أو تنميل أو إجهاد غير معتاد؟ اكتب ملاحظاتك (اختياري)" placeholderTextColor="#8293aa" />
                <Pressable style={styles.finish} onPress={finishWorkout} disabled={busy}><Text style={styles.primaryText}>إنهاء الجلسة وحفظ التقييم</Text></Pressable>
              </>}
              <Text style={styles.subtitle}>الجلسات السابقة</Text>
              {workouts.map((item) => <Pressable key={item.id} style={styles.exercise} onPress={() => openWorkout(item.id)}><Text style={styles.exerciseName}>{new Date(item.startedAt).toLocaleDateString('ar-EG')} — {item.status === 'COMPLETED' ? 'مكتملة' : item.status === 'IN_PROGRESS' ? 'جارية' : 'متوقفة'}</Text><Text style={styles.link}>عرض تفاصيل الجلسة</Text></Pressable>)}
              {selectedWorkout && <View style={styles.exercise}>
                <Text style={styles.subtitle}>تفاصيل الجلسة المحددة</Text>
                <Text style={styles.muted}>بدأت: {new Date(selectedWorkout.startedAt).toLocaleString('ar-EG')}</Text>
                {selectedWorkout.completedAt && <Text style={styles.muted}>انتهت: {new Date(selectedWorkout.completedAt).toLocaleString('ar-EG')}</Text>}
                {selectedWorkout.perceivedEffort != null && <Text style={styles.muted}>المجهود: {selectedWorkout.perceivedEffort}/10</Text>}
                {!!selectedWorkout.feedback && <Text style={styles.muted}>ملاحظات: {selectedWorkout.feedback}</Text>}
                {selectedWorkout.sets.map((item) => <Text key={item.id} style={styles.muted}>{item.exercise?.nameAr || item.exercise?.nameEn || 'تمرين'} · المجموعة {item.setNumber} · {item.reps ?? '—'} تكرار · {item.loadKg ?? '—'} كجم</Text>)}
              </View>}
            </View>}
            {screen === 'nutrition' && <View style={styles.card}>
              <Text style={styles.title}>متابعة التغذية</Text>
              <Text style={styles.muted}>أدخل القيم المتاحة من وجبتك؛ لا نخمن محتوى الطعام.</Text>
              <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="number-pad" placeholder="السعرات الحرارية" placeholderTextColor="#8293aa" />
              <View style={styles.row}><TextInput style={styles.inputHalf} value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="البروتين جم" placeholderTextColor="#8293aa" /><TextInput style={styles.inputHalf} value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholder="الكربوهيدرات جم" placeholderTextColor="#8293aa" /></View>
              <TextInput style={styles.input} value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="الدهون جم" placeholderTextColor="#8293aa" />
              <TextInput style={styles.input} value={mealNotes} onChangeText={setMealNotes} placeholder="ملاحظات الوجبة" placeholderTextColor="#8293aa" />
              <Pressable style={styles.primary} onPress={saveNutrition} disabled={busy}><Text style={styles.primaryText}>حفظ الوجبة</Text></Pressable>
              <Text style={styles.subtitle}>ملخص اليوم</Text>
              <Text style={styles.muted}>{nutrition.filter((item) => new Date(item.loggedAt).toDateString() === new Date().toDateString()).reduce((sum, item) => sum + (item.calories || 0), 0)} سعرة · بروتين {nutrition.filter((item) => new Date(item.loggedAt).toDateString() === new Date().toDateString()).reduce((sum, item) => sum + (item.proteinGrams || 0), 0)} جم · كربوهيدرات {nutrition.filter((item) => new Date(item.loggedAt).toDateString() === new Date().toDateString()).reduce((sum, item) => sum + (item.carbsGrams || 0), 0)} جم · دهون {nutrition.filter((item) => new Date(item.loggedAt).toDateString() === new Date().toDateString()).reduce((sum, item) => sum + (item.fatGrams || 0), 0)} جم</Text>
              <Text style={styles.subtitle}>السجلات الأخيرة</Text>
              {nutrition.map((item) => <View key={item.id} style={styles.exercise}><Text style={styles.exerciseName}>{item.calories ?? '—'} سعرة · بروتين {item.proteinGrams ?? '—'} جم</Text><Text style={styles.muted}>{item.notes || new Date(item.loggedAt).toLocaleDateString('ar-EG')}</Text></View>)}
            </View>}
            {screen === 'feedback' && <View style={styles.card}>
              <Text style={styles.title}>تقييم تجربتك</Text>
              <Text style={styles.muted}>ساعدنا على تحسين ZYVON AI. قيّم تجربتك وأرسل ملاحظاتك.</Text>
              <Text style={styles.subtitle}>التقييم من 1 إلى 5</Text>
              <View style={styles.wrap}>
                {['1', '2', '3', '4', '5'].map((value) => <Pressable key={value} style={[styles.choice, feedbackRating === value && styles.choiceActive]} onPress={() => setFeedbackRating(value)}><Text style={styles.choiceText}>{value} ★</Text></Pressable>)}
              </View>
              <TextInput style={[styles.input, styles.question]} value={feedbackComment} onChangeText={setFeedbackComment} maxLength={1000} multiline placeholder="اكتب ملاحظاتك أو اقتراحاتك..." placeholderTextColor="#8293aa" />
              <Pressable style={styles.primary} disabled={busy} onPress={async () => {
                setBusy(true); setError(''); setSuccessMessage('');
                try {
                  await request('/feedback', { method: 'POST', body: JSON.stringify({ category: 'APP_EXPERIENCE', rating: Number(feedbackRating), comment: feedbackComment.trim() || undefined }) });
                  setFeedbackComment('');
                  setSuccessMessage('تم إرسال تقييمك بنجاح. شكرًا لمساعدتنا على التطوير.');
                } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال التقييم'); }
                finally { setBusy(false); }
              }}><Text style={styles.primaryText}>إرسال التقييم</Text></Pressable>
            </View>}
            {screen === 'coach' && <View style={styles.card}>
              <View style={styles.row}><Text style={styles.title}>مدربك الذكي</Text><Text style={styles.pill}>{mode === 'AI' ? 'AI' : 'إرشادي'}</Text></View>
              <Text style={styles.muted}>اسأل عن التمارين أو جدولك أو أهدافك. الإرشادات ليست تشخيصًا طبيًا.</Text>
              <View style={styles.thread}>
                {messages.length === 0 && <Text style={styles.muted}>مثال: كيف أبدأ إحماء قبل التمرين؟</Text>}
                {messages.map((item, index) => <View key={index} style={[styles.bubble, item.role === 'user' && styles.userBubble]}><Text style={styles.bubbleLabel}>{item.role === 'user' ? 'أنت' : 'ZYVON AI'}</Text><Text style={styles.bubbleText}>{item.text}</Text></View>)}
                {busy && <ActivityIndicator color="#70d7ff" />}
              </View>
              <TextInput style={[styles.input, styles.question]} value={question} onChangeText={setQuestion} maxLength={1000} multiline placeholder="اكتب سؤالك..." placeholderTextColor="#8293aa" />
              <Pressable style={styles.primary} onPress={sendQuestion} disabled={busy || !question.trim()}><Text style={styles.primaryText}>إرسال السؤال</Text></Pressable>
            </View>}
          </>
        )}
        {!!error && <Text style={styles.error}>{String(error)}</Text>}
        {!!successMessage && <Text style={styles.success}>{successMessage}</Text>}
        <Text style={styles.footer}>نسخة تطويرية · ZYVON AI · ليست بديلًا عن المختص الطبي</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071422' },
  content: { flexGrow: 1, padding: 18, paddingTop: 48, paddingBottom: 36 },
  header: { alignItems: 'center', marginBottom: 22 },
  logo: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#70d7ff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#071422', fontSize: 32, fontWeight: '900' },
  brand: { color: '#f3f7ff', fontSize: 28, fontWeight: '900', letterSpacing: 2, marginTop: 10 },
  accent: { color: '#70d7ff' },
  tagline: { color: '#8293aa', fontSize: 9, letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: '#111c2e', borderColor: '#29384e', borderWidth: 1, borderRadius: 20, padding: 17, gap: 12 },
  title: { color: '#f3f7ff', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#70d7ff', fontSize: 15, fontWeight: '800', marginTop: 10 },
  input: { backgroundColor: '#0c1626', color: '#f3f7ff', borderColor: '#34445c', borderWidth: 1, borderRadius: 11, padding: 13, fontSize: 14, textAlign: 'right' },
  inputHalf: { flex: 1, minWidth: 0, backgroundColor: '#0c1626', color: '#f3f7ff', borderColor: '#34445c', borderWidth: 1, borderRadius: 11, padding: 13, fontSize: 14, textAlign: 'right' },
  primary: { backgroundColor: '#70d7ff', borderRadius: 11, padding: 14, alignItems: 'center' },
  primaryText: { color: '#071422', fontWeight: '800', fontSize: 14 },
  finish: { backgroundColor: '#b64a58', borderRadius: 11, padding: 14, alignItems: 'center' },
  link: { color: '#70d7ff', textAlign: 'center', padding: 7 },
  muted: { color: '#9cabc1', lineHeight: 21, textAlign: 'right', fontSize: 12 },
  row: { flexDirection: 'row', gap: 9 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderColor: '#34445c', borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8 },
  choiceActive: { borderColor: '#70d7ff', backgroundColor: '#12354a' },
  choiceText: { color: '#dce8f7', fontSize: 11 },
  nav: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginBottom: 14 },
  navItem: { borderColor: '#34445c', borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 },
  navActive: { backgroundColor: '#12354a', borderColor: '#70d7ff' },
  navText: { color: '#e1efff', fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#0c1626', borderRadius: 12, padding: 11, alignItems: 'center' },
  statValue: { color: '#70d7ff', fontSize: 22, fontWeight: '900' },
  pill: { color: '#70d7ff', borderColor: '#34516a', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden', alignSelf: 'flex-start', fontSize: 11 },
  exerciseList: { gap: 7, maxHeight: 260 },
  exercise: { backgroundColor: '#0c1626', borderColor: '#29384e', borderWidth: 1, borderRadius: 11, padding: 11, gap: 4 },
  exerciseName: { color: '#f3f7ff', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  thread: { backgroundColor: '#0b1524', borderRadius: 13, padding: 11, gap: 9, minHeight: 150 },
  bubble: { alignSelf: 'flex-start', backgroundColor: '#14263a', borderColor: '#34516a', borderWidth: 1, borderRadius: 11, padding: 11, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#12354a' },
  bubbleLabel: { color: '#70d7ff', fontSize: 10, fontWeight: '800' },
  bubbleText: { color: '#f3f7ff', lineHeight: 20, marginTop: 4, textAlign: 'right', fontSize: 13 },
  question: { minHeight: 60, textAlignVertical: 'top' },
  success: { color: '#70d7a8', textAlign: 'center', marginTop: 12, fontWeight: '600' },
  error: { color: '#ffc1c7', backgroundColor: '#49232b', padding: 12, borderRadius: 10, marginTop: 14 },
  footer: { color: '#65758d', textAlign: 'center', marginTop: 22, fontSize: 10 },
});
