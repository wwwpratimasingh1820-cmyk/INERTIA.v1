import CryptoJS from "crypto-js";

const SECRET_SALT = "inertia_secure_salt_2026";

export const AI_PROVIDERS = {
    gemini: {
        name: "Google Gemini",
        defaultModel: "gemini-1.5-flash",
        listModels: async (key) => {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            // Filter models that support generateContent
            return (data.models || [])
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => ({
                    id: m.name.split("/").pop(),
                    name: m.displayName
                }));
        },
        endpoint: (model, key) =>
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        headers: () => ({
            "Content-Type": "application/json"
        }),
        body: (prompt) => ({
            contents: [{ parts: [{ text: prompt }] }]
        }),
        parse: (res) => {
            if (res.error) throw new Error(res.error.message);
            return res.candidates?.[0]?.content?.parts?.[0]?.text || "No response content.";
        }
    },

    openai: {
        name: "OpenAI",
        defaultModel: "gpt-4o-mini",
        stableModels: [
            { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast)" },
            { id: "gpt-4o", name: "GPT-4o (Better)" },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }
        ],
        endpoint: () => "https://api.openai.com/v1/chat/completions",
        headers: (key) => ({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        }),
        body: (prompt, model, options = {}) => ({
            model: model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: options.maxTokens || 1024,
            temperature: options.temperature || 0.7
        }),
        parse: (res) => {
            if (res.error) throw new Error(res.error.message);
            return res.choices?.[0]?.message?.content || "No response content.";
        }
    },

    custom: {
        name: "Custom (Manual)",
        defaultModel: "",
        endpoint: (model, key, base) => base,
        headers: (key) => ({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        }),
        body: (prompt, model, options = {}) => ({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: options.maxTokens || 1024,
            temperature: options.temperature || 0.7
        }),
        parse: (res) => {
            if (res.error) throw new Error(res.error.message);
            return res.choices?.[0]?.message?.content || "No response content.";
        }
    }
};

export async function sendAIMessage(prompt, config) {
    const provider = AI_PROVIDERS[config.provider];
    if (!provider) throw new Error("Invalid provider.");

    let apiKey = config.apiKey;
    if (apiKey && apiKey.startsWith("U2FsdGVkX1")) {
        try {
            const bytes = CryptoJS.AES.decrypt(apiKey, SECRET_SALT);
            apiKey = bytes.toString(CryptoJS.enc.Utf8);
        } catch (err) {
            console.error("AI Key Decryption failed");
        }
    }

    const endpoint = provider.endpoint(config.model, apiKey, config.baseUrl);

    const response = await fetch(endpoint, {
        method: "POST",
        headers: provider.headers(apiKey),
        body: JSON.stringify(
            provider.body(prompt, config.model, {
                maxTokens: config.maxTokens,
                temperature: config.temperature
            })
        )
    });

    const data = await response.json();
    return provider.parse(data);
}
