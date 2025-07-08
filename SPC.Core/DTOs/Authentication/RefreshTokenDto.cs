using System.ComponentModel.DataAnnotations;

namespace SPC.Core.DTOs.Authentication;

public class RefreshTokenDto
{
    [Required]
    public required string Token { get; set; }
}