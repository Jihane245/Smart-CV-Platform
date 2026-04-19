FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# 🔥 FIX AUTH / KERBEROS / POSTGRES / OIDC
RUN apt-get update && apt-get install -y \
    libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000
ENTRYPOINT ["dotnet", "SmartCV.API.dll"]