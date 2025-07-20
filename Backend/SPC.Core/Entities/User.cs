// File: SPC.Core/Entities/User.cs
using Microsoft.AspNetCore.Identity;

namespace SPC.Core.Entities;

public class User : IdentityUser<int>
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime RefreshTokenExpiryTime { get; set; }
}