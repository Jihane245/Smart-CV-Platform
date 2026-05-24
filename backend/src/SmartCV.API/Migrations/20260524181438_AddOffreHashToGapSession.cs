using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOffreHashToGapSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OffreHash",
                table: "GapSessions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OffreHash",
                table: "GapSessions");
        }
    }
}
