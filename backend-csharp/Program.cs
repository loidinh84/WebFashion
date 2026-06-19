using System.IO;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebFashion.Api.Models;
using WebFashion.Api.Services;

// 1. Load local .env file if it exists at startup
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            var envKey = parts[0].Trim();
            var envVal = parts[1].Trim();
            Environment.SetEnvironmentVariable(envKey, envVal);
        }
    }
}

// 2. Map standard environment variables to ASP.NET Core Configuration mapping format
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER") ?? "127.0.0.1";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "1433";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "WEBECOMMERCE";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
var dbPwd = Environment.GetEnvironmentVariable("DB_PWD") ?? "123456";

var connectionString = $"Server={dbServer},{dbPort};Database={dbName};User Id={dbUser};Password={dbPwd};TrustServerCertificate=True;";
Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", connectionString);

var geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
if (!string.IsNullOrEmpty(geminiApiKey))
{
    Environment.SetEnvironmentVariable("Gemini__ApiKey", geminiApiKey);
}

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (!string.IsNullOrEmpty(jwtSecret))
{
    Environment.SetEnvironmentVariable("Jwt__Secret", jwtSecret);
}

var meiliHost = Environment.GetEnvironmentVariable("MEILI_HOST");
if (!string.IsNullOrEmpty(meiliHost))
{
    Environment.SetEnvironmentVariable("MeiliSearch__Host", meiliHost);
}

var meiliKey = Environment.GetEnvironmentVariable("MEILI_API_KEY");
if (!string.IsNullOrEmpty(meiliKey))
{
    Environment.SetEnvironmentVariable("MeiliSearch__ApiKey", meiliKey);
}

// 3. Initialize builder
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Register HttpClient
builder.Services.AddHttpClient();

// Register Auxiliary Services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IMeiliSearchService, MeiliSearchService>();
builder.Services.AddScoped<IGeminiService, GeminiService>();

// Configure EF Core with SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure JWT Authentication
var actualJwtSecret = builder.Configuration["Jwt:Secret"] ?? "ma_bao_mat";
var key = Encoding.UTF8.GetBytes(actualJwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("CorsPolicy");

// Enable Auth Middlewares
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
