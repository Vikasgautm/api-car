import { Car } from '../../../models/car.model';
import { Brand } from '../../../models/brand.model';
import { CarVariant } from '../../../models/car-variant.model';
import { PlatformSettingsService } from '../../settings/services/platform-settings.service';
import { AppError } from '../../../shared/utils/app-error.util';
import { getCerebrasClient, INTELLIGENCE_MODEL } from '../../../shared/services/cerebras-client';

export interface FAQDraftInput {
  entity_type?: string;
  entity_id?: string;
  topic?: string;
  existing_question?: string;
}

export interface FAQDraft {
  question: string;
  answer: string;
  suggested_tags: string[];
  faq_type: string;
  canonical_intent_key?: string;
  intent_type?: string;
  entity_type?: string;
  entity_id?: string;
  source_type: 'ai';
  model_used: string;
}

const VALID_FAQ_TYPES = [
  'editorial', 'specification', 'feature', 'performance', 'safety',
  'dimensions', 'comparison', 'ownership', 'upcoming', 'collection', 'aggregation',
];

// Stable system prompt — kept verbose and deterministic so it stays cache-friendly
// across drafts, mirroring the rubric pattern in CarIntelligenceLLMService.
const SYSTEM_PROMPT = `You are a senior automotive content editor for Carsalahakar, an Indian car-discovery platform.
Your job is to draft a single, high-quality FAQ (one question and one answer) for a web page about a car,
variant, or brand, grounded strictly in the factual context provided to you.

# Rules
- Write for a typical Indian car buyer: clear, helpful, neutral, and specific.
- Use ONLY the facts in the provided context. If a number or spec is not in the context, do NOT invent it —
  write a useful answer that stays accurate without fabricating figures.
- The question must be a natural query a real buyer would type or ask (10+ characters).
- The answer must be 2-4 sentences (at least 30 characters of real content), factual, and free of marketing fluff.
- Prices in the context are in rupees; present them in lakh (e.g. "₹10.5 lakh") when helpful.
- Do not include HTML tags unless a list genuinely helps; plain prose is preferred.
- Choose the most fitting faq_type from this list: ${VALID_FAQ_TYPES.join(', ')}.
- suggested_tags: 2-5 short lowercase tags (e.g. "mileage", "safety", "suv").
- canonical_intent_key: a short snake_case key describing the buyer intent (e.g. "car_mileage", "brand_service_network").

You will call the \`set_faq_draft\` tool exactly once. Do not produce any free-form text outside the tool call.`;

const SET_FAQ_DRAFT_TOOL = {
  type: 'function',
  function: {
    name: 'set_faq_draft',
    description: 'Record the drafted FAQ question and answer plus its metadata.',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The FAQ question, at least 10 characters.' },
        answer: { type: 'string', description: 'The FAQ answer, 2-4 factual sentences, at least 30 characters.' },
        suggested_tags: {
          type: 'array',
          items: { type: 'string' },
          description: '2-5 short lowercase tags.',
        },
        faq_type: { type: 'string', enum: VALID_FAQ_TYPES, description: 'The best-fitting FAQ type.' },
        canonical_intent_key: { type: 'string', description: 'Short snake_case buyer-intent key.' },
        intent_type: { type: 'string', description: 'Free-text intent label, e.g. "mileage".' },
      },
      required: ['question', 'answer', 'suggested_tags', 'faq_type'],
      additionalProperties: false,
    },
  },
};

const fmtPrice = (v?: number | null) =>
  v ? `₹${(v / 100000).toFixed(1)} lakh` : '—';

