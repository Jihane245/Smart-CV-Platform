public class HostRewritingHandler : DelegatingHandler
{
    private readonly string _from;
    private readonly string _to;

    public HostRewritingHandler(string from, string to)
        : base(new HttpClientHandler())
    {
        _from = from;
        _to = to;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri != null)
        {
            var url = request.RequestUri.ToString().Replace(_from, _to);
            request.RequestUri = new Uri(url);
        }
        return base.SendAsync(request, cancellationToken);
    }
}