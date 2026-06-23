using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebFashion.Api.Services
{
    public class GeminiMessage
    {
        public string Role { get; set; } = null!; // "user" or "model"
        public List<GeminiPart> Parts { get; set; } = new();
    }

    public class GeminiPart
    {
        public string Text { get; set; } = null!;
    }

    public interface IGeminiService
    {
        Task<string> ChatWithAIAsync(string systemInstruction, List<GeminiMessage> history, string message, string model = "gemini-3.1-flash-lite");
        Task<string> GenerateContentAsync(string systemInstruction, string prompt, string model = "gemini-3.1-flash-lite");
    }
}
