using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNameToCvPdf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Nom",
                table: "CvPdf",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Prenom",
                table: "CvPdf",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nom",
                table: "CvPdf");

            migrationBuilder.DropColumn(
                name: "Prenom",
                table: "CvPdf");
        }
    }
}
