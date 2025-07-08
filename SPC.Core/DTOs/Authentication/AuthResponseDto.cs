// File: SPC.Core/DTOs/Authentication/AuthResponseDto.cs
namespace SPC.Core.DTOs.Authentication;

public class AuthResponseDto
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
    public required string Email { get; set; }
    public int UserId { get; set; }
    public required List<string> Roles { get; set; }
}