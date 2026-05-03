FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY src/SmartCV.API/SmartCV.API.csproj ./src/SmartCV.API/
RUN dotnet restore ./src/SmartCV.API/SmartCV.API.csproj

COPY src/ ./src/
RUN dotnet publish ./src/SmartCV.API/SmartCV.API.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0

# Installer Google Chrome (correction : gnupg au lieu de gnupf)
RUN apt-get update && apt-get install -y wget gnupg && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true


WORKDIR /app
COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000
ENTRYPOINT ["dotnet", "SmartCV.API.dll"]