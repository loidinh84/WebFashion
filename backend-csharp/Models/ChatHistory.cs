using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ChatHistory
{
    public int Id { get; set; }

    public string Role { get; set; } = null!;

    public string Text { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
