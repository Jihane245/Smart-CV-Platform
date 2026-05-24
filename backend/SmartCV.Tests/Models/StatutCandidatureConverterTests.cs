using API.models.Enums;
using FluentAssertions;

namespace SmartCV.Tests.Models;

public class StatutCandidatureConverterTests
{
    [Theory]
    [InlineData("enregistrée", StatutCandidature.enregistree)]
    [InlineData("enregistree", StatutCandidature.enregistree)]
    [InlineData("enregistre", StatutCandidature.enregistree)]
    [InlineData("envoyée", StatutCandidature.envoyee)]
    [InlineData("acceptee", StatutCandidature.acceptee)]
    public void FromDb_devrait_accepter_les_variantes(string input, StatutCandidature expected)
    {
        StatutCandidatureConverter.FromDb(input).Should().Be(expected);
    }

    [Fact]
    public void ToDb_devrait_retourner_identifiant_ascii()
    {
        StatutCandidatureConverter.ToDb(StatutCandidature.enregistree).Should().Be("enregistree");
    }
}
