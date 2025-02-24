using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Database.Model
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string HashedPassword { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public UserRoleEnum UserRole { get; set; }
        public List<UserAssignment> UserAssignments { get; set; } = new List<UserAssignment>();
        public enum UserRoleEnum {
            Employee,
            Manager
        }
    }
}