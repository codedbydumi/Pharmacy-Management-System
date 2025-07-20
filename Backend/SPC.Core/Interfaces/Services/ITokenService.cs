// File: SPC.Core/Interfaces/Services/ITokenService.cs
using System.Security.Claims;
using SPC.Core.Entities;

namespace SPC.Core.Interfaces.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user, IList<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
}