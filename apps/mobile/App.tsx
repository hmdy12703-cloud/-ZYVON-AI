import { useState } from 'react';
import type { FormEvent } from 'react';
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

export default function App() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('RULE_BASED');

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
    if (!response.ok) throw new Error(body.message || 'Request failed');
    return body;
  }

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

  async function sendQuestion() {
    const text = question.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setQuestion('');
    setBusy(true);
    setError('');
    try {
      const result = await request('/coach/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setMessages((current) => [...current, { role: 'coach', text: result.reply }]);
      setMode(result.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coach is unavailable');
    } finally {
      setBusy(false);
    }
  }

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
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>مدربك الذكي</Text>
              <Text style={styles.pill}>{mode === 'AI' ? 'AI' : 'إرشادي'}</Text>
            </View>
            <Text style={styles.muted}>اسأل عن التمارين أو جدولك أو أهدافك. هذه الإرشادات ليست تشخيصًا طبيًا.</Text>
            <View style={styles.thread}>
              {messages.length === 0 && <Text style={styles.muted}>مثال: كيف أبدأ إحماء قبل التمرين؟</Text>}
              {messages.map((item, index) => (
                <View key={index} style={[styles.bubble, item.role === 'user' && styles.userBubble]}>
                  <Text style={styles.bubbleLabel}>{item.role === 'user' ? 'أنت' : 'ZYVON AI'}</Text>
                  <Text style={styles.bubbleText}>{item.text}</Text>
                </View>
              ))}
              {busy && <ActivityIndicator color="#70d7ff" />}
            </View>
            <TextInput style={[styles.input, styles.question]} value={question} onChangeText={setQuestion} maxLength={1000} multiline placeholder="اكتب سؤالك..." placeholderTextColor="#8293aa" />
            <Pressable style={styles.primary} onPress={sendQuestion} disabled={busy || !question.trim()}>
              <Text style={styles.primaryText}>إرسال السؤال</Text>
            </Pressable>
            <Pressable onPress={() => { setToken(''); setMessages([]); }}><Text style={styles.link}>تسجيل الخروج</Text></Pressable>
          </View>
        )}
        {!!error && <Text style={styles.error}>{String(error)}</Text>}
        <Text style={styles.footer}>نسخة أولية · ZYVON AI</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071422' },
  content: { flexGrow: 1, padding: 22, paddingTop: 64, paddingBottom: 40, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#70d7ff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#071422', fontSize: 34, fontWeight: '900' },
  brand: { color: '#f3f7ff', fontSize: 30, fontWeight: '900', letterSpacing: 2, marginTop: 12 },
  accent: { color: '#70d7ff' },
  tagline: { color: '#8293aa', fontSize: 10, letterSpacing: 2, marginTop: 5 },
  card: { backgroundColor: '#111c2e', borderColor: '#29384e', borderWidth: 1, borderRadius: 22, padding: 20, gap: 14 },
  title: { color: '#f3f7ff', fontSize: 21, fontWeight: '800' },
  input: { backgroundColor: '#0c1626', color: '#f3f7ff', borderColor: '#34445c', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, textAlign: 'right' },
  primary: { backgroundColor: '#70d7ff', borderRadius: 12, padding: 15, alignItems: 'center' },
  primaryText: { color: '#071422', fontWeight: '800', fontSize: 15 },
  link: { color: '#70d7ff', textAlign: 'center', padding: 8 },
  muted: { color: '#9cabc1', lineHeight: 22, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { color: '#70d7ff', borderColor: '#34516a', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },
  thread: { backgroundColor: '#0b1524', borderRadius: 14, padding: 12, gap: 10, minHeight: 160 },
  bubble: { alignSelf: 'flex-start', backgroundColor: '#14263a', borderColor: '#34516a', borderWidth: 1, borderRadius: 12, padding: 12, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#12354a' },
  bubbleLabel: { color: '#70d7ff', fontSize: 11, fontWeight: '800' },
  bubbleText: { color: '#f3f7ff', lineHeight: 21, marginTop: 4, textAlign: 'right' },
  question: { minHeight: 64, textAlignVertical: 'top' },
  error: { color: '#ffc1c7', backgroundColor: '#49232b', padding: 12, borderRadius: 10, marginTop: 16 },
  footer: { color: '#65758d', textAlign: 'center', marginTop: 28, fontSize: 11 },
});
