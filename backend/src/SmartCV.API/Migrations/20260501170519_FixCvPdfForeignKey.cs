using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCV.API.Migrations
{
    /// <inheritdoc />
    public partial class FixCvPdfForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CvPdf_Cvs_CvId",
                table: "CvPdf");

            migrationBuilder.AddForeignKey(
                name: "FK_CvPdf_CvsPersonnalises_CvId",
                table: "CvPdf",
                column: "CvId",
                principalTable: "CvsPersonnalises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CvPdf_CvsPersonnalises_CvId",
                table: "CvPdf");

            migrationBuilder.AddForeignKey(
                name: "FK_CvPdf_Cvs_CvId",
                table: "CvPdf",
                column: "CvId",
                principalTable: "Cvs",
                principalColumn: "IdCv",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
