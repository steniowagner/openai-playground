export const SUMMARIZE_DOCUMENT = "Summarize this document";

export const REPHRASE_TEXT = `
Create a clear, concise, and effective standalone rephrased version of the text provided below.

Text:
[text]

Rephrased standalone text:
`;

export const REPHRASE_QUESTION = `
As an AI language model, your task is to create a clear, concise, and effective standalone rephrased version of a text based on the conversation history and a related follow-up question provided below. Make sure your rephrased question captures the core intent of the follow-up question without relying on the conversation context.

Conversation history:
[chat_history]

Related follow-up question: [question]
Rephrased standalone question:`;

export const QA_PROMPT = `
Question: [question]
=========
Context: [context]
=========
Answer:`;

export const LEARNING_OBJECTIVE_PROMPT = `
learning_objective: [learning_objective]
================
context: [context]
`;
