using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Database.Model
{
    public class Assignment
    {
        [Key]
        public int AssignmentId { get; set; }
        public DateTime TimeStart { get; set; }
        public DateTime TimeEnd { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public List<UserAssignment> UserAssignments { get; set; } = new List<UserAssignment>();
    }
}