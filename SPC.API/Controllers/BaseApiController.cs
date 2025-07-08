// Controllers/BaseApiController.cs
using Microsoft.AspNetCore.Mvc;

namespace SPC.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
}