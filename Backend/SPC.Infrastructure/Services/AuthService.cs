// File: SPC.Infrastructure/Services/AuthService.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SPC.Core.DTOs.Authentication;
using SPC.Core.Entities;
using SPC.Core.Interfaces.Services;
using AutoMapper;
using System.Security.Claims;

namespace SPC.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;

    public AuthService(
        UserManager<User> userManager,
        ITokenService tokenService,
        IMapper mapper)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _mapper = mapper;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

#pragma warning disable CS8601 // Possible null reference assignment.
        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Email = user.Email,
            UserId = user.Id,
            Roles = [.. roles]
        };
#pragma warning restore CS8601 // Possible null reference assignment.
    }

    public async Task<AuthResponseDto> RegisterAsync(SignUpDto signUpDto)
    {
        var existingUser = await _userManager.FindByEmailAsync(signUpDto.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        var user = new User
        {
            UserName = signUpDto.Email,
            Email = signUpDto.Email,
            FirstName = signUpDto.FirstName,
            LastName = signUpDto.LastName
        };

        var result = await _userManager.CreateAsync(user, signUpDto.Password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        // Assign default role
        await _userManager.AddToRoleAsync(user, "User");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Email = user.Email,
            UserId = user.Id,
            Roles = roles.ToList()
        };
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiryTime > DateTime.UtcNow);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

#pragma warning disable CS8601 // Possible null reference assignment.
        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            Email = user.Email,
            UserId = user.Id,
            Roles = [.. roles]
        };
#pragma warning restore CS8601 // Possible null reference assignment.
    }

    public async Task<bool> RevokeRefreshTokenAsync(string userEmail)
    {
        var user = await _userManager.FindByEmailAsync(userEmail);
        if (user == null)
        {
            return false;
        }

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);

        return result.Succeeded;
    }
}
