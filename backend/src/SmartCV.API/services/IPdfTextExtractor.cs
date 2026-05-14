namespace API.services;

public interface IPdfTextExtractor
{
    string ExtractText(Stream pdfStream);
}
