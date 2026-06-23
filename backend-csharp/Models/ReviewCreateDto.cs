using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace WebFashion.Api.Models
{
    public class ReviewCreateDto
    {
        // Rating (stars) from 1 to 5. Nullable to allow default handling.
        public int? SoSao { get; set; }

        // Review content/text.
        public string? NoiDung { get; set; }

        // Optional order ID the review is linked to.
        public long? DonHangId { get; set; }

        // Optional parent review ID for replies.
        public long? ParentId { get; set; }

        // Uploaded images
        public List<IFormFile>? HinhAnh { get; set; }
    }
}
