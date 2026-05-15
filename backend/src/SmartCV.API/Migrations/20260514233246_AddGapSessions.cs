using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGapSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Competences_Nom",
                table: "Competences");

            migrationBuilder.DropIndex(
                name: "IX_Competences_ProfilId",
                table: "Competences");

            migrationBuilder.CreateTable(
                name: "GapSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TexteOffre = table.Column<string>(type: "text", nullable: false),
                    TitreOffre = table.Column<string>(type: "text", nullable: true),
                    Entreprise = table.Column<string>(type: "text", nullable: true),
                    ScoreCompatibilite = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GapSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GapSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GapSessionSkills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GapSessionId = table.Column<int>(type: "integer", nullable: false),
                    NomCompetence = table.Column<string>(type: "text", nullable: false),
                    Priorite = table.Column<string>(type: "text", nullable: false),
                    RoadmapId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GapSessionSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GapSessionSkills_GapSessions_GapSessionId",
                        column: x => x.GapSessionId,
                        principalTable: "GapSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GapSessionSkills_Roadmaps_RoadmapId",
                        column: x => x.RoadmapId,
                        principalTable: "Roadmaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Competences_ProfilId_Nom",
                table: "Competences",
                columns: new[] { "ProfilId", "Nom" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GapSessions_UserId",
                table: "GapSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GapSessionSkills_GapSessionId",
                table: "GapSessionSkills",
                column: "GapSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_GapSessionSkills_RoadmapId",
                table: "GapSessionSkills",
                column: "RoadmapId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GapSessionSkills");

            migrationBuilder.DropTable(
                name: "GapSessions");

            migrationBuilder.DropIndex(
                name: "IX_Competences_ProfilId_Nom",
                table: "Competences");

            migrationBuilder.CreateIndex(
                name: "IX_Competences_Nom",
                table: "Competences",
                column: "Nom",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Competences_ProfilId",
                table: "Competences",
                column: "ProfilId");
        }
    }
}
