// File: SPC.Core/DTOs/Authentication/LoginDto.cs
namespace SPC.Core.DTOs.Authentication;

public class LoginDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}
