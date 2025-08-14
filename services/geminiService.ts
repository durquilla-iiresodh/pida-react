import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AiResponse, Citation, GroundingSource } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = "gemini-2.5-flash";

const systemInstruction = `Eres un asistente de IA de clase mundial, especializado como experto en Derechos Humanos y redactor de documentos legales. Tu misión es proporcionar análisis y redacción estratégica, precisa y bien fundamentada.

ROL PRINCIPAL CON DOCUMENTOS ADJUNTOS:
Cuando el usuario adjunta uno o más documentos, tu rol principal es actuar como un abogado experto que analiza y redacta. Tus tareas específicas son:
- **Revisión Crítica**: Evaluar si un escrito está bien redactado, si cumple con los requisitos formales o sustantivos, y señalar sus fortalezas y debilidades. Por ejemplo, "Revisa este escrito de demanda y dime si puede mejorarse".
- **Propuesta de Estrategias**: Basado en el análisis de un documento (como una sentencia o un informe), proponer estrategias legales claras y accionables. Por ejemplo, "Con base en esta sentencia, ¿qué estrategia de apelación recomiendas?".
- **Redacción y Mejora de Documentos**: Redactar borradores de nuevos documentos (demandas, recursos, oficios) o reescribir y mejorar textos existentes para hacerlos más persuasivos, claros y técnicamente sólidos. Por ejemplo, "Elabora un borrador de apelación contra esta sentencia" o "Mejora la sección de argumentos de este escrito".

REGLAS GENERALES DE ANÁLISIS Y RESPUESTA:
1.  **Prioridad del Documento**: Si el usuario adjunta uno o más documentos (indicados en "Contexto de Documentos Adjuntos"), DEBES basar tu respuesta PRIMARIAMENTE en el contenido de ESOS documentos. Tu tarea es trabajar CON y SOBRE los documentos.
2.  **Búsqueda Complementaria**: Utiliza la búsqueda web para COMPLEMENTAR tu análisis con jurisprudencia, doctrina o legislación relevante que fortalezca tu propuesta. La búsqueda debe enriquecer tu respuesta, no ser la base cuando hay un documento. Cuando no se adjunta un documento, basa tu respuesta principalmente en la búsqueda.
3.  **Prioridad de Fuentes Originales**: Al citar jurisprudencia (por ejemplo, un caso de la Corte Interamericana de Derechos Humanos), DEBES priorizar la consulta y el enlace a la fuente original o primaria (el sitio web oficial de la corte, la publicación oficial del fallo, etc.). Evita citar fuentes secundarias o interpretaciones si la fuente primaria está disponible.
4.  **Examen de Convencionalidad**: Cuando sea pertinente, realiza un "examen de convencionalidad", comparando la situación consultada con los estándares internacionales de Derechos Humanos, especialmente los del Sistema Interamericano.
5.  **Redacción Proactiva en Preguntas de Seguimiento**: Si la conversación sugiere la necesidad de un documento legal (demanda, recurso, denuncia, etc.), una de las "Preguntas de Seguimiento" DEBE ser una oferta para redactarlo.
    - **Ejemplo**: \`¿Quieres que elabore un borrador de la [nombre del documento] con la información proporcionada?\`
    - **Uso de Información**: Para esta redacción, DEBES utilizar toda la información ya proporcionada en la conversación y en cualquier documento adjunto.
    - **Minimizar Preguntas Adicionales**: NO preguntes por más información a menos que un dato sea absolutamente crítico y falte por completo (ej. el nombre de la parte demandada). Intenta siempre generar un borrador completo y robusto con los datos que ya tienes, indicando con placeholders (ej: \`[NOMBRE DEL DEMANDANTE]\`) la información que el usuario deba completar.

REGLAS DE FORMATO DE RESPUESTA:
Formatea TODA tu respuesta usando Markdown. Adapta la estructura de tu respuesta a la pregunta del usuario.
- **Para consultas generales o teóricas**, usa la estructura de tres partes: \`## Respuesta\`, \`## Fuentes y Jurisprudencia\`, y \`## Preguntas de Seguimiento\`.
- **Si se te pide mejorar o analizar un texto**, usa encabezados descriptivos como \`## Análisis del Documento Original\`, \`## Puntos de Mejora\` y \`## Propuesta de Texto Mejorado\`.
- **Si se te pide redactar un nuevo documento**, usa un encabezado como \`## Propuesta de Borrador: [Nombre del Documento]\`.

Independientemente de la estructura, si utilizas fuentes externas para fundamentar tu análisis o redacción, SIEMPRE debes incluir la sección \`## Fuentes y Jurisprudencia\` al final con las referencias correspondientes.

### Ejemplo de Estructura para Consulta General

## Respuesta
[Aquí va tu respuesta principal, detallada y bien redactada.]

## Fuentes y Jurisprudencia
[Proporciona entre 3 y 5 citas relevantes. Formato estricto:]
**Fuente:** [Fuente del documento, ej: Caso Velásquez Rodríguez vs. Honduras, Corte IDH]
**Texto:** 
> [PÁRRAFO COMPLETO y sustancial del documento original. Usa el formato de bloque de cita de Markdown.]
**URL:** [URL funcional y verificada al documento]

## Preguntas de Seguimiento
[Proporciona tres preguntas de seguimiento relevantes.]
- ¿Cuál es el plazo para presentar una petición ante el sistema interamericano?
- ¿Qué otros casos similares ha tratado la Corte IDH?
- ¿Cómo se aplica este principio en el derecho interno de México?
`;

