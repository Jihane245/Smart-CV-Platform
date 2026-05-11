using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCvIdToLettreMotivation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CvId",
                table: "LettresMotivation",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LettresMotivation_CvId",
                table: "LettresMotivation",
                column: "CvId");

            migrationBuilder.AddForeignKey(
                name: "FK_LettresMotivation_Cvs_CvId",
                table: "LettresMotivation",
                column: "CvId",
                principalTable: "Cvs",
                principalColumn: "IdCv",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LettresMotivation_Cvs_CvId",
                table: "LettresMotivation");

            migrationBuilder.DropIndex(
                name: "IX_LettresMotivation_CvId",
                table: "LettresMotivation");

            migrationBuilder.DropColumn(
                name: "CvId",
                table: "LettresMotivation");
        }
    }
}
