using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations;

/// <inheritdoc />
public partial class NormalizeCandidatureStatut : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE "Candidatures" SET "Statut" = 'enregistree'
            WHERE "Statut" IN ('enregistrée', 'enregistree') OR "Statut" ILIKE 'enregistr%';

            UPDATE "Candidatures" SET "Statut" = 'envoyee'
            WHERE "Statut" IN ('envoyée', 'envoyee') OR "Statut" ILIKE 'envoy%';

            UPDATE "Candidatures" SET "Statut" = 'recue'
            WHERE "Statut" IN ('reçue', 'recue') OR ("Statut" ILIKE 're%' AND "Statut" ILIKE '%ue%');

            UPDATE "Candidatures" SET "Statut" = 'acceptee'
            WHERE "Statut" IN ('acceptée', 'acceptee') OR "Statut" ILIKE 'accept%';

            UPDATE "Candidatures" SET "Statut" = 'refusee'
            WHERE "Statut" IN ('refusée', 'refusee') OR "Statut" ILIKE 'refus%';

            UPDATE "Candidatures" SET "Statut" = 'archivee'
            WHERE "Statut" IN ('archivée', 'archivee') OR "Statut" ILIKE 'archiv%';
            """);

        migrationBuilder.AlterColumn<string>(
            name: "Statut",
            table: "Candidatures",
            type: "text",
            nullable: false,
            defaultValue: "enregistree",
            oldClrType: typeof(string),
            oldType: "text",
            oldDefaultValue: "enregistrée");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Statut",
            table: "Candidatures",
            type: "text",
            nullable: false,
            defaultValue: "enregistrée",
            oldClrType: typeof(string),
            oldType: "text",
            oldDefaultValue: "enregistree");
    }
}