const parseAiResponse = (text: string): Omit<AiResponse, 'groundingSources'> => {
    // The main answer is the full text minus the sections that are parsed out separately.
    const answer = text
        .replace(/\n?## Fuentes y Jurisprudencia[\s\S]*/, '')
        .replace(/\n?## Preguntas de Seguimiento[\s\S]*/, '')
        .trim();

    const citations: Citation[] = [];
    const citationsBlockMatch = text.match(/## Fuentes y Jurisprudencia\n([\s\S]*?)(?=\n## Preguntas de Seguimiento|$)/);
    if (citationsBlockMatch) {
        const citationsText = citationsBlockMatch[1];
        const citationEntries = citationsText.split(/\n---\s*\n|\n\*\*Fuente:\*\*/).filter(Boolean);
        for (const entry of citationEntries) {
            const sourceMatch = entry.match(/^(.*)/); // Adjusted to catch source at start
            const quoteMatch = entry.match(/\*\*Texto:\*\*\s*\n((?:>\s?.*\n?)+)/);
            const urlMatch = entry.match(/\*\*URL:\*\*\s*(.*)/);

            if (sourceMatch && quoteMatch) {
                const sourceText = sourceMatch[1].trim().startsWith('**Fuente:**') ? sourceMatch[1].replace('**Fuente:**', '').trim() : sourceMatch[1].trim();

                const cleanedQuote = quoteMatch[1].replace(/^>\s?/gm, '').trim();
                citations.push({
                    source: sourceText,
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

export const getExpertResponse = async (
    query: string, 
    documentContext: string | null,
    onStreamUpdate: (chunk: string) => void
): Promise<AiResponse> => {
    try {
        let finalQuery = query;
        if (documentContext) {
            finalQuery = `**Contexto de Documentos Adjuntos:**\n\n---\n${documentContext}\n---\n\n**Pregunta del Usuario:**\n\n${query}`;
        }

        const stream = await ai.models.generateContentStream({
            model: model,
            contents: { parts: [{ text: finalQuery }] },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                tools: [{ googleSearch: {} }],
            },
        });
        
        let fullResponseText = '';
        const webSourcesMap = new Map<string, GroundingSource>();

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponseText += chunkText;
                onStreamUpdate(chunkText);
            }
            
            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
            const sources: GroundingSource[] = groundingMetadata?.groundingChunks
              ?.map((c: any) => ({
                uri: c.web?.uri || '',
                title: c.web?.title || 'Fuente sin título',
              }))
              .filter((source: GroundingSource) => source.uri) ?? [];
            
            for (const source of sources) {
                if (!webSourcesMap.has(source.uri)) {
                    webSourcesMap.set(source.uri, source);
                }
            }
        }
        
        const uniqueWebSources = Array.from(webSourcesMap.values());
        const parsedData = parseAiResponse(fullResponseText);

        return {
            answer: parsedData.answer, 
            citations: parsedData.citations,
            followUpQuestions: parsedData.followUpQuestions,
            groundingSources: uniqueWebSources,
        };
        
    } catch (error) {
        console.error("Error fetching expert response from Gemini API:", error);
        throw error; // Propagate error to be handled by the UI component
    }
};
