using backend.Controllers;
using backend.Database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Setup database
builder.Services.AddDbContext<MySqlDbContext>(options =>
{
    options.UseMySQL("server=localhost;database=library;user=user;password=password");
});

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapControllers();

app.Run();