export class FAQAIDraftService {
  /**
   * Draft a single FAQ for an entity using the platform LLM (Cerebras).
   *
   * Mirrors CarIntelligenceLLMService: honours the `ai_intelligence` emergency
   * kill switch, reads the configured model, and forces a strict tool call so the
   * returned shape is guaranteed. The draft is NOT persisted — the editor reviews
   * and saves it via the normal create/update flow with source_type='ai'.
   */
  static async draftFAQ(input: FAQDraftInput): Promise<FAQDraft> {
    const { entity_type, entity_id, topic, existing_question } = input;

    if (!entity_id && !topic && !existing_question) {
      throw AppError.badRequest(
        'Provide an entity (entity_type + entity_id) or a topic to draft a FAQ.',
        'Select a car/variant/brand or enter a topic before drafting with AI.',
      );
    }

    // Live AI settings: emergency kill switch + model selection.
    let model = INTELLIGENCE_MODEL;
    try {
      const aiSettings = (await PlatformSettingsService.getSettingsByGroup('ai_intelligence')) as Record<string, any>;
      if (aiSettings.emergency_ai_off === true) {
        throw AppError.serviceUnavailable(
          'AI drafting is disabled via emergency kill switch (Settings → AI Intelligence → Emergency AI Off).',
          'AI drafting is currently disabled by an administrator.',
        );
      }
      if (aiSettings.model) model = aiSettings.model;
    } catch (err: any) {
      if (err.message?.includes('emergency kill switch')) throw err;
      // Settings unavailable — fall back to compiled-in default model.
    }

    const context = await FAQAIDraftService.buildEntityContext(entity_type, entity_id, topic);

    const client = getCerebrasClient();
    const response = await client.chat.completions.create({
      model,
      max_tokens: 1024,
      tools: [SET_FAQ_DRAFT_TOOL as any],
      tool_choice: { type: 'function', function: { name: 'set_faq_draft' } },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Draft one FAQ based on the following context.${
            existing_question ? `\n\nThe editor wants to answer this specific question: "${existing_question}". Keep the question close to this.` : ''
          }

# Context
${context}

Call set_faq_draft once with your drafted question and answer.`,
        },
      ],
    });

    const toolCall = (response as any).choices?.[0]?.message?.tool_calls?.find(
      (b: any) => b.function?.name === 'set_faq_draft',
    );
    if (!toolCall) {
      throw AppError.internal(
        'LLM did not return a tool_use response — drafting failed.',
        'AI drafting failed. Please try again.',
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      throw AppError.internal('Failed to parse AI draft output.', 'AI drafting failed. Please try again.');
    }

    const faqType = VALID_FAQ_TYPES.includes(parsed.faq_type) ? parsed.faq_type : 'editorial';

    return {
      question: String(parsed.question ?? '').trim(),
      answer: String(parsed.answer ?? '').trim(),
      suggested_tags: Array.isArray(parsed.suggested_tags)
        ? parsed.suggested_tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 5)
        : [],
      faq_type: faqType,
      canonical_intent_key: parsed.canonical_intent_key ? String(parsed.canonical_intent_key).trim() : undefined,
      intent_type: parsed.intent_type ? String(parsed.intent_type).trim() : undefined,
      entity_type,
      entity_id,
      source_type: 'ai',
      model_used: (response as any).model || model,
    };
  }

  /**
   * Build a compact, factual context snapshot for the entity. Reads cached
   * aggregate fields off the Car document (no heavy recompute) and the parent
   * car's embedded variant subdocument for variants.
   */
  private static async buildEntityContext(
    entityType?: string,
    entityId?: string,
    topic?: string,
  ): Promise<string> {
    const lines: string[] = [];
    if (topic) lines.push(`Topic requested by editor: ${topic}`);

    if (!entityType || !entityId) {
      return lines.length ? lines.join('\n') : 'No specific entity — write a general, evergreen FAQ for the platform.';
    }

    try {
      if (entityType === 'car') {
        const car = await Car.findOne({ car_id: entityId, is_deleted: false }).lean();
        if (car) lines.push(FAQAIDraftService.serializeCar(car));
      } else if (entityType === 'variant') {
        const variant = await CarVariant.findOne({ variant_id: entityId, is_deleted: false }).lean();
        if (variant) {
          const v = variant as any;
          // Parent car gives rolled-up specs to ground the answer.
          const car = v.car_id ? await Car.findOne({ car_id: v.car_id, is_deleted: false }).lean() : null;
          if (car) lines.push(FAQAIDraftService.serializeCar(car));
          lines.push(`Variant: ${v.variant_name ?? entityId}`);
          if (v.transmission_type) lines.push(`Variant transmission: ${v.transmission_type}`);
          if (v.mileage_class_value) lines.push(`Variant mileage class: ${v.mileage_class ?? ''} (${v.mileage_class_value})`);
        }
      } else if (entityType === 'brand') {
        const brand = await Brand.findOne({ brand_id: entityId }).lean();
        if (brand) {
          lines.push(`Brand: ${(brand as any).name}`);
          if ((brand as any).country) lines.push(`Country of origin: ${(brand as any).country}`);
          if ((brand as any).description) lines.push(`About: ${String((brand as any).description).slice(0, 500)}`);
        }
      } else {
        lines.push(`Entity type: ${entityType} (id: ${entityId})`);
      }
    } catch {
      // Entity lookup failed — fall back to whatever we have.
    }

    return lines.length
      ? lines.join('\n')
      : `Entity type: ${entityType} (id: ${entityId}). No additional context available — keep the answer general and accurate.`;
  }

  private static serializeCar(car: any): string {
    const parts = [
      `Car: ${car.name} (${car.slug})`,
      car.description ? `Description: ${String(car.description).slice(0, 400)}` : '',
      `Price (ex-showroom): ${fmtPrice(car.min_variant_price)} → ${fmtPrice(car.max_variant_price)}`,
      car.aggregated_fuel_types?.length ? `Fuel types: ${car.aggregated_fuel_types.join(', ')}` : '',
      car.aggregated_transmission_types?.length ? `Transmissions: ${car.aggregated_transmission_types.join(', ')}` : '',
      car.aggregated_drive_types?.length ? `Drive types: ${car.aggregated_drive_types.join(', ')}` : '',
      car.power_min_bhp || car.power_max_bhp ? `Power: ${car.power_min_bhp ?? '—'}–${car.power_max_bhp ?? '—'} bhp` : '',
      car.torque_min_nm || car.torque_max_nm ? `Torque: ${car.torque_min_nm ?? '—'}–${car.torque_max_nm ?? '—'} Nm` : '',
      car.mileage_min_kmpl || car.mileage_max_kmpl ? `Mileage: ${car.mileage_min_kmpl ?? '—'}–${car.mileage_max_kmpl ?? '—'} kmpl` : '',
      car.range_min_km || car.range_max_km ? `EV range: ${car.range_min_km ?? '—'}–${car.range_max_km ?? '—'} km` : '',
    ];
    return parts.filter(Boolean).join('\n');
  }
}
