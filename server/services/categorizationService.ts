
import { db } from '../db/database';

/**
 * Standard expense categories
 */
const STANDARD_CATEGORIES = {
  'alimentação': ['comida', 'restaurante', 'pizza', 'burger', 'sushi', 'delivery', 'ifood', 'uber eats', 'supermercado', 'mercado', 'açougue', 'padaria', 'feira', 'almoço', 'café', 'lanche'],
  'transporte': ['uber', 'lyft', '99', 'taxi', 'ônibus', 'metrô', 'combustível', 'gasolina', 'diesel', 'carro', 'moto', 'bicicleta', 'passagem', 'estacionamento', 'pedágio'],
  'moradia': ['aluguel', 'hipoteca', 'condomínio', 'água', 'luz', 'gás', 'energia', 'conta', 'telefone', 'internet', 'wifi', 'reparos', 'manutenção', 'pintura', 'reforma'],
  'saúde': ['farmácia', 'medicamento', 'doutor', 'médico', 'dentista', 'hospital', 'clínica', 'psicólogo', 'academia', 'musculação', 'yoga', 'pilates', 'vitamina', 'suplemento'],
  'lazer': ['cinema', 'filme', 'show', 'concerto', 'festa', 'bar', 'discoteca', 'jogo', 'game', 'livro', 'música', 'netflix', 'spotify', 'viagem', 'hotel', 'pousada'],
  'educação': ['curso', 'aula', 'escola', 'universidade', 'livro', 'apostila', 'material escolar', 'faculdade', 'treinamento', 'certificado'],
  'vestuário': ['roupa', 'sapato', 'blusa', 'calça', 'vestido', 'camiseta', 'tênis', 'bota', 'jaqueta', 'shorts', 'acessórios', 'bolsa', 'moda'],
  'beleza': ['cabelo', 'manicure', 'pedicure', 'salão', 'cosmético', 'shampoo', 'condicionador', 'perfume', 'desodorante', 'creme', 'maquiagem'],
  'eletrônicos': ['computador', 'celular', 'smartphone', 'tablet', 'monitor', 'teclado', 'mouse', 'headphone', 'fone', 'tecnologia', 'gadget', 'eletrônico'],
  'utilities': ['seguro', 'imposto', 'taxa', 'taxa de serviço', 'juros', 'multa', 'anuidade', 'mensalidade'],
  'outros': []
};

interface CategorizedTransaction {
  category: string;
  confidence: number;
  isConfident: boolean;
}

/**
 * Categorize a transaction based on its description using NLP-like matching
 * First checks user feedback history, then applies intelligent pattern matching
 */
export async function categorizeTransaction(
  description: string,
  userId: number
): Promise<CategorizedTransaction> {
  console.log(`[Categorization] Processing: "${description}" for user ${userId}`);
  
  // 1. Check user feedback history first
  const feedback = await getUserCategoryFeedback(userId, description);
  if (feedback) {
    console.log(`[Categorization] Found user feedback: ${feedback}`);
    return {
      category: feedback,
      confidence: 1.0,
      isConfident: true
    };
  }

  // 2. Apply intelligent pattern matching
  const result = matchCategory(description.toLowerCase());
  console.log(`[Categorization] Matched category: ${result.category} (confidence: ${result.confidence})`);
  
  return result;
}

/**
 * Check if user has previously provided feedback for similar descriptions
 */
async function getUserCategoryFeedback(
  userId: number,
  description: string
): Promise<string | null> {
  try {
    // Look for exact or very similar descriptions in feedback
    const feedback = await db
      .selectFrom('category_feedback')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();

    const lowerDesc = description.toLowerCase();
    for (const fb of feedback) {
      const similarity = calculateStringSimilarity(
        lowerDesc,
        fb.original_description.toLowerCase()
      );
      if (similarity > 0.8) {
        return fb.user_provided_category;
      }
    }
  } catch (error) {
    console.error('[Categorization] Error fetching user feedback:', error);
  }

  return null;
}

/**
 * Match description against standard categories using keyword matching
 */
function matchCategory(description: string): CategorizedTransaction {
  const words = description.split(/\s+/);
  const scores: Record<string, number> = {};

  // Initialize scores
  Object.keys(STANDARD_CATEGORIES).forEach(cat => {
    scores[cat] = 0;
  });

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(STANDARD_CATEGORIES)) {
    for (const keyword of keywords) {
      for (const word of words) {
        const wordLower = word.toLowerCase().replace(/[^\w\s]/g, '');
        if (wordLower === keyword || wordLower.includes(keyword) || keyword.includes(wordLower)) {
          scores[category]++;
        }
      }
    }
  }

  // Find the best match
  let bestCategory = 'outros';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Calculate confidence based on score
  const maxPossibleScore = Math.max(...Object.values(scores).filter(s => s > 0), 1);
  const confidence = bestScore > 0 ? bestScore / (maxPossibleScore + 1) : 0;
  const isConfident = confidence > 0.3;

  return {
    category: bestCategory,
    confidence,
    isConfident
  };
}

/**
 * Simple string similarity algorithm (Levenshtein-like)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Save user feedback for a transaction category (learning mechanism)
 */
export async function saveCategoryFeedback(
  userId: number,
  description: string,
  userCategory: string,
  aiSuggestedCategory: string | null = null
): Promise<void> {
  try {
    await db
      .insertInto('category_feedback')
      .values({
        user_id: userId,
        original_description: description,
        user_provided_category: userCategory,
        ai_suggested_category: aiSuggestedCategory
      })
      .execute();
    
    console.log(`[Categorization] Saved feedback: "${description}" -> ${userCategory}`);
  } catch (error) {
    console.error('[Categorization] Error saving feedback:', error);
  }
}

/**
 * Get all standard categories available
 */
export function getStandardCategories(): string[] {
  return Object.keys(STANDARD_CATEGORIES);
}
