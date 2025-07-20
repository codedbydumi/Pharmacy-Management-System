// File: SPC.Core/Interfaces/Services/IAuthService.cs
using SPC.Core.DTOs.Authentication;

namespace SPC.Core.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> RegisterAsync(SignUpDto signUpDto);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeRefreshTokenAsync(string userEmail);
}
