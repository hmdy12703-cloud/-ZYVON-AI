import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CoachMessageDto } from './dto/coach-message.dto';

type CoachReply = { reply: string; mode: 'AI' | 'RULE_BASED'; disclaimer: string };

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async ask(userId: string, dto: CoachMessageDto): Promise<CoachReply> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      return {
        reply: 'أكمل ملفك الرياضي أولًا حتى أقدر أخصص النصيحة لهدفك ومستواك ومعداتك.',
        mode: 'RULE_BASED',
        disclaimer: 'المعلومات عامة وليست تشخيصًا طبيًا.',
      };
    }

    const message = dto.message.trim();
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return {
        reply: this.buildStarterReply(profile, message),
        mode: 'RULE_BASED',
        disclaimer: 'المدرب الذكي غير موصول بمزود AI بعد. هذه إرشادات أولية آلية وليست تشخيصًا طبيًا.',
      };
    }

    const baseUrl = (this.config.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.4,
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content: [
                'You are ZYVON AI, a careful fitness education coach. Reply in the user preferred language.',
                'Use the supplied profile only to personalize general exercise guidance.',
                'Never diagnose, prescribe medication, or claim certainty about injuries.',
                'Do not encourage extreme dieting, dehydration, exercising through pain, or dangerous rapid weight loss.',
                'If the user reports chest pain, fainting, severe shortness of breath, new weakness, or loss of bladder/bowel control, advise stopping exercise and seeking urgent medical care.',
                'For persistent pain, numbness, pregnancy, chronic disease, or injury, recommend a qualified clinician before changing training.',
                'Give concise, practical steps and ask at most one clarification when essential.',
                `Profile: goal=${profile.goal}; level=${profile.experienceLevel}; days/week=${profile.trainingDaysPerWeek}; session minutes=${profile.sessionMinutes}; equipment=${JSON.stringify(profile.equipment)}; safety notes=${profile.safetyNotes || 'none'}.`,
              ].join('\n'),
            },
            { role: 'user', content: message },
          ],
        }),
      });
      if (!response.ok) {
        throw new ServiceUnavailableException('AI coach provider is temporarily unavailable');
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply || reply.length > 6000) {
        throw new ServiceUnavailableException('AI coach returned an invalid response');
      }
      return {
        reply,
        mode: 'AI',
        disclaimer: 'إرشادات لياقة عامة وليست تشخيصًا أو بديلًا عن المختص الطبي.',
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('AI coach request failed. Please try again later.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildStarterReply(profile: {
    goal: string;
    experienceLevel: string;
    trainingDaysPerWeek: number;
    sessionMinutes: number;
    preferredLanguage: string;
    safetyNotes: string | null;
  }, message: string): string {
    const arabic = profile.preferredLanguage === 'ar';
    const goal = ({
      FAT_LOSS: arabic ? 'خسارة الدهون تدريجيًا' : 'gradual fat loss',
      MUSCLE_GAIN: arabic ? 'بناء العضلات' : 'muscle gain',
      STRENGTH: arabic ? 'تطوير القوة' : 'strength development',
      ENDURANCE: arabic ? 'تحسين التحمل' : 'endurance',
      MOBILITY: arabic ? 'تحسين الحركة والمرونة' : 'mobility',
      GENERAL: arabic ? 'تحسين اللياقة العامة' : 'general fitness',
    } as Record<string, string>)[profile.goal] || profile.goal;
    if (arabic) {
      return `خلينا نشتغل على هدفك: ${goal}. مستواك الحالي ${profile.experienceLevel}، وجدولك ${profile.trainingDaysPerWeek} أيام أسبوعيًا، ومدة الحصة ${profile.sessionMinutes} دقيقة. ابدأ بإحماء 5–8 دقائق، واختَر تمارين تقدر تؤديها بتحكم، وزوّد الحمل تدريجيًا فقط مع أداء سليم. ${profile.safetyNotes ? 'ملحوظة: عندك ملاحظات سلامة مسجلة؛ لا تتجاهلها، وتجنب أي حركة تسبب ألمًا أو تنميلًا.' : 'توقف عند الألم الحاد أو الدوخة أو الأعراض غير المعتادة.'} بخصوص سؤالك: «${message.slice(0, 220)}» — وضّح لي التمرين أو الموقف بالتحديد لأعطيك إرشادًا أدق.`;
    }
    return `Let's work toward your goal: ${goal}. Your current level is ${profile.experienceLevel}, with ${profile.trainingDaysPerWeek} training days per week and ${profile.sessionMinutes}-minute sessions. Start with a 5–8 minute warm-up, use controlled technique, and progress gradually. ${profile.safetyNotes ? 'You have safety notes on file; do not ignore them and avoid movements that cause pain or numbness.' : 'Stop for sharp pain, dizziness, or unusual symptoms.'} About your question: "${message.slice(0, 220)}" — share the specific exercise or situation for more precise guidance.`;
  }
}
