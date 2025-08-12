import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function gemini(ediData) {
 const prompt = `
    Generate a ${ediData.questionCount}-question quiz on the topic of "${ediData.topic}".

    Include a relevant but neutral **title** and **description** for the quiz that do **not reveal or hint at any answers**.
    
    **The level should be  "${ediData.difficulty}".
    Include ${ediData.mcqCount} multiple choice questions (MCQs) and ${ediData.numericalCount} numerical answer type (NAT) questions.
    Each MCQ must have exactly ${ediData.optionsCount} options **as plain strings without any alphabetical labels (A, B, C, etc.)**.
    Indicate the correct answer clearly for each question.
    NAT type question should have Numrical value ans not text.
   

    **Avoid the following:**
    1. Repeating or directly referencing the topic word in a way that gives away the answer.
    2. Using the quiz title, description, or question phrasing to hint at or reveal the correct answer (e.g., referencing "she" when the answer is Indira Gandhi).
    3. Using pronouns or hints like "this leader", "this movement", "he/she", etc., which could help guess the answer.
    4. Creating leading or biased questions.

    **Ensure:**
    1. Only include the topic word if necessary and only when it does not compromise the integrity of the question.
    2. The title and description should be engaging but neutral and not answer-revealing.

    Format the output as a **object** with the following structure:

    {
      "title": "Quiz Title",
      "description": "Quiz Description",
      "questions": [
        {
          "type": "MCQ",
          "question": "Your question here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Correct Option"
        },
        {
          "type": "NAT",
          "question": "Your question here",
          "answer": "Correct numerical answer"
        }
      ]
    }
    **Note:**
    You should return only *object* not json or any other type dont add any text;
    title should contain the topic word.
    Only use "MCQ" or "NAT" as values for the "type" field.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
    });

    const rawText = response.text.trim();
    const cleanText = rawText.replace(/^```json\s*|\s*```$/g, '');
    const data = JSON.parse(cleanText);

    return data;

  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export default gemini;
