FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY src/SmartCV.API/SmartCV.API.csproj ./src/SmartCV.API/
RUN dotnet restore ./src/SmartCV.API/SmartCV.API.csproj

COPY src/ ./src/
RUN dotnet publish ./src/SmartCV.API/SmartCV.API.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000
ENTRYPOINT ["dotnet", "SmartCV.API.dll"]