using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace backend.Database.Model
{
    [PrimaryKey("AssignmentId", "UserId")]
    public class UserAssignment
    {
        [ForeignKey("Assignment")]
        public int AssignmentId { get; set; }
        public Assignment Assignment { get; set; } = null!;
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Description { get; set; } = null!;
    }
}