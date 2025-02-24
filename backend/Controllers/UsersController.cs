using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly MySqlDbContext _dbContext;
        public UsersController(MySqlDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _dbContext.Users.ToListAsync();
            return Ok(users);
        }
        [HttpGet]
        public async Task<IActionResult> GetUserAssignments(int userId)
        {
            var assignments = await _dbContext.Users
                .Include(u => u.UserAssignments)
                .ThenInclude(ua => ua.Assignment)
                .FirstOrDefaultAsync(u => u.UserId == userId);
            return Ok(assignments?.UserAssignments);
        }
    }
}