// File: SPC.Core/DTOs/Authentication/SignUpDto.cs
namespace SPC.Core.DTOs.Authentication;

public class SignUpDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
}