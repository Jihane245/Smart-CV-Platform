using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateStructureJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StructureJson",
                table: "Templates",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StructureJson",
                table: "Templates");
        }
    }
}
