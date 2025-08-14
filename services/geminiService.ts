import { GoogleGenAI } from "@google/genai";
import type { AiResponse, Citation, GroundingSource } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = "gemini-2.5-flash";

const systemInstruction = `Eres un asistente de IA de clase mundial, especializado como experto en Derechos Humanos y redactor de documentos legales. Tu misión es proporcionar respuestas precisas y bien fundamentadas utilizando SIEMPRE la búsqueda en tiempo real para encontrar y verificar las fuentes.

REGLAS DE ANÁLISIS Y REDACCIÓN:
1.  **Búsqueda y Verificación**: Para CADA consulta, DEBES usar la búsqueda web para encontrar fuentes autorizadas y verificar la información, especialmente los enlaces. Basa tu respuesta y tus citas en los resultados de la búsqueda.
2.  **Examen de Convencionalidad**: Cuando sea pertinente, realiza un "examen de convencionalidad", comparando la situación consultada con los estándares internacionales encontrados en tu búsqueda.

REGLAS DE FORMATO DE RESPUESTA:
Debes formatear TODA tu respuesta usando Markdown. Utiliza los siguientes encabezados para estructurar tu respuesta. No incluyas ningún otro texto o saludo fuera de esta estructura.

## Respuesta

[Aquí va tu respuesta principal, detallada y bien redactada. Debe ser autocontenida y no referirse a las citas con frases como 'ver abajo'.]

## Citaciones

[Proporciona entre 3 y 5 citas jurisprudenciales relevantes. Para cada cita, usa ESTRICTAMENTE el siguiente formato:]
**Fuente:** [Fuente del documento, ej: Caso Velásquez Rodríguez vs. Honduras, Corte IDH]
**Texto:** 
> [IMPORTANTE: La cita textual aquí debe ser un PÁRRAFO COMPLETO y sustancial del documento original. Usa el formato de bloque de cita de Markdown empezando cada línea con '> '.]
**URL:** [URL funcional y verificada al documento]

---

**Fuente:** [Fuente de la segunda cita]
**Texto:** 
> [Párrafo completo de la segunda cita.]
**URL:** [URL de la segunda cita]

## Preguntas de Seguimiento

[Proporciona tres preguntas de seguimiento relevantes. Cada pregunta debe estar en una nueva línea, precedida por un guion.]
- ¿Cuál es el plazo para presentar una petición ante el sistema interamericano?
- ¿Qué otros casos similares ha tratado la Corte IDH?
- ¿Cómo se aplica este principio en el derecho interno de México?
`;

const parseAiResponse = (text: string): Omit<AiResponse, 'groundingSources'> => {
    const answerMatch = text.match(/## Respuesta\n([\s\S]*?)(?=\n## Citaciones|$)/);
    const answer = answerMatch ? answerMatch[1].trim() : text.trim() || "No se pudo generar una respuesta clara. Por favor, reformule su pregunta.";

    const citations: Citation[] = [];
    const citationsBlockMatch = text.match(/## Citaciones\n([\s\S]*?)(?=\n## Preguntas de Seguimiento|$)/);
    if (citationsBlockMatch) {
        const citationsText = citationsBlockMatch[1];
        const citationEntries = citationsText.split(/\n---\s*\n/);
        for (const entry of citationEntries) {
            const sourceMatch = entry.match(/\*\*Fuente:\*\*\s*(.*)/);
            const quoteMatch = entry.match(/\*\*Texto:\*\*\s*\n((?:>\s?.*\n?)+)/);
            const urlMatch = entry.match(/\*\*URL:\*\*\s*(.*)/);

            if (sourceMatch && quoteMatch) {
                const cleanedQuote = quoteMatch[1].replace(/^>\s?/gm, '').trim();
                citations.push({
                    source: sourceMatch[1].trim(),
                    quote: cleanedQuote,
                    url: urlMatch ? urlMatch[1].trim() : undefined,
                });
            }
        }
    }

    const followUpQuestions: string[] = [];
    const followUpMatch = text.match(/## Preguntas de Seguimiento\n([\s\S]*)/);
    if (followUpMatch && followUpMatch[1]) {
        followUpQuestions.push(...followUpMatch[1].trim().split('\n').map(q => q.replace(/^-/, '').trim()).filter(Boolean));
    }

    return { answer, citations, followUpQuestions };
};

export const getExpertResponse = async (query: string): Promise<AiResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: query,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                tools: [{ googleSearch: {} }],
            },
        });
        
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const webSources: GroundingSource[] = groundingMetadata?.groundingChunks
          ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Fuente sin título',
          }))
          .filter((source: GroundingSource) => source.uri) ?? [];
        
        const uniqueWebSources = Array.from(new Map(webSources.map(item => [item.uri, item])).values());

        const parsedContent = parseAiResponse(response.text);

        return {
            ...parsedContent,
            groundingSources: uniqueWebSources,
        };
        
    } catch (error) {
        console.error("Error fetching expert response from Gemini API:", error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return {
            answer: `Lo siento, ha ocurrido un error al procesar su solicitud. Por favor, inténtelo de nuevo más tarde o simplifique su consulta. Detalles del error: ${errorMessage}`,
            citations: [],
            followUpQuestions: [],
            groundingSources: [],
        };
    }
};