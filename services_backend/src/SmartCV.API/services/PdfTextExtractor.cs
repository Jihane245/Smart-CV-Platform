using System.Text;
using UglyToad.PdfPig;

namespace API.services;

public class PdfTextExtractor : IPdfTextExtractor
{
    public string ExtractText(Stream pdfStream)
    {
        var sb = new StringBuilder();
        using var doc = PdfDocument.Open(pdfStream);
        foreach (var page in doc.GetPages())
        {
            sb.AppendLine(page.Text);
        }
        return sb.ToString();
    }
}
