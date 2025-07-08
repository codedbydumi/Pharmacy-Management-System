// File: SPC.API/Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using SPC.Core.DTOs.Authentication;
using SPC.Core.Interfaces.Services;

namespace SPC.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="loginDto">The login credentials</param>
    /// <returns>Authentication response with tokens</returns>
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var response = await _authService.LoginAsync(loginDto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Failed login attempt for user {Email}", loginDto.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while logging in user {Email}", loginDto.Email);
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Registers a new user
    /// </summary>
    /// <param name="signUpDto">The registration information</param>
    /// <returns>Authentication response with tokens</returns>
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] SignUpDto signUpDto)
    {
        try
        {
            var response = await _authService.RegisterAsync(signUpDto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed for email {Email}", signUpDto.Email);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while registering user {Email}", signUpDto.Email);
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Refreshes an expired access token using a refresh token
    /// </summary>
    /// <param name="refreshToken">The refresh token</param>
    /// <returns>New authentication response with new tokens</returns>
    [HttpPost("refresh-token")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] string refreshToken)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(refreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Token refresh failed");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while refreshing token");
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Revokes the refresh token for a user
    /// </summary>
    /// <param name="userEmail">The email of the user</param>
    /// <returns>Success status</returns>
    [HttpPost("revoke")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RevokeToken([FromBody] string userEmail)
    {
        try
        {
            var result = await _authService.RevokeRefreshTokenAsync(userEmail);
            if (result)
            {
                return Ok(new { message = "Token revoked successfully" });
            }
            return BadRequest(new { message = "Failed to revoke token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while revoking token for user {Email}", userEmail);
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }
}