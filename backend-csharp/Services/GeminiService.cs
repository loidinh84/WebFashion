using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace WebFashion.Api.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string? _apiKey;

        public GeminiService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _apiKey = configuration["Gemini:ApiKey"];
        }

        private async Task<string> CallGeminiWithRetryAsync(object payload, string model)
        {
            int retries = 3;
            int delayMs = 1500;
            Exception? lastEx = null;

            for (int i = 0; i < retries; i++)
            {
                try
                {
                    using var client = _httpClientFactory.CreateClient();
                    var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_apiKey}";
                    
                    var res = await client.PostAsJsonAsync(url, payload);
                    
                    if (res.StatusCode == HttpStatusCode.TooManyRequests || res.StatusCode == HttpStatusCode.ServiceUnavailable)
                    {
                        throw new HttpRequestException("Gemini API overloaded or rate limited", null, res.StatusCode);
                    }

                    res.EnsureSuccessStatusCode();
                    var responseBody = await res.Content.ReadFromJsonAsync<JsonElement>();
                    
                    // Parse response to extract the generated text
                    if (responseBody.TryGetProperty("candidates", out var candidates) && candidates.ValueKind == JsonValueKind.Array)
                    {
                        var firstCandidate = candidates[0];
                        if (firstCandidate.TryGetProperty("content", out var contentObj) &&
                            contentObj.TryGetProperty("parts", out var partsObj) &&
                            partsObj.ValueKind == JsonValueKind.Array)
                        {
                            var text = partsObj[0].GetProperty("text").GetString();
                            return text ?? "";
                        }
                    }

                    throw new Exception("Cấu trúc phản hồi từ Gemini API không hợp lệ.");
                }
                catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests || ex.StatusCode == HttpStatusCode.ServiceUnavailable)
                {
                    lastEx = ex;
                    if (i < retries - 1)
                    {
                        await Task.Delay(delayMs);
                        delayMs *= 2;
                    }
                }
                catch (Exception ex)
                {
                    lastEx = ex;
                    throw; // For other errors, fail immediately
                }
            }

            throw lastEx ?? new Exception("Không thể kết nối đến Gemini API sau nhiều lần thử.");
        }

        private async Task<string> CallGeminiWithFallbackAndRetryAsync(object payload, string initialModel)
        {
            var modelsToTry = new[] { initialModel, "gemini-2.0-flash-lite", "gemini-2.0-flash" };
            Exception? lastError = null;

            foreach (var model in modelsToTry)
            {
                try
                {
                    return await CallGeminiWithRetryAsync(payload, model);
                }
                catch (Exception ex)
                {
                    lastError = ex;
                    Console.WriteLine($"[Gemini Error for model {model}]: {ex.Message}. Thử model tiếp theo...");
                }
            }

            throw lastError ?? new Exception("Tất cả các model Gemini đều thất bại.");
        }

        public async Task<string> ChatWithAIAsync(string systemInstruction, List<GeminiMessage> history, string message, string model = "gemini-3.1-flash-lite")
        {
            // Build the contents list
            var contents = new List<object>();
            
            // Add history
            foreach (var msg in history)
            {
                contents.Add(new
                {
                    role = msg.Role,
                    parts = msg.Parts.Select(p => new { text = p.Text }).ToArray()
                });
            }

            // Add the new message
            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = message } }
            });

            // Build payload
            var payload = new Dictionary<string, object>
            {
                { "contents", contents }
            };

            if (!string.IsNullOrEmpty(systemInstruction))
            {
                payload.Add("systemInstruction", new
                {
                    parts = new[] { new { text = systemInstruction } }
                });
            }

            return await CallGeminiWithFallbackAndRetryAsync(payload, model);
        }

        public async Task<string> GenerateContentAsync(string systemInstruction, string prompt, string model = "gemini-3.1-flash-lite")
        {
            var contents = new List<object>
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = prompt } }
                }
            };

            var payload = new Dictionary<string, object>
            {
                { "contents", contents }
            };

            if (!string.IsNullOrEmpty(systemInstruction))
            {
                payload.Add("systemInstruction", new
                {
                    parts = new[] { new { text = systemInstruction } }
                });
            }

            return await CallGeminiWithFallbackAndRetryAsync(payload, model);
        }
    }
}
