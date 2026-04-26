using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCvPersonnalise : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CvsPersonnalises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TemplateId = table.Column<int>(type: "integer", nullable: false),
                    CouleurPrimaire = table.Column<string>(type: "text", nullable: true),
                    CouleurSecondaire = table.Column<string>(type: "text", nullable: true),
                    CouleurTexte = table.Column<string>(type: "text", nullable: true),
                    Police = table.Column<string>(type: "text", nullable: true),
                    TaillePolice = table.Column<string>(type: "text", nullable: true),
                    ContenuJson = table.Column<string>(type: "text", nullable: true),
                    Langue = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CvsPersonnalises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CvsPersonnalises_Templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "Templates",
                        principalColumn: "IdTemp",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CvsPersonnalises_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CvsPersonnalises_TemplateId",
                table: "CvsPersonnalises",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CvsPersonnalises_UserId",
                table: "CvsPersonnalises",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CvsPersonnalises");
        }
    }
}
